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

    if (error) {
      console.error("[send-welcome] User lookup failed:", error);
      throw error;
    }

    if (!user?.email) {
      console.error("[send-welcome] User email not found for userId:", userId);
      throw new Error("User email not found.");
    }

    console.log("[send-welcome] User resolved:", user.email);

    try {
      await sendWelcomeEmail(
        userId,
        user.email,
        farmName
      );
    } catch (sendError) {
      console.error("[send-welcome] Welcome email send failed:", sendError);
      throw sendError;
    }

    console.log("[send-welcome] Welcome email completed.");

    return NextResponse.json({
      success: true,
    });

  } catch (error) {

    console.error("[send-welcome] SEND WELCOME FAILED");
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
