import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const auth = await requirePlatformAdmin(request);

    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.statusCode || 403 }
      );
    }

    const { data: partners, error: partnersError } =
      await supabaseAdmin
        .from("pogp_partners")
        .select(`
          id,
          profile_id,
          pogp_code,
          status,
          territory,
          joined_at,
          notes,
          created_at
        `)
        .order("created_at", { ascending: false });

    if (partnersError) {
      console.error("POGP partners lookup failed:", partnersError);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load POGP partners",
        },
        { status: 500 }
      );
    }

    const partnerRows = partners || [];

    const profileIds = partnerRows
      .map((partner) => partner.profile_id)
      .filter(Boolean);

    let profiles: any[] = [];

    if (profileIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name")
        .in("id", profileIds);

      if (error) {
        console.error("POGP profile lookup failed:", error);

        return NextResponse.json(
          {
            success: false,
            error: "Unable to load POGP profiles",
          },
          { status: 500 }
        );
      }

      profiles = data || [];
    }

    const profileMap = new Map(
      profiles.map((profile) => [profile.id, profile])
    );

    const partnerIds = partnerRows.map((partner) => partner.id);

    let prospects: any[] = [];
    let attributions: any[] = [];
    let commissions: any[] = [];

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
          .select("id, pogp_id, farm_id")
          .in("pogp_id", partnerIds),

        supabaseAdmin
          .from("pogp_commissions")
          .select("id, pogp_id, amount, status")
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
        attributions = attributionsResult.data || [];
      }

      if (commissionsResult.error) {
        console.error(
          "POGP commission lookup failed:",
          commissionsResult.error
        );
      } else {
        commissions = commissionsResult.data || [];
      }
    }

    const partnersWithStats = partnerRows.map((partner) => {
      const profile = profileMap.get(partner.profile_id);

      const partnerProspects = prospects.filter(
        (prospect) => prospect.pogp_id === partner.id
      );

      const partnerCustomers = attributions.filter(
        (attribution) => attribution.pogp_id === partner.id
      );

      const partnerCommissions = commissions.filter(
        (commission) => commission.pogp_id === partner.id
      );

      const commissionTotal = partnerCommissions.reduce(
        (total, commission) =>
          total + Number(commission.amount || 0),
        0
      );

      return {
        ...partner,
        profile: profile || null,
        prospectCount: partnerProspects.length,
        customerCount: partnerCustomers.length,
        commissionTotal,
      };
    });

    const totalProspects = prospects.length;
    const totalCustomers = attributions.length;

    const totalCommission = commissions.reduce(
      (total, commission) =>
        total + Number(commission.amount || 0),
      0
    );

    const activePartners = partnerRows.filter(
      (partner) => partner.status === "active"
    ).length;

    return NextResponse.json({
      success: true,

      summary: {
        totalPartners: partnerRows.length,
        activePartners,
        totalProspects,
        totalCustomers,
        totalCommission,
      },

      partners: partnersWithStats,
    });
  } catch (error) {
    console.error("POGP admin GET error:", error);

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
    const auth = await requirePlatformAdmin(request);

    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.statusCode || 403 }
      );
    }

    const body = await request.json();

    const profileId = String(body.profileId || "").trim();
    const pogpCode = String(body.pogpCode || "")
      .trim()
      .toUpperCase();
    const territory = String(body.territory || "").trim();
    const notes = String(body.notes || "").trim();

    if (!profileId) {
      return NextResponse.json(
        {
          success: false,
          error: "Profile is required",
        },
        { status: 400 }
      );
    }

    if (!pogpCode) {
      return NextResponse.json(
        {
          success: false,
          error: "POGP code is required",
        },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", profileId)
        .maybeSingle();

    if (profileError) {
      console.error(
        "POGP profile validation failed:",
        profileError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to validate profile",
        },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Selected profile was not found",
        },
        { status: 404 }
      );
    }

    const { data: existingProfile } =
      await supabaseAdmin
        .from("pogp_partners")
        .select("id")
        .eq("profile_id", profileId)
        .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        {
          success: false,
          error: "This user is already a POGP partner",
        },
        { status: 409 }
      );
    }

    const { data: existingCode } =
      await supabaseAdmin
        .from("pogp_partners")
        .select("id")
        .eq("pogp_code", pogpCode)
        .maybeSingle();

    if (existingCode) {
      return NextResponse.json(
        {
          success: false,
          error: "This POGP code is already in use",
        },
        { status: 409 }
      );
    }

    const { data: partner, error: insertError } =
      await supabaseAdmin
        .from("pogp_partners")
        .insert({
          profile_id: profileId,
          pogp_code: pogpCode,
          territory: territory || null,
          notes: notes || null,
        })
        .select(`
          id,
          profile_id,
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

      return NextResponse.json(
        {
          success: false,
          error: "Unable to create POGP partner",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      partner,
    });
  } catch (error) {
    console.error("POGP admin POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}