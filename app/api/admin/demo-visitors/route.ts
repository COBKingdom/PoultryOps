import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const auth = await requirePlatformAdmin(request);

  if (!auth.success) {
    return NextResponse.json(
      {
        success: false,
        error: auth.error,
      },
      {
        status: auth.statusCode ?? 401,
      }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("demo_visitors")
    .select(
      `
        id,
        full_name,
        phone,
        first_access_at,
        last_access_at,
        access_count
      `
    )
    .order("last_access_at", { ascending: false });

  if (error) {
    console.error("Failed to load demo visitors:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load Demo Activity.",
      },
      {
        status: 500,
      }
    );
  }

  const visitors = data ?? [];

  const now = new Date();

  const todayStart = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )
  );

  const activeToday = visitors.filter((visitor) => {
    return new Date(visitor.last_access_at) >= todayStart;
  }).length;

  const totalVisits = visitors.reduce((total, visitor) => {
    return total + Number(visitor.access_count ?? 0);
  }, 0);

  return NextResponse.json({
    success: true,
    visitors,
    summary: {
      totalVisitors: visitors.length,
      activeToday,
      totalVisits,
    },
  });
}