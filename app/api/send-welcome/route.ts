import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email-service";
import { supabaseAdmin } from "@/lib/supabase-admin";
export async function POST(request: Request) {
  try {
    const { userId, farmName } = await request.json();
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (error || !user?.email) {
      throw new Error("Unable to retrieve user email.");
    }
    await sendWelcomeEmail(
      userId,
      user.email,
      farmName
    );
  
    return NextResponse.json({ success: true });
  } catch (error) {
   console.error(error);

    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}