import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { sendTrialEmail, TrialEmailType } from "@/lib/email-service"

interface SubscriptionRow {
  farm_id: string
  trial_end: string
  farms: {
    name: string
    owner_id: string
  } | null
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

  const supabase = getSupabaseAdmin()
  const now = new Date()
  const plus2Days = new Date(now); plus2Days.setDate(plus2Days.getDate() + 2)
  const plus4Days = new Date(now); plus4Days.setDate(plus4Days.getDate() + 4)

  // Query trial subscriptions — confirmed column names from schema:
  // subscriptions.plan = 'trial' (lowercase), subscriptions.trial_end
  // Join farms to get name and owner_id (not user_id — confirmed from schema)
  const { data: rawTrials, error: queryError } = await supabase
    .from("subscriptions")
    .select("farm_id, trial_end, farms!subscriptions_farm_id_fkey(name, owner_id)")
    .eq("plan", "trial")

  if (queryError) {
    return NextResponse.json(
      { error: `Subscription query failed: ${queryError.message}` },
      { status: 500 }
    )
  }

  const trials = (rawTrials ?? []) as SubscriptionRow[]

  // Collect all owner_ids for a single bulk profile lookup
  const ownerIds = [
    ...new Set(
      trials.map((t) => t.farms?.owner_id).filter((id): id is string => Boolean(id))
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
    if (!row.farms?.owner_id) continue
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
      const ownerId = row.farms!.owner_id
      const farmName = row.farms!.name || "your farm"
      const email = emailByOwnerId.get(ownerId)

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