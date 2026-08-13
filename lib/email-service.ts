/**
 * TrueOps Email Framework v1.0
 *
 * Product-agnostic email infrastructure. The core section (below the first
 * divider) contains no product-specific logic and can be reused across all
 * TrueOps applications unchanged.
 *
 * The PoultryOps section (below the second divider) contains the named
 * email functions for this product. To port to another TrueOps product,
 * replace only this section and the templates it imports.
 *
 * Every exported function is independently callable and testable.
 * This module has no dependency on HTTP request objects or Next.js internals.
 */

import { Resend } from "resend"
import { supabaseAdmin } from "@/lib/supabase-admin"
import {
  welcomeEmailTemplate,
  invitationEmailTemplate,
  trial3DaysTemplate,
  trial1DayTemplate,
  trialExpiredTemplate,
  paymentReceivedTemplate,
  subscriptionActivatedTemplate,
  subscriptionRenewedTemplate,
} from "@/lib/email-templates"

// ============================================================
// TrueOps Email Framework Core
// No product-specific logic below this line until the next divider.
// ============================================================

type EmailEventMetadata = Record<string, string | number | boolean | null | undefined>
export type TrialEmailType = "trial_3_days" | "trial_1_day" | "trial_expired"

/**
 * Initialises the Resend client from environment.
 * Throws if RESEND_API_KEY is absent so callers receive a clear error.
 */
function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured")
  return new Resend(apiKey)
}

/**
 * Returns the Supabase admin client.
 * Delegates to the existing application helper — does not create a second client.
 */
function getSupabase() {
  return supabaseAdmin
}

/**
 * Core send function. All emails go through here.
 * Reads EMAIL_FROM env var so the sender name is configurable per product.
 */
async function dispatchEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const resend = getResend()
  const from = process.env.EMAIL_FROM ?? "TrueOps <support@trueops.app>"

  console.log("[RESEND] Preparing email send:", {
    to,
    from,
    subject,
  })

  const { error: resendError } = await resend.emails.send({
    from,
    to,
    subject,
    html,
  })

  if (resendError) {
    console.error("[RESEND] Delivery error:", resendError)
    throw new Error(`Resend delivery error: ${resendError.message}`)
  }

  console.log("[RESEND] Email accepted for delivery:", {
    to,
    subject,
  })
}

/**
 * Writes one row to email_events for audit purposes.
 * Called after a successful send — never before.
 */
async function recordEmailEvent(
  userId: string,
  eventType: string,
  email: string,
  metadata?: EmailEventMetadata
): Promise<void> {
  const supabase = getSupabase()

  const { error } = await supabase.from("email_events").insert({
    user_id: userId,
    event_type: eventType,
    email,
    sent_at: new Date().toISOString(),
    metadata: metadata ?? null,
  })

  if (error) {
    console.error("[email] Failed to record email event:", error)
    return
  }

  console.log(
    `[email] Email event recorded: ${eventType} for ${email}`
  )
}

/**
 * Deduplication check for lifecycle emails.
 * Returns true if this event type has already been sent to this user.
 * Transactional events bypass this — they call dispatchEmail directly.
 */
async function emailAlreadySent(
  userId: string,
  eventType: string
): Promise<boolean> {
  const supabase = getSupabase()

  const { data } = await supabase
    .from("email_events")
    .select("id")
    .eq("user_id", userId)
    .eq("event_type", eventType)
    .maybeSingle()

  return data !== null
}

// ============================================================
// PoultryOps Email Functions
//
// These functions are the public API of this module.
// Business logic and API routes both call these — never dispatchEmail directly.
//
// Adding a new email type requires only:
//   1. A new template function in lib/email-templates.ts
//   2. One new exported function here
//   3. A fire-and-forget call from the relevant business logic
// No changes to the framework core above are ever needed.
// ============================================================

/**
 * Sends the welcome email after full onboarding completes.
 * Lifecycle event — sends once per userId. Subsequent calls are silently skipped.
 *
 * Email source: profiles.email — the canonical user email in this application.
 * If the auth architecture changes, update the callers to pass the correct email.
 */
