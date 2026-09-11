import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);

    if (!auth.success || !auth.user) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error || "Authentication required",
        },
        { status: auth.statusCode || 401 }
      );
    }

    const user = auth.user;

    const { data: profile, error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .select(
          "id, email, full_name, role, status, must_change_password"
        )
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      console.error(
        "VEND portal profile lookup failed:",
        profileError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load your profile",
        },
        { status: 500 }
      );
    }

    if (!profile || profile.role !== "vend") {
      return NextResponse.json(
        {
          success: false,
          error: "VEND portal access required",
        },
        { status: 403 }
      );
    }

    const { data: partner, error: partnerError } =
      await supabaseAdmin
        .from("vend_partners")
        .select(
          "id, profile_id, full_name, email, phone, vend_code, status, territory, recruited_by_pogp_id, joined_at"
        )
        .eq("profile_id", user.id)
        .maybeSingle();

    if (partnerError) {
      console.error(
        "VEND portal partner lookup failed:",
        partnerError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load your VEND account",
        },
        { status: 500 }
      );
    }

    if (!partner) {
      return NextResponse.json(
        {
          success: false,
          error: "VEND partner account not found",
        },
        { status: 404 }
      );
    }

    let recruitedByPogp = null;

    if (partner.recruited_by_pogp_id) {
      const { data: pogp } =
        await supabaseAdmin
          .from("pogp_partners")
          .select(
            "id, full_name, email, phone, pogp_code, territory"
          )
          .eq(
            "id",
            partner.recruited_by_pogp_id
          )
          .maybeSingle();

      if (pogp) {
        recruitedByPogp = pogp;
      }
    }

    const {
      data: attributions,
      error: attributionError,
    } = await supabaseAdmin
      .from("vend_attributions")
      .select(
        "id, farm_id, source, attributed_at, created_at, notes"
      )
      .eq("vend_id", partner.id)
      .order("attributed_at", {
        ascending: false,
      });

    if (attributionError) {
      console.error(
        "VEND portal attribution lookup failed:",
        attributionError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to load your customer referrals",
        },
        { status: 500 }
      );
    }

    const farmIds = Array.from(
      new Set(
        (attributions || [])
          .map((item) => item.farm_id)
          .filter(Boolean)
      )
    );

    let farms: any[] = [];

    if (farmIds.length > 0) {
      const {
        data: farmRows,
        error: farmError,
      } = await supabaseAdmin
        .from("farms")
        .select(
          "id, name, created_at"
        )
        .in("id", farmIds);

      if (farmError) {
        console.error(
          "VEND portal farm lookup failed:",
          farmError
        );
      } else {
        farms = farmRows || [];
      }
    }

    const farmMap = new Map(
      farms.map((farm) => [
        farm.id,
        farm,
      ])
    );

    const {
      data: commissions,
      error: commissionError,
    } = await supabaseAdmin
      .from("vend_commissions")
      .select(
        "id, farm_id, payment_id, commission_type, amount, status, earned_at, paid_at, notes, created_at"
      )
      .eq("vend_id", partner.id)
      .order("earned_at", {
        ascending: false,
      });

    if (commissionError) {
      console.error(
        "VEND portal commission lookup failed:",
        commissionError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to load your earnings",
        },
        { status: 500 }
      );
    }

    const commissionRows =
      commissions || [];

    const commissionByFarm =
      new Map<string, number>();

    for (const commission of commissionRows) {
      if (!commission.farm_id) {
        continue;
      }

      commissionByFarm.set(
        commission.farm_id,
        (commissionByFarm.get(
          commission.farm_id
        ) || 0) +
          Number(
            commission.amount || 0
          )
      );
    }

    const paymentIds = Array.from(
      new Set(
        commissionRows
          .map(
            (commission) =>
              commission.payment_id
          )
          .filter(Boolean)
      )
    );

    let payments: any[] = [];

    if (paymentIds.length > 0) {
      const {
        data: paymentRows,
      } = await supabaseAdmin
        .from("payments")
        .select(
          "id, farm_id, plan, billing_cycle, amount_paid, status, paid_at, transaction_id, payment_reference"
        )
        .in(
          "id",
          paymentIds
        );

      payments =
        paymentRows || [];
    }

    const paymentMap =
      new Map(
        payments.map(
          (payment) => [
            payment.id,
            payment,
          ]
        )
      );

    const customers =
      (attributions || []).map(
        (attribution) => {
          const farm =
            farmMap.get(
              attribution.farm_id
            );

          const farmCommissions =
            commissionByFarm.get(
              attribution.farm_id
            ) || 0;

          const farmPayments =
            payments.filter(
              (payment) =>
                payment.farm_id ===
                attribution.farm_id
            );

          const successfulPayment =
            farmPayments.some(
              (payment) =>
                payment.status ===
                  "successful" ||
                payment.status ===
                  "completed" ||
                payment.status ===
                  "paid"
            );

          return {
            id: attribution.id,
            farmId:
              attribution.farm_id,
            farmName:
              farm?.name ||
              "Poultry Farm",
            source:
              attribution.source ||
              "referral_code",
            attributedAt:
              attribution.attributed_at ||
              attribution.created_at,
            commissionTotal:
              farmCommissions,
            hasSuccessfulPayment:
              successfulPayment,
          };
        }
      );

    const totalEarned =
      commissionRows.reduce(
        (sum, commission) =>
          sum +
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
          (sum, commission) =>
            sum +
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
          (sum, commission) =>
            sum +
            Number(
              commission.amount || 0
            ),
          0
        );

    const activeCustomers =
      customers.filter(
        (customer) =>
          customer.hasSuccessfulPayment
      ).length;

    const successfulReferrals =
      customers.filter(
        (customer) =>
          customer.hasSuccessfulPayment
      ).length;

    const recentEarnings =
      commissionRows.map(
        (commission) => ({
          ...commission,
          farmName:
            commission.farm_id
              ? farmMap.get(
                  commission.farm_id
                )?.name ||
                "Poultry Farm"
              : "Poultry Farm",
          payment:
            commission.payment_id
              ? paymentMap.get(
                  commission.payment_id
                ) || null
              : null,
        })
      );

    return NextResponse.json({
      success: true,

      partner: {
        id: partner.id,
        profile_id:
          partner.profile_id,
        full_name:
          partner.full_name ||
          profile.full_name ||
          "",
        email:
          partner.email ||
          profile.email ||
          "",
        phone:
          partner.phone,
        vend_code:
          partner.vend_code,
        status:
          partner.status,
        territory:
          partner.territory,
        joined_at:
          partner.joined_at,
        recruitedByPogp,
        referralLink:
          `${
            process.env
              .NEXT_PUBLIC_APP_URL ||
            "https://poultry.trueops.app"
          }/register?ref=${encodeURIComponent(
            partner.vend_code
          )}`,
      },

      summary: {
        totalCustomers:
          customers.length,
        activeCustomers,
        successfulReferrals,
        totalEarned,
        paidCommission,
        pendingCommission,
      },

      customers,

      earnings:
        recentEarnings,
    });
  } catch (error) {
    console.error(
      "VEND portal error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load your VEND portal",
      },
      { status: 500 }
    );
  }
}
