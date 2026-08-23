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

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select(`
      id,
      email,
      full_name,
      role,
      status,
      created_at,
      last_sign_in_at
    `)
    .order("created_at", { ascending: false });

  if (profilesError) {
    console.error("Admin users profile lookup failed:", profilesError);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load platform users",
      },
      {
        status: 500,
      }
    );
  }

  const userIds = (profiles || []).map((profile) => profile.id);

  let memberships: any[] = [];

  if (userIds.length > 0) {
    const { data, error: membershipsError } = await supabaseAdmin
      .from("farm_users")
      .select(`
        user_id,
        farm_id,
        role,
        status,
        joined_at
      `)
      .in("user_id", userIds);

    if (membershipsError) {
      console.error(
        "Admin user farm membership lookup failed:",
        membershipsError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load user farm memberships",
        },
        {
          status: 500,
        }
      );
    }

    memberships = data || [];
  }

  const farmIds = [
    ...new Set(
      memberships
        .map((membership) => membership.farm_id)
        .filter(Boolean)
    ),
  ];

  let farms: any[] = [];

  if (farmIds.length > 0) {
    const { data, error: farmsError } = await supabaseAdmin
      .from("farms")
      .select(`
        id,
        name,
        farm_type,
        currency,
        active
      `)
      .in("id", farmIds);

    if (farmsError) {
      console.error("Admin user farm lookup failed:", farmsError);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load user farm information",
        },
        {
          status: 500,
        }
      );
    }

    farms = data || [];
  }

  const farmMap = new Map(
    farms.map((farm) => [farm.id, farm])
  );

  const users = (profiles || []).map((profile) => {
    const userMemberships = memberships.filter(
      (membership) => membership.user_id === profile.id
    );

    return {
      user_id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      status: profile.status,
      created_at: profile.created_at,
      last_sign_in_at: profile.last_sign_in_at,

      farm_count: userMemberships.length,

      memberships: userMemberships.map((membership) => ({
        farm_id: membership.farm_id,
        farm_name:
          farmMap.get(membership.farm_id)?.name || null,
        farm_type:
          farmMap.get(membership.farm_id)?.farm_type || null,
        currency:
          farmMap.get(membership.farm_id)?.currency || null,
        farm_active:
          farmMap.get(membership.farm_id)?.active ?? null,
        role: membership.role,
        status: membership.status,
        joined_at: membership.joined_at,
      })),
    };
  });

  return NextResponse.json({
    success: true,
    total: users.length,
    users,
  });
}