export async function sendWelcomeEmail(
  userId: string,
  email: string,
  farmName: string
): Promise<void> {
  if (await emailAlreadySent(userId, "welcome")) {
    console.log(
      `[email] Welcome email skipped for user ${userId}: already sent`
    )
    return
  }

  const { subject, html } = welcomeEmailTemplate(farmName)

  try {
    await dispatchEmail(email, subject, html)
  } catch (error) {
    console.error("[email] Welcome email send failed:", error)
    throw error
  }

  console.log(`[email] Welcome email sent successfully to ${email}`)

  await recordEmailEvent(userId, "welcome", email, { farmName })
}

/**
 * Sends a team invitation email.
 * No deduplication — invitations may be resent.
 * Not logged to email_events.
 *
 * role must be one of the farm_users.role values:
 * 'owner' | 'manager' | 'staff'
 */
export async function sendInvitationEmail(
  email: string,
  farmName: string,
  temporaryPassword: string,
  role: string
): Promise<void> {
  const {
    subject,
    html,
  } = invitationEmailTemplate(
    farmName,
    role,
    temporaryPassword
  )

  // Replace placeholder with actual email
  const htmlWithEmail = html.replace("{{email}}", email)

  console.log("[INVITATION EMAIL] Sending invitation:", {
    email,
    farmName,
    role,
  })

  await dispatchEmail(
    email,
    subject,
    htmlWithEmail
  )

  console.log(
    `[INVITATION EMAIL] Successfully handed to Resend for ${email}`
  )
}

/**
 * Sends a trial lifecycle reminder or expiry email.
 * Lifecycle event — sends once per userId + type combination.
 *
 * Called by the daily automation route after it resolves
 * which users fall into each timing bucket.
 */
export async function sendTrialEmail(
  userId: string,
  email: string,
  farmName: string,
  type: TrialEmailType
): Promise<void> {
  if (await emailAlreadySent(userId, type)) return

  const templateFn = {
    trial_3_days: trial3DaysTemplate,
    trial_1_day: trial1DayTemplate,
    trial_expired: trialExpiredTemplate,
  }[type]

  const { subject, html } = templateFn(farmName)

  await dispatchEmail(email, subject, html)

  await recordEmailEvent(
    userId,
    type,
    email,
    { farmName }
  )
}

/**
 * Sends a payment confirmation email.
 * Transactional — fires on every confirmed payment, no deduplication.
 * paymentReference comes from subscriptions.payment_reference
 * or subscriptions.transaction_id.
 */
export async function sendPaymentReceivedEmail(
  userId: string,
  email: string,
  farmName: string,
  paymentReference: string
): Promise<void> {
  const {
    subject,
    html,
  } = paymentReceivedTemplate(
    farmName,
    paymentReference
  )

  await dispatchEmail(email, subject, html)

  await recordEmailEvent(
    userId,
    "payment_received",
    email,
    {
      farmName,
      paymentReference,
    }
  )
}

/**
 * Sends a subscription activation confirmation.
 * Transactional — fires on every activation, no deduplication.
 */
export async function sendSubscriptionActivatedEmail(
  userId: string,
  email: string,
  farmName: string,
  planName: string
): Promise<void> {
  const {
    subject,
    html,
  } = subscriptionActivatedTemplate(
    farmName,
    planName
  )

  await dispatchEmail(email, subject, html)

  await recordEmailEvent(
    userId,
    "subscription_activated",
    email,
    {
      farmName,
      planName,
    }
  )
}

/**
 * Sends a subscription renewal confirmation.
 * Transactional — fires on every renewal, no deduplication.
 * renewalDate should be the new subscriptions.next_billing_date
 * formatted as a string.
 */
export async function sendSubscriptionRenewedEmail(
  userId: string,
  email: string,
  farmName: string,
  planName: string,
  renewalDate?: string
): Promise<void> {
  const {
    subject,
    html,
  } = subscriptionRenewedTemplate(
    farmName,
    planName,
    renewalDate
  )

  await dispatchEmail(email, subject, html)

  await recordEmailEvent(
    userId,
    "subscription_renewed",
    email,
    {
      farmName,
      planName,
      renewalDate,
    }
  )
}