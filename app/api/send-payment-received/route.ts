import { NextResponse } from "next/server"
import { sendPaymentReceivedEmail } from "@/lib/email-service"

export async function POST(request: Request) {
  const { userId, email, farmName, paymentReference } = await request.json()

  if (!userId || !email) {
    return NextResponse.json(
      { error: "Missing required fields: userId, email" },
      { status: 400 }
    )
  }

  try {
    await sendPaymentReceivedEmail(userId, email, farmName, paymentReference ?? "")
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}