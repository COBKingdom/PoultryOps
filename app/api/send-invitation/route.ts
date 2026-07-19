import { NextResponse } from "next/server"
import { sendInvitationEmail } from "@/lib/email-service"

export async function POST(request: Request) {
  const { email, farmName, inviteCode, role } = await request.json()

  if (!email || !farmName || !inviteCode || !role) {
    return NextResponse.json(
      { error: "Missing required fields: email, farmName, inviteCode, role" },
      { status: 400 }
    )
  }

  try {
    await sendInvitationEmail(email, farmName, inviteCode, role)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}