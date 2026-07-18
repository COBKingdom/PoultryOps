import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  request: NextRequest
) {
  try {
    const farmId =
      request.nextUrl.searchParams.get(
        "farmId"
      );

    if (!farmId) {
      return NextResponse.json(
        {
          error: "Farm ID required",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("farm_id", farmId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      payments: data || [],
    });
  } catch (error) {
    console.error(
      "PAYMENT HISTORY ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load payment history",
      },
      {
        status: 500,
      }
    );
  }
}