import { NextResponse } from "next/server"
import { sendSubscriptionRenewedEmail } from "@/lib/email-service"

export async function POST(request: Request) {
  const { userId, email, farmName, planName, renewalDate } = await request.json()

  if (!userId || !email) {
    return NextResponse.json(
      { error: "Missing required fields: userId, email" },
      { status: 400 }
    )
  }

  try {
    await sendSubscriptionRenewedEmail(userId, email, farmName, planName ?? "", renewalDate)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}