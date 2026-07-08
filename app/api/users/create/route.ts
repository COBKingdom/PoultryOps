import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      email,
      password,
      fullName,
      farmId,
    } = body;

    if (
      !email ||
      !password ||
      !farmId
    ) {
      return NextResponse.json(
        {
          error: "Missing required fields",
        },
        {
          status: 400,
        }
      );
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get subscription

    const {
      data: subscription,
      error: subscriptionError,
    } = await admin
      .from("subscriptions")
      .select("plan")
      .eq("farm_id", farmId)
      .single();

    if (
      subscriptionError ||
      !subscription
    ) {
      return NextResponse.json(
        {
          error:
            "Unable to verify subscription",
        },
        {
          status: 400,
        }
      );
    }

    // Count current users

    const {
      count,
      error: countError,
    } = await admin
      .from("farm_users")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("farm_id", farmId);

    if (countError) {
      return NextResponse.json(
        {
          error:
            "Unable to verify user limits",
        },
        {
          status: 400,
        }
      );
    }

    const currentUsers =
      count || 0;

    let maxUsers = 1;

    switch (
      subscription.plan
    ) {
      case "trial":
        maxUsers = 1;
        break;

      case "solo":
        maxUsers = 1;
        break;

      case "team":
        maxUsers = 3;
        break;

      case "business":
        maxUsers = 6;
        break;

      default:
        maxUsers = 1;
    }

    if (
      currentUsers >= maxUsers
    ) {
      if (
        subscription.plan ===
        "trial"
      ) {
        return NextResponse.json(
          {
            error:
              "Your trial supports owner access only. Upgrade to Team or Business to add users.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        subscription.plan ===
        "solo"
      ) {
        return NextResponse.json(
          {
            error:
              "Solo plan supports one user only. Upgrade to Team or Business to add users.",
          },
          {
            status: 400,
          }
        );
      }

      return NextResponse.json(
        {
          error:
            "User limit reached for your subscription plan.",
        },
        {
          status: 400,
        }
      );
    }

    // Create Auth user

    const {
      data: authUser,
      error: authError,
    } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      return NextResponse.json(
        {
          error: authError.message,
        },
        {
          status: 400,
        }
      );
    }

    const userId =
      authUser.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          error:
            "Failed to create user",
        },
        {
          status: 400,
        }
      );
    }

    // Update profile

    const {
      error: profileError,
    } = await admin
      .from("profiles")
      .update({
        full_name: fullName,
        farm_id: farmId,
        role: "data_entry",
      })
      .eq("id", userId);

    if (profileError) {
      return NextResponse.json(
        {
          error:
            profileError.message,
        },
        {
          status: 400,
        }
      );
    }

    // Create farm membership

    const {
      error: farmUserError,
    } = await admin
      .from("farm_users")
      .insert({
        farm_id: farmId,
        user_id: userId,
        role: "data_entry",
        status: "active",
      });

    if (farmUserError) {
      return NextResponse.json(
        {
          error:
            farmUserError.message,
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Server error",
      },
      {
        status: 500,
      }
    );
  }
}