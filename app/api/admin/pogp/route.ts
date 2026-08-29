import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const auth = await requirePlatformAdmin(request);

    if (!auth.success) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error,
        },
        {
          status: auth.statusCode || 403,
        }
      );
    }

    // ==========================================================
    // 1. Load POGP partners
    // ==========================================================

    const { data: partners, error: partnersError } =
      await supabaseAdmin
        .from("pogp_partners")
        .select(`
          id,
          profile_id,
          full_name,
          phone,
          email,
          pogp_code,
          status,
          territory,
          joined_at,
          notes,
          created_at
        `)
        .order("created_at", { ascending: false });

    if (partnersError) {
      console.error(
        "POGP partners lookup failed:",
        partnersError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load POGP partners",
        },
        { status: 500 }
      );
    }

    const partnerRows = partners || [];
    const partnerIds = partnerRows.map(
      (partner) => partner.id
    );

    let prospects: any[] = [];
    let attributions: any[] = [];
    let commissions: any[] = [];

    // ==========================================================
    // 2. Load POGP activity
    // ==========================================================

    if (partnerIds.length > 0) {
      const [
        prospectsResult,
        attributionsResult,
        commissionsResult,
      ] = await Promise.all([
        supabaseAdmin
          .from("pogp_prospects")
          .select("id, pogp_id, status")
          .in("pogp_id", partnerIds),

        supabaseAdmin
          .from("pogp_attributions")
          .select(
            "id, pogp_id, farm_id, source, attributed_at"
          )
          .in("pogp_id", partnerIds),

        supabaseAdmin
          .from("pogp_commissions")
          .select(
            "id, pogp_id, amount, status"
          )
          .in("pogp_id", partnerIds),
      ]);

      if (prospectsResult.error) {
        console.error(
          "POGP prospects lookup failed:",
          prospectsResult.error
        );
      } else {
        prospects = prospectsResult.data || [];
      }

      if (attributionsResult.error) {
        console.error(
          "POGP attribution lookup failed:",
          attributionsResult.error
        );
      } else {
        attributions =
          attributionsResult.data || [];
      }

      if (commissionsResult.error) {
        console.error(
          "POGP commission lookup failed:",
          commissionsResult.error
        );
      } else {
        commissions =
          commissionsResult.data || [];
      }
    }

    // ==========================================================
    // 3. Load customer/farm information
    // ==========================================================

    const farmIds = [
      ...new Set(
        attributions
          .map((attribution) => attribution.farm_id)
          .filter(Boolean)
      ),
    ];

    let farms: any[] = [];
    let profiles: any[] = [];
    let subscriptions: any[] = [];

    if (farmIds.length > 0) {
      const { data: farmRows, error: farmsError } =
        await supabaseAdmin
          .from("farms")
          .select(
            "id, name, owner_id, created_at, active, farm_type, currency"
          )
          .in("id", farmIds);

      if (farmsError) {
        console.error(
          "POGP customer farms lookup failed:",
          farmsError
        );
      } else {
        farms = farmRows || [];
      }

      const ownerIds = [
        ...new Set(
          farms
            .map((farm) => farm.owner_id)
            .filter(Boolean)
        ),
      ];

      if (ownerIds.length > 0) {
        const { data: profileRows, error: profilesError } =
          await supabaseAdmin
            .from("profiles")
            .select(
              "id, full_name, email, farm_id"
            )
            .in("id", ownerIds);

        if (profilesError) {
          console.error(
            "POGP customer profiles lookup failed:",
            profilesError
          );
        } else {
          profiles = profileRows || [];
        }
      }

      const {
        data: subscriptionRows,
        error: subscriptionsError,
      } = await supabaseAdmin
        .from("subscriptions")
        .select(
          "id, farm_id, plan, status, trial_start, trial_end, selected_plan, billing_cycle, next_billing_date"
        )
        .in("farm_id", farmIds);

      if (subscriptionsError) {
        console.error(
          "POGP customer subscriptions lookup failed:",
          subscriptionsError
        );
      } else {
        subscriptions =
          subscriptionRows || [];
      }
    }

    // ==========================================================
    // 4. Build customer list
    // ==========================================================

    const customers = attributions
      .map((attribution) => {
        const farm = farms.find(
          (item) =>
            item.id === attribution.farm_id
        );

        if (!farm) {
          return null;
        }

        const owner = profiles.find(
          (profile) =>
            profile.id === farm.owner_id
        );

        const subscription =
          subscriptions
            .filter(
              (item) =>
                item.farm_id === farm.id
            )
            .sort(
              (a, b) =>
                new Date(
                  b.created_at || 0
                ).getTime() -
                new Date(
                  a.created_at || 0
                ).getTime()
            )[0] || null;

        const partner = partnerRows.find(
          (item) =>
            item.id === attribution.pogp_id
        );

        return {
          id: attribution.id,
          farmId: farm.id,
          farmName: farm.name,
          farmType: farm.farm_type,
          currency: farm.currency,
          farmActive: farm.active,
          ownerId: farm.owner_id,
          ownerName:
            owner?.full_name ||
            "Unnamed farmer",
          ownerEmail:
            owner?.email ||
            "No email",
          pogpId:
            partner?.id || null,
          pogpName:
            partner?.full_name ||
            "Unknown POGP",
          pogpEmail:
            partner?.email || "",
          pogpCode:
            partner?.pogp_code || "â€”",
          source:
            attribution.source ||
            "manual",
          attributedAt:
            attribution.attributed_at,
          subscription: subscription
            ? {
                plan:
                  subscription.selected_plan ||
                  subscription.plan ||
                  "â€”",
                status:
                  subscription.status ||
                  "â€”",
                trialStart:
                  subscription.trial_start,
                trialEnd:
                  subscription.trial_end,
                billingCycle:
                  subscription.billing_cycle,
                nextBillingDate:
                  subscription.next_billing_date,
              }
            : null,
        };
      })
      .filter(Boolean);

    // ==========================================================
    // 5. Build partner statistics
    // ==========================================================

    const partnersWithStats =
      partnerRows.map((partner) => {
        const partnerProspects =
          prospects.filter(
            (prospect) =>
              prospect.pogp_id === partner.id
          );

        const partnerCustomers =
          attributions.filter(
            (attribution) =>
              attribution.pogp_id === partner.id
          );

        const partnerCommissions =
          commissions.filter(
            (commission) =>
              commission.pogp_id === partner.id
          );

        const commissionTotal =
          partnerCommissions.reduce(
            (total, commission) =>
              total +
              Number(
                commission.amount || 0
              ),
            0
          );

        return {
          ...partner,
          prospectCount:
            partnerProspects.length,
          customerCount:
            partnerCustomers.length,
          commissionTotal,
        };
      });

    // ==========================================================
    // 6. Summary
    // ==========================================================

    const totalProspects =
      prospects.length;

    const totalCustomers =
      attributions.length;

    const totalCommission =
      commissions.reduce(
        (total, commission) =>
          total +
          Number(
            commission.amount || 0
          ),
        0
      );

    const activePartners =
      partnerRows.filter(
        (partner) =>
          partner.status === "active"
      ).length;

    return NextResponse.json({
      success: true,

      summary: {
        totalPartners:
          partnerRows.length,
        activePartners,
        totalProspects,
        totalCustomers,
        totalCommission,
      },

      partners: partnersWithStats,

      customers,
    });
  } catch (error) {
    console.error(
      "POGP admin GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth =
      await requirePlatformAdmin(request);

    if (!auth.success) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error,
        },
        {
          status:
            auth.statusCode || 403,
        }
      );
    }

    const body = await request.json();

    const fullName =
      String(body.fullName || "").trim();

    const email =
      String(body.email || "")
        .trim()
        .toLowerCase();

    const phone =
      String(body.phone || "").trim();

    const territory =
      String(body.territory || "").trim();

    const notes =
      String(body.notes || "").trim();

    // ==========================================================
    // Validation
    // ==========================================================

    if (!fullName) {
      return NextResponse.json(
        {
          success: false,
          error: "Full name is required",
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "Email address is required",
        },
        { status: 400 }
      );
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter a valid email address",
        },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number is required",
        },
        { status: 400 }
      );
    }

    // ==========================================================
    // GLOBAL EMAIL PROTECTION
    //
    // ONE EMAIL ADDRESS = ONE ACCOUNT/PERSON
    //
    // A POGP must not be created using an email that is
    // already registered as a PoultryOps authentication user.
    // ==========================================================

    const normalizedEmail = email.trim().toLowerCase();

    const {
      data: authUsersData,
      error: authLookupError,
    } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (authLookupError) {
      console.error(
        "POGP Auth email lookup failed:",
        authLookupError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to verify whether this email address is already registered",
        },
        { status: 500 }
      );
    }

    const existingAuthUser =
      authUsersData.users.find(
        (user) =>
          user.email?.trim().toLowerCase() ===
          normalizedEmail
      );

    if (existingAuthUser) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This email address is already registered with PoultryOps. A registered PoultryOps email cannot also be used to create a POGP.",
        },
        { status: 409 }
      );
    }

    // ==========================================================
    // Check existing POGP email
    //
    // This protects against duplicate POGP records even when
    // the email does not belong to an Auth account.
    // ==========================================================

    const {
      data: existingPartner,
      error: partnerEmailLookupError,
    } = await supabaseAdmin
      .from("pogp_partners")
      .select("id, full_name, email, pogp_code")
      .ilike("email", email)
      .maybeSingle();

    if (partnerEmailLookupError) {
      console.error(
        "POGP email lookup failed:",
        partnerEmailLookupError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to verify whether this email address is already assigned to a POGP",
        },
        { status: 500 }
      );
    }

    if (existingPartner) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This email address is already assigned to a POGP partner. Each email address can only be used once.",
        },
        { status: 409 }
      );
    }

    // ==========================================================
    // Generate next POGP code
    // ==========================================================

    const {
      data: existingPartners,
      error: codeLookupError,
    } = await supabaseAdmin
      .from("pogp_partners")
      .select("pogp_code");

    if (codeLookupError) {
      console.error(
        "POGP code lookup failed:",
        codeLookupError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to generate POGP code",
        },
        { status: 500 }
      );
    }

    let highestNumber = 0;

    for (
      const partner of
        existingPartners || []
    ) {
      const match =
        String(
          partner.pogp_code || ""
        ).match(
          /^POGP-(\d+)$/
        );

      if (match) {
        highestNumber =
          Math.max(
            highestNumber,
            Number(match[1])
          );
      }
    }

    const nextNumber =
      highestNumber + 1;

    const pogpCode =
      `POGP-${String(
        nextNumber
      ).padStart(3, "0")}`;

    // ==========================================================
    // Create independent POGP
    // ==========================================================

    const {
      data: partner,
      error: insertError,
    } = await supabaseAdmin
      .from("pogp_partners")
      .insert({
        profile_id: null,
        full_name: fullName,
        phone,
        email,
        pogp_code: pogpCode,
        territory:
          territory || null,
        notes:
          notes || null,
        status: "active",
      })
      .select(`
        id,
        profile_id,
        full_name,
        phone,
        email,
        pogp_code,
        status,
        territory,
        joined_at,
        notes,
        created_at
      `)
      .single();

    if (insertError) {
      console.error(
        "POGP partner creation failed:",
        insertError
      );

      if (
        insertError.code ===
        "23505"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "A POGP partner with this email already exists",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to create POGP partner",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      partner,
    });
  } catch (error) {
    console.error(
      "POGP admin POST error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
