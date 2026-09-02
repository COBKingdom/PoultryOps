import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type AuthResult =
  | {
      success: true;
      userId: string;
      partner: any;
    }
  | {
      success: false;
      error: string;
      status: number;
    };

async function authenticatePogp(
  request: Request
): Promise<AuthResult> {
  const authorization =
    request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return {
      success: false,
      error: "Authentication required",
      status: 401,
    };
  }

  const token =
    authorization.substring(7).trim();

  if (!token) {
    return {
      success: false,
      error: "Authentication required",
      status: 401,
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return {
      success: false,
      error: "Invalid or expired login session",
      status: 401,
    };
  }

  const {
    data: profile,
    error: profileError,
  } = await supabaseAdmin
    .from("profiles")
    .select(
      "id, email, full_name, role, status"
    )
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      success: false,
      error: "POGP profile not found",
      status: 404,
    };
  }

  if (profile.role !== "pogp") {
    return {
      success: false,
      error: "POGP access required",
      status: 403,
    };
  }

  if (profile.status !== "active") {
    return {
      success: false,
      error: "Your POGP account is not active",
      status: 403,
    };
  }

  const {
    data: partner,
    error: partnerError,
  } = await supabaseAdmin
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
    .eq("profile_id", user.id)
    .single();

  if (partnerError || !partner) {
    return {
      success: false,
      error: "POGP partner record not found",
      status: 404,
    };
  }

  return {
    success: true,
    userId: user.id,
    partner,
  };
}

