import { NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

type LifecycleStatus =
  | "registered_unverified"
  | "onboarding_incomplete"
  | "farm_created"
  | "active_trial"
  | "paid_customer"
  | "trial_expired"
  | "pogp_partner"
  | "platform_admin";

type FarmRecord = {
  id: string;
  name: string | null;
  farm_type: string | null;
  currency: string | null;
  active: boolean | null;
  owner_id: string | null;
};

type MembershipRecord = {
  id: string;
  farm_id: string;
  user_id: string;
  role: string | null;
  status: string | null;
  joined_at: string | null;
};

type SubscriptionRecord = {
  farm_id: string | null;
  plan: string | null;
  selected_plan: string | null;
  status: string | null;
  trial_start: string | null;
  trial_end: string | null;
  next_billing_date: string | null;
};

function getLifecycleLabel(status: LifecycleStatus): string {
  switch (status) {
    case "registered_unverified":
      return "Registered — Email Unverified";

    case "onboarding_incomplete":
      return "Onboarding Incomplete";

    case "farm_created":
      return "Farm Created";

    case "active_trial":
      return "Active Trial";

    case "paid_customer":
      return "Paid Customer";

    case "trial_expired":
      return "Trial Expired";

    case "pogp_partner":
      return "POGP Partner";

    case "platform_admin":
      return "Platform Admin";

    default:
      return "Unknown";
  }
}

function getLifecycleDetail(
  status: LifecycleStatus,
  emailConfirmedAt: string | null,
  lastSignInAt: string | null
): string {
  switch (status) {
    case "registered_unverified":
      return "Account created but email has not been verified.";

    case "onboarding_incomplete":
      return lastSignInAt
        ? "Email verified and account accessed, but no farm has been created."
        : emailConfirmedAt
          ? "Email verified but onboarding has not been completed."
          : "Account created but onboarding is incomplete.";

    case "farm_created":
      return "Farm created. No active trial or paid subscription currently detected.";

    case "active_trial":
      return "Farm is currently evaluating PoultryOps.";

    case "paid_customer":
      return "Customer has an active paid subscription.";

    case "trial_expired":
      return "Farm was created but its trial has expired.";

    case "pogp_partner":
      return "Independent PoultryOps Growth Partner account.";

    case "platform_admin":
      return "PoultryOps platform administration account.";

    default:
      return "";
  }
}

function isFutureDate(value: string | null): boolean {
  if (!value) return false;

  return new Date(value).getTime() >= Date.now();
}

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
    // ==========================================================
    // 1. Load ALL Supabase Auth users.
    //
    // This is deliberately server-side. The service-role client
    // is never exposed to the browser.
    // ==========================================================

    const authUsers: any[] = [];

    const perPage = 1000;
    let page = 1;

    while (true) {
      const {
        data,
        error,
      } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        console.error(
          "Admin Auth users lookup failed:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            error: "Unable to load authentication users",
          },
          {
            status: 500,
          }
        );
      }

      const pageUsers = data?.users || [];

      authUsers.push(...pageUsers);

      if (pageUsers.length < perPage) {
        break;
      }

      page += 1;

      // Safety protection against an unexpected pagination loop.
      if (page > 100) {
        break;
      }
    }

    // ==========================================================
    // 2. Load application profiles.
    // ==========================================================

    const {
      data: profiles,
      error: profilesError,
    } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        role,
        status,
        created_at,
        last_sign_in_at,
        farm_id,
        must_change_password,
        is_platform_admin
      `);

    if (profilesError) {
      console.error(
        "Admin profiles lookup failed:",
        profilesError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load platform profiles",
        },
        {
          status: 500,
        }
      );
    }

    // ==========================================================
    // 3. Load farms.
    // ==========================================================

    const {
      data: farms,
      error: farmsError,
    } = await supabaseAdmin
      .from("farms")
      .select(`
        id,
        name,
        farm_type,
        currency,
        active,
        owner_id
      `);

    if (farmsError) {
      console.error(
        "Admin farms lookup failed:",
        farmsError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load farm data",
        },
        {
          status: 500,
        }
      );
    }

    // ==========================================================
    // 4. Load farm memberships.
    // ==========================================================

    const {
      data: memberships,
      error: membershipsError,
    } = await supabaseAdmin
      .from("farm_users")
      .select(`
        id,
        farm_id,
        user_id,
        role,
        status,
        joined_at
      `);

    if (membershipsError) {
      console.error(
        "Admin farm memberships lookup failed:",
        membershipsError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load farm memberships",
        },
        {
          status: 500,
        }
      );
    }

    // ==========================================================
    // 5. Load subscriptions.
    // ==========================================================

    const {
      data: subscriptions,
      error: subscriptionsError,
    } = await supabaseAdmin
      .from("subscriptions")
      .select(`
        farm_id,
        plan,
        selected_plan,
        status,
        trial_start,
        trial_end,
        next_billing_date
      `);

    if (subscriptionsError) {
      console.error(
        "Admin subscriptions lookup failed:",
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

    const profileRows = profiles || [];
    const farmRows = (farms || []) as FarmRecord[];
    const membershipRows =
      (memberships || []) as MembershipRecord[];
    const subscriptionRows =
      (subscriptions || []) as SubscriptionRecord[];

    const profileById = new Map(
      profileRows.map((profile) => [
        profile.id,
        profile,
      ])
    );

    const farmById = new Map(
      farmRows.map((farm) => [
        farm.id,
        farm,
      ])
    );

    const subscriptionsByFarm =
      new Map<string, SubscriptionRecord[]>();

    for (const subscription of subscriptionRows) {
      if (!subscription.farm_id) {
        continue;
      }

      const existing =
        subscriptionsByFarm.get(
          subscription.farm_id
        ) || [];

      existing.push(subscription);

      subscriptionsByFarm.set(
        subscription.farm_id,
        existing
      );
    }

    const membershipsByUser =
      new Map<string, MembershipRecord[]>();

    for (const membership of membershipRows) {
      const existing =
        membershipsByUser.get(
          membership.user_id
        ) || [];

      existing.push(membership);

      membershipsByUser.set(
        membership.user_id,
        existing
      );
    }

    const ownedFarmsByUser =
      new Map<string, FarmRecord[]>();

    for (const farm of farmRows) {
      if (!farm.owner_id) {
        continue;
      }

      const existing =
        ownedFarmsByUser.get(
          farm.owner_id
        ) || [];

      existing.push(farm);

      ownedFarmsByUser.set(
        farm.owner_id,
        existing
      );
    }

    // ==========================================================
    // 6. Build the complete platform user directory.
    // ==========================================================

    const users = authUsers.map((authUser) => {
      const profile =
        profileById.get(authUser.id) || null;

      const userMemberships =
        membershipsByUser.get(
          authUser.id
        ) || [];

      const ownedFarms =
        ownedFarmsByUser.get(
          authUser.id
        ) || [];

      /*
       * A user may be connected to a farm either through:
       *
       * 1. farms.owner_id
       * 2. farm_users
       *
       * Count the union so an owner is not incorrectly shown
       * as unassigned if a membership row is missing.
       */

      const farmIds = new Set<string>();

      for (const farm of ownedFarms) {
        farmIds.add(farm.id);
      }

      for (const membership of userMemberships) {
        farmIds.add(membership.farm_id);
      }

      const userFarmIds =
        Array.from(farmIds);

      const userFarms =
        userFarmIds
          .map((farmId) =>
            farmById.get(farmId)
          )
          .filter(
            (farm): farm is FarmRecord =>
              Boolean(farm)
          );

      // --------------------------------------------------------
      // Determine customer lifecycle.
      // --------------------------------------------------------

      let lifecycleStatus: LifecycleStatus;

      const isPlatformAdmin =
        Boolean(
          profile?.is_platform_admin
        );

      const role =
        profile?.role ||
        null;

      const isPogp =
        role?.toLowerCase() ===
        "pogp";

      if (isPlatformAdmin) {
        lifecycleStatus =
          "platform_admin";
      } else if (isPogp) {
        lifecycleStatus =
          "pogp_partner";
      } else if (ownedFarms.length === 0) {
        lifecycleStatus =
          authUser.email_confirmed_at
            ? "onboarding_incomplete"
            : "registered_unverified";
      } else {
        const ownedFarmSubscriptions =
          ownedFarms.flatMap(
            (farm) =>
              subscriptionsByFarm.get(
                farm.id
              ) || []
          );

        const activePaid =
          ownedFarmSubscriptions.some(
            (subscription) =>
              (
                subscription.status ||
                ""
              ).toLowerCase() ===
              "active"
          );

        const activeTrial =
          ownedFarmSubscriptions.some(
            (subscription) =>
              (
                subscription.status ||
                ""
              ).toLowerCase() ===
                "trial" &&
              isFutureDate(
                subscription.trial_end
              )
          );

        const expiredTrial =
          ownedFarmSubscriptions.some(
            (subscription) =>
              (
                subscription.status ||
                ""
              ).toLowerCase() ===
                "trial" &&
              Boolean(
                subscription.trial_end
              ) &&
              !isFutureDate(
                subscription.trial_end
              )
          );

        if (activePaid) {
          lifecycleStatus =
            "paid_customer";
        } else if (activeTrial) {
          lifecycleStatus =
            "active_trial";
        } else if (expiredTrial) {
          lifecycleStatus =
            "trial_expired";
        } else {
          lifecycleStatus =
            "farm_created";
        }
      }

      const profileEmail =
        profile?.email ||
        authUser.email ||
        null;

      const fullName =
        profile?.full_name ||
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        null;

      const createdAt =
        profile?.created_at ||
        authUser.created_at ||
        null;

      const lastSignInAt =
        authUser.last_sign_in_at ||
        profile?.last_sign_in_at ||
        null;

      const profileStatus =
        profile?.status ||
        "active";

      const membershipsWithFarm =
        userMemberships.map(
          (membership) => {
            const farm =
              farmById.get(
                membership.farm_id
              );

            return {
              farm_id:
                membership.farm_id,
              farm_name:
                farm?.name || null,
              farm_type:
                farm?.farm_type || null,
              currency:
                farm?.currency || null,
              farm_active:
                farm?.active ?? null,
              role:
                membership.role || null,
              status:
                membership.status || null,
              joined_at:
                membership.joined_at || null,
            };
          }
        );

      const lifecycleLabel =
        getLifecycleLabel(
          lifecycleStatus
        );

      const lifecycleDetail =
        getLifecycleDetail(
          lifecycleStatus,
          authUser.email_confirmed_at ||
            null,
          lastSignInAt
        );

      /*
       * Preserve the existing `profile` object because
       * the POGP administration screen already consumes
       * it from this API.
       */

      return {
        user_id: authUser.id,

        email: profileEmail,

        full_name: fullName,

        role,

        status: profileStatus,

        created_at: createdAt,

        last_sign_in_at:
          lastSignInAt,

        email_confirmed_at:
          authUser.email_confirmed_at ||
          null,

        farm_count:
          userFarmIds.length,

        memberships:
          membershipsWithFarm,

        owned_farms:
          ownedFarms.map((farm) => ({
            id: farm.id,
            name: farm.name,
            farm_type:
              farm.farm_type,
            currency:
              farm.currency,
            active:
              farm.active,
          })),

        lifecycle_status:
          lifecycleStatus,

        lifecycle_label:
          lifecycleLabel,

        lifecycle_detail:
          lifecycleDetail,

        is_platform_admin:
          isPlatformAdmin,

        profile: profile
          ? {
              id: profile.id,
              email:
                profile.email ||
                profileEmail,
              full_name:
                profile.full_name ||
                fullName,
            }
          : {
              id: authUser.id,
              email: profileEmail,
              full_name: fullName,
            },
      };
    });

    // ==========================================================
    // 7. Funnel summary.
    //
    // POGPs and platform administrators are deliberately
    // excluded from the customer acquisition funnel.
    // ==========================================================

    const funnelUsers =
      users.filter(
        (user) =>
          !user.is_platform_admin &&
          user.lifecycle_status !==
            "pogp_partner"
      );

    const registeredUnverified =
      funnelUsers.filter(
        (user) =>
          user.lifecycle_status ===
          "registered_unverified"
      ).length;

    const onboardingIncomplete =
      funnelUsers.filter(
        (user) =>
          user.lifecycle_status ===
          "onboarding_incomplete"
      ).length;

    const farmCreated =
      funnelUsers.filter(
        (user) =>
          user.lifecycle_status ===
          "farm_created"
      ).length;

    const activeTrials =
      funnelUsers.filter(
        (user) =>
          user.lifecycle_status ===
          "active_trial"
      ).length;

    const paidCustomers =
      funnelUsers.filter(
        (user) =>
          user.lifecycle_status ===
          "paid_customer"
      ).length;

    const expiredTrials =
      funnelUsers.filter(
        (user) =>
          user.lifecycle_status ===
          "trial_expired"
      ).length;

    const farmMembers =
      funnelUsers.filter(
        (user) =>
          user.farm_count > 0
      ).length;

    const owners =
      funnelUsers.filter(
        (user) =>
          (
            user.role || ""
          ).toLowerCase() ===
          "owner"
      ).length;

    const staff =
      funnelUsers.filter(
        (user) =>
          (
            user.role || ""
          ).toLowerCase() ===
          "staff"
      ).length;

    return NextResponse.json({
      success: true,

      total: users.length,

      users,

      summary: {
        totalUsers:
          users.length,

        farmMembers,

        registeredUnverified,

        onboardingIncomplete,

        farmCreated,

        activeTrials,

        paidCustomers,

        expiredTrials,

        owners,

        staff,

        pogpPartners:
          users.filter(
            (user) =>
              user.lifecycle_status ===
              "pogp_partner"
          ).length,

        platformAdmins:
          users.filter(
            (user) =>
              user.is_platform_admin
          ).length,
      },
    });
  } catch (error) {
    console.error(
      "Admin users API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load platform users",
      },
      {
        status: 500,
      }
    );
  }
}