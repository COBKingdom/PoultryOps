import { NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  request: Request,
  context: {
    params: Promise<{ farmId: string }>;
  }
) {
  const authResult = await requirePlatformAdmin(request);

  if (!authResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: authResult.error,
      },
      {
        status: authResult.statusCode || 403,
      }
    );
  }

  const { farmId } = await context.params;

  if (!farmId) {
    return NextResponse.json(
      {
        success: false,
        error: "Farm ID is required",
      },
      {
        status: 400,
      }
    );
  }

  const { data: farm, error: farmError } =
    await supabaseAdmin
      .from("farms")
      .select(`
        id,
        farm_code,
        name,
        farm_type,
        currency,
        active,
        owner_id,
        created_at
      `)
      .eq("id", farmId)
      .maybeSingle();

  if (farmError) {
    console.error("Customer farm lookup failed:", farmError);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load customer",
      },
      {
        status: 500,
      }
    );
  }

  if (!farm) {
    return NextResponse.json(
      {
        success: false,
        error: "Customer not found",
      },
      {
        status: 404,
      }
    );
  }

  const { data: owner, error: ownerError } =
    await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        role,
        status,
        created_at,
        last_sign_in_at,
        must_change_password
      `)
      .eq("id", farm.owner_id)
      .maybeSingle();

  if (ownerError) {
    console.error("Customer owner lookup failed:", ownerError);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load customer owner",
      },
      {
        status: 500,
      }
    );
  }

  const { data: farmUsers, error: usersError } =
    await supabaseAdmin
      .from("farm_users")
      .select(`
        id,
        user_id,
        role,
        status,
        created_at,
        invited_by,
        joined_at
      `)
      .eq("farm_id", farmId)
      .order("created_at", { ascending: true });

  if (usersError) {
    console.error("Customer users lookup failed:", usersError);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load customer users",
      },
      {
        status: 500,
      }
    );
  }

  const userIds = (farmUsers || [])
    .map((membership) => membership.user_id)
    .filter(Boolean);

  let userProfiles: any[] = [];

  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } =
      await supabaseAdmin
        .from("profiles")
        .select(`
          id,
          email,
          full_name,
          role,
          status,
          created_at,
          last_sign_in_at,
          must_change_password
        `)
        .in("id", userIds);

    if (profilesError) {
      console.error(
        "Customer user profiles lookup failed:",
        profilesError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load customer user profiles",
        },
        {
          status: 500,
        }
      );
    }

    userProfiles = profiles || [];
  }

  const profileMap = new Map(
    userProfiles.map((profile) => [profile.id, profile])
  );

  const users = (farmUsers || []).map((membership) => ({
    ...membership,
    profile: profileMap.get(membership.user_id) || null,
  }));

  const { data: subscription, error: subscriptionError } =
    await supabaseAdmin
      .from("subscriptions")
      .select(`
        id,
        farm_id,
        plan,
        selected_plan,
        status,
        billing_cycle,
        trial_start,
        trial_end,
        next_billing_date,
        amount_paid,
        payment_reference,
        transaction_id,
        created_at
      `)
      .eq("farm_id", farmId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (subscriptionError) {
    console.error(
      "Customer subscription lookup failed:",
      subscriptionError
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load customer subscription",
      },
      {
        status: 500,
      }
    );
  }

  const { data: payments, error: paymentsError } =
    await supabaseAdmin
      .from("payments")
      .select(`
        id,
        farm_id,
        plan,
        billing_cycle,
        amount_paid,
        transaction_id,
        payment_reference,
        status,
        paid_at,
        created_at
      `)
      .eq("farm_id", farmId)
      .order("created_at", { ascending: false });

  if (paymentsError) {
    console.error(
      "Customer payments lookup failed:",
      paymentsError
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load customer payments",
      },
      {
        status: 500,
      }
    );
  }

  const { data: auditLogs, error: auditError } =
    await supabaseAdmin
      .from("audit_logs")
      .select(`
        id,
        user_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        metadata,
        ip_address,
        user_agent,
        created_at
      `)
      .eq("resource_id", farmId)
      .order("created_at", { ascending: false })
      .limit(100);

  if (auditError) {
    console.error(
      "Customer audit lookup failed:",
      auditError
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load customer audit history",
      },
      {
        status: 500,
      }
    );
  }

  const { data: emailEvents, error: emailError } =
    await supabaseAdmin
      .from("email_events")
      .select(`
        id,
        user_id,
        event_type,
        email,
        sent_at,
        metadata
      `)
      .in(
        "user_id",
        userIds.length > 0 ? userIds : [farm.owner_id]
      )
      .order("sent_at", { ascending: false })
      .limit(100);

  if (emailError) {
    console.error(
      "Customer email event lookup failed:",
      emailError
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load customer email history",
      },
      {
        status: 500,
      }
    );
  }

  const totalPayments = (payments || []).reduce(
    (sum, payment) =>
      sum + Number(payment.amount_paid || 0),
    0
  );

  return NextResponse.json({
    success: true,
    customer: {
      farm,
      owner: owner || null,
      users,
      subscription: subscription || null,
      payments: payments || [],
      auditLogs: auditLogs || [],
      emailEvents: emailEvents || [],
      metrics: {
        userCount: users.length,
        paymentCount: payments?.length || 0,
        totalPayments,
        auditEventCount: auditLogs?.length || 0,
        emailEventCount: emailEvents?.length || 0,
      },
    },
  });
}
