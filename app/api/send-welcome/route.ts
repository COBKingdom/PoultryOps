import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email-service";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  console.log("=================================");
  console.log("SEND-WELCOME API CALLED");
  console.log("=================================");

  try {
    const body = await request.json();

    console.log("Request Body:", body);

    const { userId, farmName } = body;

    if (!userId) {
      throw new Error("Missing userId");
    }

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.admin.getUserById(userId);

    console.log("Supabase Admin Result");
    console.log(user);
    console.log(error);

    if (error) {
      throw error;
    }

    if (!user?.email) {
      throw new Error("User email not found.");
    }

    console.log("Calling sendWelcomeEmail...");

    await sendWelcomeEmail(
      userId,
      user.email,
      farmName
    );

    console.log("Welcome email completed.");

    return NextResponse.json({
      success: true,
    });

  } catch (error) {

    console.error("SEND WELCOME FAILED");
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}