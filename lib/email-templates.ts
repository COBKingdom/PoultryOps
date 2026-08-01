/**
 * PoultryOps Email Templates
 *
 * All PoultryOps branding, messaging, and copy lives here.
 * To port to another TrueOps product: replace this file and its imports
 * in lib/email-service.ts. The framework core is unchanged.
 */

// ---------------------------------------------------------------------------
// Layout wrapper — shared by all emails
// ---------------------------------------------------------------------------

export function emailWrapper(title: string, bodyHtml: string): string {
  const frontendUrl = process.env.FRONTEND_URL ?? ""

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#eef0f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef0f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0"
               style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#0d1b3e;padding:28px 32px;text-align:center;">
              <img src="${frontendUrl}/icon-192.png" alt="PoultryOps" width="56" height="56"
                   style="border-radius:12px;display:block;margin:0 auto 12px;" />
              <h1 style="color:#ffffff;font-size:20px;font-weight:700;margin:0;letter-spacing:-0.3px;">PoultryOps</h1>
              <p style="color:rgba(255,255,255,0.55);font-size:12px;margin:4px 0 0;">Poultry Farm Management</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:28px 0 20px;" />
              <p style="color:#374151;font-size:13px;font-weight:700;margin:0 0 6px;">TrueOps</p>
              <p style="color:#6b7280;font-size:13px;margin:0 0 4px;line-height:1.6;">PoultryOps &mdash; support@trueops.app</p>
              <p style="color:#6b7280;font-size:13px;margin:0 0 4px;">
                💬 <a href="https://wa.me/353899550078" style="color:#2563eb;text-decoration:none;">Chat on WhatsApp</a>
              </p>
              <p style="color:#6b7280;font-size:13px;margin:0 0 4px;">
                🌐 <a href="${frontendUrl}" style="color:#2563eb;text-decoration:none;">Login to PoultryOps</a>
              </p>
              <p style="color:#6b7280;font-size:13px;margin:12px 0 0;font-style:italic;">Helping Poultry Farms Stay In Control</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Individual email templates
// Each returns { subject, html } — subjects live with their templates.
// ---------------------------------------------------------------------------

export function welcomeEmailTemplate(farmName: string): { subject: string; html: string } {
  const frontendUrl = process.env.FRONTEND_URL ?? ""
  const name = farmName || "your farm"

  const body = `
    <p style="color:#374151;font-size:15px;margin:0 0 20px;line-height:1.6;">Hello,</p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px;line-height:1.6;">
      Welcome to <strong style="color:#0d1b3e;">PoultryOps</strong>! Your farm
      <strong style="color:#0d1b3e;">${name}</strong> has been set up and your
      <strong>14-day free trial</strong> has started.
    </p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px;line-height:1.6;">
      You can now track flock management, egg production, sales, expenses, and profit — all from one dashboard.
    </p>
    <p style="color:#374151;font-size:14px;margin:0 0 8px;font-weight:600;">What you can do right now:</p>
    <ul style="color:#374151;font-size:14px;margin:0 0 28px;padding-left:20px;line-height:2;">
      <li>Log your flocks and daily egg production</li>
      <li>Record sales and track customers</li>
      <li>Monitor feed usage, expenses, and mortality</li>
      <li>View daily profit on your dashboard</li>
    </ul>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom:28px;">
          <a href="${frontendUrl}"
             style="display:inline-block;background:#2563eb;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;">
            Open PoultryOps &rarr;
          </a>
        </td>
      </tr>
    </table>
    <p style="color:#6b7280;font-size:13px;margin:0;line-height:1.7;">
      Your trial runs for <strong>14 days</strong>. We'll send you a reminder before it expires.
    </p>`

  return {
    subject: "🐔 Welcome to PoultryOps — Your 14-Day Trial Has Started",
    html: emailWrapper("Welcome to PoultryOps", body),
  }
}

export function invitationEmailTemplate(
  farmName: string,
  role: string,
  temporaryPassword: string
): { subject: string; html: string } {
  const frontendUrl = process.env.FRONTEND_URL ?? ""
  const loginUrl = `${frontendUrl}/login`
  const roleDisplay = role === "data_entry" ? "Data Entry" : role === "manager" ? "Manager" : "User"

  const body = `
    <p style="color:#374151;font-size:15px;margin:0 0 20px;line-height:1.6;">Hello,</p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px;line-height:1.6;">
      You have been invited to join <strong style="color:#0d1b3e;">${farmName}</strong>
      on PoultryOps as a <strong style="color:#0d1b3e;">${roleDisplay}</strong> user.
    </p>
    
    <div style="background:#f0f9ff;border-left:4px solid #2563eb;padding:16px;margin:20px 0;border-radius:8px;">
      <p style="color:#0d1b3e;font-size:14px;font-weight:700;margin:0 0 12px;">Your Login Credentials</p>
      <p style="color:#374151;font-size:14px;margin:0 0 8px;"><strong>Email:</strong> ${temporaryPassword ? '{{email}}' : ''}</p>
      <p style="color:#374151;font-size:14px;margin:0 0 8px;"><strong>Temporary Password:</strong> <code style="background:#e5e7eb;padding:2px 6px;border-radius:4px;font-family:monospace;">${temporaryPassword}</code></p>
    </div>
    
    <p style="color:#374151;font-size:15px;margin:20px 0 28px;line-height:1.6;">
      Click the button below to log in to your account.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom:28px;">
          <a href="${loginUrl}"
             style="display:inline-block;background:#2563eb;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;">
            Log In to PoultryOps &rarr;
          </a>
        </td>
      </tr>
    </table>
    
    <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;margin:20px 0;border-radius:8px;">
      <p style="color:#92400e;font-size:14px;font-weight:700;margin:0 0 8px;">Important: Change Your Password</p>
      <p style="color:#92400e;font-size:13px;margin:0;line-height:1.6;">
        For security reasons, you will be required to change your password on your first login. 
        Please choose a strong, unique password that you haven't used before.
      </p>
    </div>
    
    <p style="color:#6b7280;font-size:13px;margin:20px 0 10px;line-height:1.7;">
      If you have any questions or need assistance, please don't hesitate to reach out to your farm administrator.
    </p>
    <p style="color:#6b7280;font-size:13px;margin:0;line-height:1.7;">
      If you were not expecting this invitation, you may safely ignore this email.
    </p>`

  return {
    subject: `You've been invited to join ${farmName} on PoultryOps`,
    html: emailWrapper("PoultryOps Invitation", body),
  }
}

export function trial3DaysTemplate(farmName: string): { subject: string; html: string } {
  const frontendUrl = process.env.FRONTEND_URL ?? ""

  const body = `
    <p style="color:#374151;font-size:15px;margin:0 0 20px;line-height:1.6;">Hello,</p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px;line-height:1.6;">
      Your <strong style="color:#0d1b3e;">PoultryOps</strong> free trial for
      <strong style="color:#0d1b3e;">${farmName}</strong> expires in <strong>3 days</strong>.
    </p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px;line-height:1.6;">
      Don't lose access to your flock records, egg production logs, and financial data.
      Upgrade now to keep your farm running smoothly.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom:28px;">
          <a href="${frontendUrl}"
             style="display:inline-block;background:#2563eb;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;">
            Upgrade My Plan &rarr;
          </a>
        </td>
      </tr>
    </table>
    <p style="color:#6b7280;font-size:13px;margin:0;line-height:1.7;">
      Questions? Reply to this email or chat with us on WhatsApp.
    </p>`

  return {
    subject: "⏳ Your PoultryOps trial expires in 3 days",
    html: emailWrapper("Trial Expiring Soon", body),
  }
}

export function trial1DayTemplate(farmName: string): { subject: string; html: string } {
  const frontendUrl = process.env.FRONTEND_URL ?? ""

  const body = `
    <p style="color:#374151;font-size:15px;margin:0 0 20px;line-height:1.6;">Hello,</p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px;line-height:1.6;">
      This is your final reminder. Your <strong style="color:#0d1b3e;">PoultryOps</strong> trial for
      <strong style="color:#0d1b3e;">${farmName}</strong> ends <strong>tomorrow</strong>.
    </p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px;line-height:1.6;">
      After tomorrow, you will lose access to your dashboard, flock logs, egg production records, and reports.
    </p>
    <p style="color:#374151;font-size:15px;margin:0 0 28px;line-height:1.6;">
      Upgrade today — your data will be preserved and nothing will be lost.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom:28px;">
          <a href="${frontendUrl}"
             style="display:inline-block;background:#dc2626;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;">
            Upgrade Before It Expires &rarr;
          </a>
        </td>
      </tr>
    </table>
    <p style="color:#6b7280;font-size:13px;margin:0;line-height:1.7;">
      Need help? Reply to this email or chat with us on WhatsApp.
    </p>`

  return {
    subject: "⚠️ Your PoultryOps trial ends tomorrow",
    html: emailWrapper("Trial Ends Tomorrow", body),
  }
}

export function trialExpiredTemplate(farmName: string): { subject: string; html: string } {
  const frontendUrl = process.env.FRONTEND_URL ?? ""

  const body = `
    <p style="color:#374151;font-size:15px;margin:0 0 20px;line-height:1.6;">Hello,</p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px;line-height:1.6;">
      Your <strong style="color:#0d1b3e;">PoultryOps</strong> free trial for
      <strong style="color:#0d1b3e;">${farmName}</strong> has expired.
    </p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px;line-height:1.6;">
      Your farm data is safe and waiting for you. Upgrade your plan to restore full access
      to your dashboard, flock records, and reports.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom:28px;">
          <a href="${frontendUrl}"
             style="display:inline-block;background:#0d1b3e;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;">
            Restore My Access &rarr;
          </a>
        </td>
      </tr>
    </table>
    <p style="color:#6b7280;font-size:13px;margin:0;line-height:1.7;">
      Questions? Reply to this email or chat with us on WhatsApp.
    </p>`

  return {
    subject: "Your PoultryOps trial has expired",
    html: emailWrapper("Trial Expired", body),
  }
}

export function paymentReceivedTemplate(
  farmName: string,
  paymentReference: string
): { subject: string; html: string } {
  const frontendUrl = process.env.FRONTEND_URL ?? ""
  const name = farmName || "your farm"

  const body = `
    <p style="color:#374151;font-size:15px;margin:0 0 20px;line-height:1.6;">Hello,</p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px;line-height:1.6;">
      Your payment for <strong style="color:#0d1b3e;">PoultryOps</strong> has been received
      and confirmed for <strong style="color:#0d1b3e;">${name}</strong>.
    </p>
    ${paymentReference
      ? `<p style="color:#6b7280;font-size:13px;margin:0 0 20px;line-height:1.7;">
           Payment reference: <strong>${paymentReference}</strong>
         </p>`
      : ""}
    <p style="color:#374151;font-size:15px;margin:0 0 28px;line-height:1.6;">
      Thank you for your payment. Your subscription will be activated shortly.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom:28px;">
          <a href="${frontendUrl}"
             style="display:inline-block;background:#2563eb;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;">
            Open PoultryOps &rarr;
          </a>
        </td>
      </tr>
    </table>
    <p style="color:#6b7280;font-size:13px;margin:0;line-height:1.7;">
      Questions? Reply to this email or chat with us on WhatsApp.
    </p>`

  return {
    subject: "✅ Payment Received — PoultryOps",
    html: emailWrapper("Payment Received", body),
  }
}

export function subscriptionActivatedTemplate(
  farmName: string,
  planName: string
): { subject: string; html: string } {
  const frontendUrl = process.env.FRONTEND_URL ?? ""
  const name = farmName || "your farm"
  const plan = planName || "your plan"

  const body = `
    <p style="color:#374151;font-size:15px;margin:0 0 20px;line-height:1.6;">Hello,</p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px;line-height:1.6;">
      Your <strong style="color:#0d1b3e;">PoultryOps</strong> subscription for
      <strong style="color:#0d1b3e;">${name}</strong> is now active.
    </p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px;line-height:1.6;">
      Plan: <strong style="color:#0d1b3e;">${plan}</strong>
    </p>
    <p style="color:#374151;font-size:15px;margin:0 0 28px;line-height:1.6;">
      You now have full access to all PoultryOps features. Thank you for subscribing.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom:28px;">
          <a href="${frontendUrl}"
             style="display:inline-block;background:#2563eb;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;">
            Open PoultryOps &rarr;
          </a>
        </td>
      </tr>
    </table>
    <p style="color:#6b7280;font-size:13px;margin:0;line-height:1.7;">
      Questions? Reply to this email or chat with us on WhatsApp.
    </p>`

  return {
    subject: "🎉 Your PoultryOps Subscription is Active",
    html: emailWrapper("Subscription Activated", body),
  }
}

export function subscriptionRenewedTemplate(
  farmName: string,
  planName: string,
  renewalDate?: string
): { subject: string; html: string } {
  const frontendUrl = process.env.FRONTEND_URL ?? ""
  const name = farmName || "your farm"
  const plan = planName || "your plan"

  const body = `
    <p style="color:#374151;font-size:15px;margin:0 0 20px;line-height:1.6;">Hello,</p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px;line-height:1.6;">
      Your <strong style="color:#0d1b3e;">PoultryOps</strong> subscription for
      <strong style="color:#0d1b3e;">${name}</strong> has been successfully renewed.
    </p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px;line-height:1.6;">
      Plan: <strong style="color:#0d1b3e;">${plan}</strong>
      ${renewalDate ? `<br/>Valid until: <strong>${renewalDate}</strong>` : ""}
    </p>
    <p style="color:#374151;font-size:15px;margin:0 0 28px;line-height:1.6;">
      Thank you for continuing with PoultryOps. Your farm data and access remain uninterrupted.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom:28px;">
          <a href="${frontendUrl}"
             style="display:inline-block;background:#2563eb;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;">
            Open PoultryOps &rarr;
          </a>
        </td>
      </tr>
    </table>
    <p style="color:#6b7280;font-size:13px;margin:0;line-height:1.7;">
      Questions? Reply to this email or chat with us on WhatsApp.
    </p>`

  return {
    subject: "✅ Subscription Renewed — PoultryOps",
    html: emailWrapper("Subscription Renewed", body),
  }
}