export async function GET(
  request: Request
) {
  try {
    const auth =
      await authenticatePogp(request);

    if (!auth.success) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error,
        },
        {
          status: auth.status,
        }
      );
    }

    const partnerId =
      auth.partner.id;

    // ----------------------------------------------------------
    // Direct POGP prospects
    // ----------------------------------------------------------

    const {
      data: prospects,
      error: prospectsError,
    } = await supabaseAdmin
      .from("pogp_prospects")
      .select(`
        id,
        farm_name,
        contact_name,
        phone,
        email,
        status,
        notes,
        created_at,
        updated_at
      `)
      .eq("pogp_id", partnerId)
      .order("created_at", {
        ascending: false,
      });

    if (prospectsError) {
      console.error(
        "POGP prospects lookup failed:",
        prospectsError
      );
    }

    // ----------------------------------------------------------
    // Direct customer attributions
    // ----------------------------------------------------------

    const {
      data: attributions,
      error: attributionsError,
    } = await supabaseAdmin
      .from("pogp_attributions")
      .select(`
        id,
        farm_id,
        source,
        attributed_at,
        created_at,
        notes
      `)
      .eq("pogp_id", partnerId)
      .order("attributed_at", {
        ascending: false,
      });

    if (attributionsError) {
      console.error(
        "POGP customer lookup failed:",
        attributionsError
      );
    }

    const attributionRows =
      attributions || [];

    // ----------------------------------------------------------
    // Farm details
    // ----------------------------------------------------------

    const farmIds =
      attributionRows
        .map(
          (item) => item.farm_id
        )
        .filter(Boolean);

    let farms: any[] = [];

    if (farmIds.length > 0) {
      const {
        data: farmRows,
        error: farmsError,
      } = await supabaseAdmin
        .from("farms")
        .select("id, name")
        .in("id", farmIds);

      if (farmsError) {
        console.error(
          "POGP farm lookup failed:",
          farmsError
        );
      } else {
        farms = farmRows || [];
      }
    }

    const farmMap =
      new Map(
        farms.map((farm) => [
          farm.id,
          farm,
        ])
      );

    // ----------------------------------------------------------
    // Direct commissions
    // ----------------------------------------------------------

    const {
      data: commissions,
      error: commissionsError,
    } = await supabaseAdmin
      .from("pogp_commissions")
      .select(`
        id,
        farm_id,
        subscription_id,
        payment_id,
        commission_type,
        amount,
        status,
        earned_at,
        paid_at,
        notes,
        created_at
      `)
      .eq("pogp_id", partnerId)
      .order("earned_at", {
        ascending: false,
      });

    if (commissionsError) {
      console.error(
        "POGP commission lookup failed:",
        commissionsError
      );
    }

    const commissionRows =
      commissions || [];

    // ----------------------------------------------------------
    // Recruited referral partners
    // ----------------------------------------------------------

    const {
      data: networkPartners,
      error: networkError,
    } = await supabaseAdmin
      .from("referral_partners")
      .select(`
        id,
        full_name,
        business_name,
        email,
        phone,
        referral_code,
        territory,
        source,
        status,
        joined_at,
        created_at
      `)
      .eq(
        "recruited_by_pogp_id",
        partnerId
      )
      .order("created_at", {
        ascending: false,
      });

    if (networkError) {
      console.error(
        "POGP network lookup failed:",
        networkError
      );
    }

    const networkRows =
      networkPartners || [];

    // ----------------------------------------------------------
    // Network referral attributions
    // ----------------------------------------------------------

    const networkPartnerIds =
      networkRows.map(
        (partner) => partner.id
      );

    let networkAttributions: any[] =
      [];

    let networkCommissions: any[] =
      [];

    if (networkPartnerIds.length > 0) {
      const [
        networkAttributionResult,
        networkCommissionResult,
      ] = await Promise.all([
        supabaseAdmin
          .from("referral_attributions")
          .select(`
            id,
            referral_partner_id,
            farm_id,
            source,
            attributed_at
          `)
          .in(
            "referral_partner_id",
            networkPartnerIds
          ),

        supabaseAdmin
          .from("pogp_commissions")
          .select(`
            id,
            farm_id,
            subscription_id,
            commission_type,
            amount,
            status,
            earned_at,
            paid_at,
            notes
          `)
          .eq(
            "pogp_id",
            partnerId
          )
          .order("earned_at", {
            ascending: false,
          }),
      ]);

      if (
        networkAttributionResult.error
      ) {
        console.error(
          "Network attribution lookup failed:",
          networkAttributionResult.error
        );
      } else {
        networkAttributions =
          networkAttributionResult.data ||
          [];
      }

      if (
        networkCommissionResult.error
      ) {
        console.error(
          "Network commission lookup failed:",
          networkCommissionResult.error
        );
      } else {
        networkCommissions =
          networkCommissionResult.data ||
          [];
      }
    }

    // ----------------------------------------------------------
    // Calculate summary
    // ----------------------------------------------------------

    const totalEarned =
      commissionRows.reduce(
        (total, commission) =>
          total +
          Number(
            commission.amount || 0
          ),
        0
      );

    const paidCommission =
      commissionRows
        .filter(
          (commission) =>
            commission.status ===
            "paid"
        )
        .reduce(
          (total, commission) =>
            total +
            Number(
              commission.amount || 0
            ),
          0
        );

    const pendingCommission =
      commissionRows
        .filter(
          (commission) =>
            commission.status !==
            "paid"
        )
        .reduce(
          (total, commission) =>
            total +
            Number(
              commission.amount || 0
            ),
          0
        );

    const activeCustomers =
      attributionRows.filter(
        (item) => {
          const farm =
            farmMap.get(
              item.farm_id
            );

          return Boolean(farm);
        }
      ).length;

    const networkCommissionTotal =
      networkCommissions.reduce(
        (total, commission) =>
          total +
          Number(
            commission.amount || 0
          ),
        0
      );

    // ----------------------------------------------------------
    // Build customer view
    // ----------------------------------------------------------

    const customers =
      attributionRows.map(
        (attribution) => {
          const farm =
            farmMap.get(
              attribution.farm_id
            );

          const customerCommissions =
            commissionRows.filter(
              (commission) =>
                commission.farm_id ===
                attribution.farm_id
            );

          const totalCommission =
            customerCommissions.reduce(
              (total, commission) =>
                total +
                Number(
                  commission.amount || 0
                ),
              0
            );

          return {
            id: attribution.id,
            farmId:
              attribution.farm_id,
            farmName:
              farm?.name ||
              "Customer",
            source:
              attribution.source,
            attributedAt:
              attribution.attributed_at,
            commissionTotal:
              totalCommission,
          };
        }
      );

    // ----------------------------------------------------------
    // Build network view
    // ----------------------------------------------------------

    const network = networkRows.map(
      (networkPartner) => {
        const partnerAttributions =
          networkAttributions.filter(
            (item) =>
              item.referral_partner_id ===
              networkPartner.id
          );

        const partnerCommissionRows =
          networkCommissions.filter(
            (commission) =>
              commission.notes?.includes(
                networkPartner.referral_code
              )
          );

        const partnerEarnings =
          partnerCommissionRows.reduce(
            (total, commission) =>
              total +
              Number(
                commission.amount || 0
              ),
            0
          );

        return {
          ...networkPartner,
          customerCount:
            partnerAttributions.length,
          earnings:
            partnerEarnings,
        };
      }
    );

    return NextResponse.json({
      success: true,

      partner: auth.partner,

      summary: {
        totalCustomers:
          attributionRows.length,

        activeCustomers,

        totalProspects:
          prospects?.length || 0,

        totalEarned,

        paidCommission,

        pendingCommission,

        networkPartners:
          networkRows.length,

        networkCustomers:
          networkAttributions.length,

        networkCommissionTotal,
      },

      customers,

      prospects:
        prospects || [],

      network,

      earnings:
        commissionRows,

      networkEarnings:
        networkCommissions,
    });
  } catch (error) {
    console.error(
      "POGP portal API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load POGP portal",
      },
      {
        status: 500,
      }
    );
  }
}