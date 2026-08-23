import { NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
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

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000
    );

    const threeDaysFromNow = new Date(
      now.getTime() + 3 * 24 * 60 * 60 * 1000
    );

    // ----------------------------------------------------------
    // 1. Customers
    // Existing read-only administrative view.
    // ----------------------------------------------------------

    const { data: customers, error: customersError } =
      await supabaseAdmin
        .from("admin_master_view")
        .select("*");

    if (customersError) {
      console.error(
        "Admin customer lookup failed:",
        customersError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load customer data",
        },
        {
          status: 500,
        }
      );
    }

    // ----------------------------------------------------------
    // 2. Users
    // Existing platform users overview.
    // ----------------------------------------------------------

    const { data: users, error: usersError } =
      await supabaseAdmin
        .from("platform_users_overview")
        .select("user_id");

    if (usersError) {
      console.error(
        "Admin user lookup failed:",
        usersError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load user data",
        },
        {
          status: 500,
        }
      );
    }

    // ----------------------------------------------------------
    // 3. Subscriptions
    // Read existing subscription records only.
    // ----------------------------------------------------------

    const { data: subscriptions, error: subscriptionsError } =
      await supabaseAdmin
        .from("subscriptions")
        .select(
          "farm_id, plan, selected_plan, status, trial_start, trial_end, next_billing_date, amount_paid, created_at"
        );

    if (subscriptionsError) {
      console.error(
        "Admin subscription lookup failed:",
        subscriptionsError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load subscription data",
        },
        {
          status: 500,
        }
      );
    }

    // ----------------------------------------------------------
    // 4. Payments
    // Read existing payment records only.
    // ----------------------------------------------------------

    const { data: payments, error: paymentsError } =
      await supabaseAdmin
        .from("payments")
        .select(
          "id, farm_id, plan, billing_cycle, amount_paid, transaction_id, payment_reference, status, paid_at, created_at"
        )
        .order("created_at", {
          ascending: false,
        });

    if (paymentsError) {
      console.error(
        "Admin payment lookup failed:",
        paymentsError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load payment data",
        },
        {
          status: 500,
        }
      );
    }

    // ----------------------------------------------------------
    // 5. Email events
    // Existing email audit trail.
    // ----------------------------------------------------------

    const { data: emailEvents, error: emailEventsError } =
      await supabaseAdmin
        .from("email_events")
        .select(
          "id, user_id, event_type, email, sent_at, metadata"
        )
        .order("sent_at", {
          ascending: false,
        })
        .limit(20);

    if (emailEventsError) {
      console.error(
        "Admin email event lookup failed:",
        emailEventsError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load email activity",
        },
        {
          status: 500,
        }
      );
    }

    // ----------------------------------------------------------
    // 6. Trial metrics
    // ----------------------------------------------------------

    const trialSubscriptions =
      (subscriptions || []).filter(
        (subscription) =>
          subscription.status === "trial"
      );

    const newTrials =
      trialSubscriptions.filter((subscription) => {
        if (!subscription.trial_start) {
          return false;
        }

        const trialStart = new Date(
          subscription.trial_start
        );

        return (
          trialStart >= sevenDaysAgo &&
          trialStart <= now
        );
      }).length;

    const activeTrials =
      trialSubscriptions.filter((subscription) => {
        if (!subscription.trial_end) {
          return false;
        }

        return new Date(subscription.trial_end) > now;
      }).length;

    const expiringTrials =
      trialSubscriptions.filter((subscription) => {
        if (!subscription.trial_end) {
          return false;
        }

        const trialEnd = new Date(
          subscription.trial_end
        );

        return (
          trialEnd > now &&
          trialEnd <= threeDaysFromNow
        );
      }).length;

    const expiredTrials =
      trialSubscriptions.filter((subscription) => {
        if (!subscription.trial_end) {
          return false;
        }

        return new Date(subscription.trial_end) <= now;
      }).length;

    // ----------------------------------------------------------
    // 7. Active subscribers
    // ----------------------------------------------------------

    const activeSubscribers =
      (subscriptions || []).filter(
        (subscription) =>
          subscription.status === "active"
      ).length;

    // ----------------------------------------------------------
    // 8. Revenue
    //
    // Only payments explicitly marked successful are
    // included in revenue.
    // ----------------------------------------------------------

    const successfulPayments =
      (payments || []).filter(
        (payment) =>
          payment.status === "successful"
      );

    const revenue =
      successfulPayments.reduce(
        (total, payment) =>
          total +
          Number(payment.amount_paid || 0),
        0
      );

    // ----------------------------------------------------------
    // 9. Failed payments
    //
    // We use the actual "failed" status rather than treating
    // every non-successful payment as failed.
    // ----------------------------------------------------------

    const failedPayments =
      (payments || []).filter(
        (payment) =>
          payment.status === "failed"
      ).length;

    // ----------------------------------------------------------
    // 10. Recent activity
    //
    // Combine the existing payment and email audit trails.
    // No new activity records are created here.
    // ----------------------------------------------------------

    const paymentActivity =
      (payments || []).slice(0, 10).map(
        (payment) => ({
          type: "payment",
          event: payment.status,
          amount: payment.amount_paid,
          farmId: payment.farm_id,
          reference:
            payment.payment_reference,
          timestamp:
            payment.paid_at ||
            payment.created_at,
        })
      );

    const emailActivity =
      (emailEvents || []).map(
        (event) => ({
          type: "email",
          event: event.event_type,
          email: event.email,
          userId: event.user_id,
          metadata: event.metadata,
          timestamp: event.sent_at,
        })
      );

    const recentActivity = [
      ...paymentActivity,
      ...emailActivity,
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime()
      )
      .slice(0, 20);

    // ----------------------------------------------------------
    // 11. Final read-only Admin Overview response
    // ----------------------------------------------------------

    return NextResponse.json({
      success: true,

      summary: {
        totalCustomers:
          customers?.length || 0,

        totalUsers:
          users?.length || 0,

        newTrials,

        activeTrials,

        expiringTrials,

        expiredTrials,

        activeSubscribers,

        revenue,

        failedPayments,
      },

      customers:
        customers || [],

      recentActivity,
    });
  } catch (error) {
    console.error(
      "Admin overview unexpected error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load admin overview",
      },
      {
        status: 500,
      }
    );
  }
}
