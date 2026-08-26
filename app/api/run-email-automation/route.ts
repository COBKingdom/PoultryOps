import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { sendTrialEmail, TrialEmailType } from "@/lib/email-service"

interface SubscriptionRow {
  farm_id: string
  trial_end: string
  farms: {
    name: string
    owner_id: string
  }[]
}

interface ProfileRow {
  id: string
  email: string | null
}

export async function POST(request: Request) {
  const automationSecret = process.env.AUTOMATION_SECRET
  if (automationSecret) {
    const provided = request.headers.get("x-automation-secret")
    if (provided !== automationSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const supabase = supabaseAdmin
  const now = new Date()
  const plus2Days = new Date(now); plus2Days.setDate(plus2Days.getDate() + 2)
  const plus4Days = new Date(now); plus4Days.setDate(plus4Days.getDate() + 4)

  // Query trial subscriptions — confirmed column names from schema:
  // subscriptions.plan = 'trial' (lowercase), subscriptions.trial_end
  // Join farms to get name and owner_id (not user_id — confirmed from schema)
  const { data: rawTrials, error: queryError } = await supabase
    .from("subscriptions")
    .select(`
  farm_id,
  trial_end,
  farms!subscriptions_farm_id_fkey (
    name,
    owner_id
  )
`)
    .eq("status", "trial")

  if (queryError) {
    return NextResponse.json(
      { error: `Subscription query failed: ${queryError.message}` },
      { status: 500 }
    )
  }

  const trials = (rawTrials ?? []) as SubscriptionRow[]

  console.log("[EMAIL AUTOMATION] Subscription query result:", {
  rowCount: rawTrials?.length ?? 0,
  queryError: queryError ? String(queryError) : null,
  trialRows: rawTrials,
})

  // Collect all owner_ids for a single bulk profile lookup
const ownerIds = [
  ...new Set(
    trials
      .map((t) => t.farms[0]?.owner_id)
      .filter((id): id is string => Boolean(id))
  ),
]

  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", ownerIds)

  // profiles.email is the canonical email source in this application
  const emailByOwnerId = new Map<string, string>(
    ((profilesData ?? []) as ProfileRow[])
      .filter((p) => p.email)
      .map((p) => [p.id, p.email as string])
  )

  // Bucket users by trial_end relative to now
  type Bucket = { row: SubscriptionRow; type: TrialEmailType }
  const buckets: Bucket[] = []

  for (const row of trials) {
    const farm = row.farms[0]
    if (!farm?.owner_id) continue
    const expiry = new Date(row.trial_end)
    if (expiry < now) {
      buckets.push({ row, type: "trial_expired" })
    } else if (expiry < plus2Days) {
      buckets.push({ row, type: "trial_1_day" })
    } else if (expiry < plus4Days) {
      buckets.push({ row, type: "trial_3_days" })
    }
  }

  const results: Array<{
    ownerId: string
    email: string
    farmName: string
    type: TrialEmailType
    status: "sent" | "skipped" | "error"
    reason?: string
  }> = []

  await Promise.all(
    buckets.map(async ({ row, type }) => {
 const farm = row.farms[0]

if (!farm) {
  return
}

const ownerId = farm.owner_id
const farmName = farm.name || "your farm"
      const email = emailByOwnerId.get(ownerId)

      // Persist expiry status independently of email delivery.
      // The account must become expired based on trial_end regardless of
      // whether Resend succeeds or fails. The email is a notification only.
      // The .eq("status", "trial") filter makes this idempotent (won't
      // re-update already-expired subscriptions) and safe (never touches
      // active paid subscriptions).
      if (type === "trial_expired") {
        await supabase
          .from("subscriptions")
          .update({ status: "expired" })
          .eq("farm_id", row.farm_id)
          .eq("status", "trial")
      }

      if (!email) {
        results.push({ ownerId, email: "", farmName, type, status: "error", reason: "no email in profiles" })
        return
      }

      try {
        await sendTrialEmail(ownerId, email, farmName, type)
        // sendTrialEmail returns silently if already sent (dedup inside service)
        results.push({ ownerId, email, farmName, type, status: "sent" })
      } catch (err: unknown) {
        results.push({
          ownerId, email, farmName, type,
          status: "error",
          reason: (err as Error).message,
        })
      }
    })
  )

  const sent   = results.filter((r) => r.status === "sent").length
  const errors = results.filter((r) => r.status === "error").length

  return NextResponse.json({
    ok: true,
    summary: { processed: buckets.length, sent, errors },
    breakdown: {
      trial_expired: buckets.filter((b) => b.type === "trial_expired").length,
      trial_1_day:   buckets.filter((b) => b.type === "trial_1_day").length,
      trial_3_days:  buckets.filter((b) => b.type === "trial_3_days").length,
    },
    results,
  })
}