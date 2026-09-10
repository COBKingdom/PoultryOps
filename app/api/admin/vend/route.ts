import { NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    // ==========================================================
    // 1. Verify platform admin
    // ==========================================================
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
    // 2. Load VEND partners
    // ==========================================================
    const {
      data: vendPartners,
      error: vendPartnersError,
    } = await supabaseAdmin
      .from("vend_partners")
      .select(`
        id,
        profile_id,
        full_name,
        email,
        phone,
        vend_code,
        status,
        territory,
        recruited_by_pogp_id,
        joined_at,
        created_at,
        updated_at
      `)
      .order("created_at", {
        ascending: false,
      });

    if (vendPartnersError) {
      console.error(
        "VEND partners lookup failed:",
        vendPartnersError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load VEND partners",
        },
        {
          status: 500,
        }
      );
    }

    const partners = vendPartners || [];

    const partnerIds = partners.map(
      (partner) => partner.id
    );

    // ==========================================================
    // 3. Load VEND activity
    // ==========================================================
    let attributions: any[] = [];
    let commissions: any[] = [];

    if (partnerIds.length > 0) {
      const [
        attributionsResult,
        commissionsResult,
      ] = await Promise.all([
        supabaseAdmin
          .from("vend_attributions")
          .select(`
            id,
            vend_id,
            farm_id,
            source,
            attributed_at,
            created_at,
            notes
          `)
          .in("vend_id", partnerIds),

        supabaseAdmin
          .from("vend_commissions")
          .select(`
            id,
            vend_id,
            farm_id,
            payment_id,
            commission_type,
            amount,
            status,
            earned_at,
            paid_at,
            notes,
            created_at
          `)
          .in("vend_id", partnerIds),
      ]);

      if (attributionsResult.error) {
        console.error(
          "VEND attribution lookup failed:",
          attributionsResult.error
        );
      } else {
        attributions =
          attributionsResult.data || [];
      }

      if (commissionsResult.error) {
        console.error(
          "VEND commission lookup failed:",
          commissionsResult.error
        );
      } else {
        commissions =
          commissionsResult.data || [];
      }
    }

    // ==========================================================
    // 4. Load recruited-by POGP information
    // ==========================================================
    const recruitedPogpIds = [
      ...new Set(
        partners
          .map(
            (partner) =>
              partner.recruited_by_pogp_id
          )
          .filter(Boolean)
      ),
    ];

    let pogpPartners: any[] = [];

    if (recruitedPogpIds.length > 0) {
      const {
        data,
        error,
      } = await supabaseAdmin
        .from("pogp_partners")
        .select(`
          id,
          full_name,
          email,
          phone,
          pogp_code,
          status,
          territory
        `)
        .in(
          "id",
          recruitedPogpIds
        );

      if (error) {
        console.error(
          "VEND recruited POGP lookup failed:",
          error
        );
      } else {
        pogpPartners = data || [];
      }
    }

    // ==========================================================
    // 5. Collect referred farm IDs
    // ==========================================================
    const farmIds = [
      ...new Set(
        attributions
          .map(
            (attribution) =>
              attribution.farm_id
          )
          .filter(Boolean)
      ),
    ];

    let farms: any[] = [];
    let profiles: any[] = [];
    let subscriptions: any[] = [];
    let payments: any[] = [];

    if (farmIds.length > 0) {
      // --------------------------------------------------------
      // Farms
      // --------------------------------------------------------
      const {
        data: farmRows,
        error: farmsError,
      } = await supabaseAdmin
        .from("farms")
        .select(`
          id,
          name,
          owner_id,
          created_at,
          active,
          farm_type,
          currency
        `)
        .in("id", farmIds);

      if (farmsError) {
        console.error(
          "VEND customer farms lookup failed:",
          farmsError
        );
      } else {
        farms = farmRows || [];
      }

      // --------------------------------------------------------
      // Owner profiles
      // --------------------------------------------------------
      const ownerIds = [
        ...new Set(
          farms
            .map(
              (farm) =>
                farm.owner_id
            )
            .filter(Boolean)
        ),
      ];

      if (ownerIds.length > 0) {
        const {
          data: profileRows,
          error: profilesError,
        } = await supabaseAdmin
          .from("profiles")
          .select(`
            id,
            full_name,
            email,
            phone,
            farm_id
          `)
          .in("id", ownerIds);

        if (profilesError) {
          console.error(
            "VEND customer profiles lookup failed:",
            profilesError
          );
        } else {
          profiles =
            profileRows || [];
        }
      }

      // --------------------------------------------------------
      // Subscriptions
      // --------------------------------------------------------
      const {
        data: subscriptionRows,
        error: subscriptionsError,
      } = await supabaseAdmin
        .from("subscriptions")
        .select(`
          id,
          farm_id,
          plan,
          status,
          trial_start,
          trial_end,
          selected_plan,
          billing_cycle,
          next_billing_date,
          amount_paid,
          payment_reference,
          transaction_id,
          created_at
        `)
        .in("farm_id", farmIds);

      if (subscriptionsError) {
        console.error(
          "VEND customer subscriptions lookup failed:",
          subscriptionsError
        );
      } else {
        subscriptions =
          subscriptionRows || [];
      }

      // --------------------------------------------------------
      // Payments
      // --------------------------------------------------------
      const {
        data: paymentRows,
        error: paymentsError,
      } = await supabaseAdmin
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
        .in("farm_id", farmIds)
        .order("created_at", {
          ascending: false,
        });

      if (paymentsError) {
        console.error(
          "VEND customer payments lookup failed:",
          paymentsError
        );
      } else {
        payments =
          paymentRows || [];
      }
    }

    // ==========================================================
    // 6. Build referred customer list
    // ==========================================================
    const customers = attributions
      .map((attribution) => {
        const farm = farms.find(
          (item) =>
            item.id ===
            attribution.farm_id
        );

        if (!farm) {
          return null;
        }

        const owner = profiles.find(
          (profile) =>
            profile.id ===
            farm.owner_id
        );

        const partner = partners.find(
          (item) =>
            item.id ===
            attribution.vend_id
        );

        const subscriptionRows =
          subscriptions.filter(
            (item) =>
              item.farm_id ===
              farm.id
          );

        const subscription =
          [...subscriptionRows].sort(
            (a, b) =>
              new Date(
                b.created_at || 0
              ).getTime() -
              new Date(
                a.created_at || 0
              ).getTime()
          )[0] || null;

        const farmPayments =
          payments.filter(
            (payment) =>
              payment.farm_id ===
              farm.id
          );

        const successfulPayments =
          farmPayments.filter(
            (payment) =>
              payment.status ===
              "successful"
          );

        const farmCommissions =
          commissions.filter(
            (commission) =>
              commission.farm_id ===
              farm.id
          );

        const commissionTotal =
          farmCommissions.reduce(
            (total, commission) =>
              total +
              Number(
                commission.amount || 0
              ),
            0
          );

        const paidCommission =
          farmCommissions
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
          farmCommissions
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

        return {
          id: attribution.id,

          farmId: farm.id,
          farmName:
            farm.name ||
            "Unnamed farm",

          farmType:
            farm.farm_type || null,

          currency:
            farm.currency || null,

          farmActive:
            farm.active,

          ownerId:
            farm.owner_id || null,

          ownerName:
            owner?.full_name ||
            "Unnamed farmer",

          ownerEmail:
            owner?.email ||
            "No email",

          ownerPhone:
            owner?.phone ||
            null,

          vendId:
            partner?.id ||
            attribution.vend_id,

          vendName:
            partner?.full_name ||
            "Unknown VEND",

          vendEmail:
            partner?.email ||
            "",

          vendPhone:
            partner?.phone ||
            null,

          vendCode:
            partner?.vend_code ||
            "—",

          vendTerritory:
            partner?.territory ||
            null,

          source:
            attribution.source ||
            "manual",

          attributedAt:
            attribution.attributed_at,

          subscription:
            subscription
              ? {
                  plan:
                    subscription.selected_plan ||
                    subscription.plan ||
                    "—",

                  status:
                    subscription.status ||
                    "—",

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

          paymentCount:
            successfulPayments.length,

          totalPaid:
            successfulPayments.reduce(
              (total, payment) =>
                total +
                Number(
                  payment.amount_paid ||
                    0
                ),
              0
            ),

          commissionTotal,

          paidCommission,

          pendingCommission,

          payments:
            farmPayments.map(
              (payment) => ({
                id: payment.id,
                plan: payment.plan,
                billingCycle:
                  payment.billing_cycle,
                amountPaid:
                  Number(
                    payment.amount_paid ||
                      0
                  ),
                transactionId:
                  payment.transaction_id,
                paymentReference:
                  payment.payment_reference,
                status:
                  payment.status,
                paidAt:
                  payment.paid_at,
                createdAt:
                  payment.created_at,
              })
            ),
        };
      })
      .filter(Boolean);

    // ==========================================================
    // 7. Build VEND partner statistics
    // ==========================================================
    const partnersWithStats =
      partners.map((partner) => {
        const partnerAttributions =
          attributions.filter(
            (attribution) =>
              attribution.vend_id ===
              partner.id
          );

        const partnerCommissions =
          commissions.filter(
            (commission) =>
              commission.vend_id ===
              partner.id
          );

        const partnerCustomers =
          customers.filter(
            (customer: any) =>
              customer?.vendId ===
              partner.id
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

        const paidCommission =
          partnerCommissions
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
          partnerCommissions
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

        const recruitedByPogp =
          pogpPartners.find(
            (pogp) =>
              pogp.id ===
              partner.recruited_by_pogp_id
          );

        return {
          ...partner,

          recruitedByPogp:
            recruitedByPogp
              ? {
                  id:
                    recruitedByPogp.id,

                  fullName:
                    recruitedByPogp.full_name,

                  email:
                    recruitedByPogp.email,

                  phone:
                    recruitedByPogp.phone,

                  pogpCode:
                    recruitedByPogp.pogp_code,

                  status:
                    recruitedByPogp.status,

                  territory:
                    recruitedByPogp.territory,
                }
              : null,

          farmCount:
            partnerAttributions.length,

          customerCount:
            partnerCustomers.length,

          successfulCustomerCount:
            partnerCustomers.filter(
              (customer: any) =>
                Number(
                  customer?.paymentCount ||
                    0
                ) > 0
            ).length,

          commissionTotal,

          paidCommission,

          pendingCommission,
        };
      });

    // ==========================================================
    // 8. Build overall summary
    // ==========================================================
    const totalCommission =
      commissions.reduce(
        (total, commission) =>
          total +
          Number(
            commission.amount || 0
          ),
        0
      );

    const paidCommission =
      commissions
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
      commissions
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

    const activeVends =
      partners.filter(
        (partner) =>
          partner.status ===
          "active"
      ).length;

    const vendsWithCustomers =
      new Set(
        attributions.map(
          (attribution) =>
            attribution.vend_id
        )
      ).size;

    const successfulReferrals =
      customers.filter(
        (customer: any) =>
          Number(
            customer?.paymentCount ||
              0
          ) > 0
      ).length;

    const summary = {
      totalVends:
        partners.length,

      activeVends,

      vendsWithCustomers,

      totalFarmsReferred:
        attributions.length,

      successfulReferrals,

      totalCommissions:
        totalCommission,

      paidCommissions:
        paidCommission,

      pendingCommissions:
        pendingCommission,
    };

    // ==========================================================
    // 9. Commission history
    // ==========================================================
    const commissionHistory =
      commissions
        .map((commission) => {
          const partner =
            partners.find(
              (item) =>
                item.id ===
                commission.vend_id
            );

          const customer =
            customers.find(
              (item: any) =>
                item?.farmId ===
                commission.farm_id
            );

          const payment =
            payments.find(
              (item) =>
                item.id ===
                commission.payment_id
            );

          return {
            id: commission.id,

            vendId:
              commission.vend_id,

            vendName:
              partner?.full_name ||
              "Unknown VEND",

            vendCode:
              partner?.vend_code ||
              "—",

            farmId:
              commission.farm_id,

            farmName:
              customer?.farmName ||
              "Unknown farm",

            paymentId:
              commission.payment_id,

            paymentAmount:
              payment
                ? Number(
                    payment.amount_paid ||
                      0
                  )
                : 0,

            commissionType:
              commission.commission_type,

            amount:
              Number(
                commission.amount || 0
              ),

            status:
              commission.status,

            earnedAt:
              commission.earned_at,

            paidAt:
              commission.paid_at,

            notes:
              commission.notes ||
              null,
          };
        })
        .sort(
          (a, b) =>
            new Date(
              b.earnedAt || 0
            ).getTime() -
            new Date(
              a.earnedAt || 0
            ).getTime()
        );

    // ==========================================================
    // 10. Response
    // ==========================================================
    return NextResponse.json({
      success: true,

      summary,

      partners:
        partnersWithStats,

      customers,

      commissions:
        commissionHistory,

      meta: {
        generatedAt:
          new Date().toISOString(),

        partnerCount:
          partners.length,

        attributionCount:
          attributions.length,

        commissionCount:
          commissions.length,
      },
    });
  } catch (error) {
    console.error(
      "ADMIN VEND API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load VEND administration data",
      },
      {
        status: 500,
      }
    );
  }
}