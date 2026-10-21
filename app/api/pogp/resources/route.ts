
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ALLOWED_CATEGORIES = [
  "starter_pack",
  "sales_toolkit",
  "product_training",
  "marketing_materials",
  "live_sales_documents",
  "news_updates",
] as const;

async function authenticatePogp(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return { error: "Unauthorized", status: 401 } as const;
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return { error: "Unauthorized", status: 401 } as const;
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return { error: "Invalid or expired session", status: 401 } as const;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.role !== "pogp" ||
    profile.status !== "active"
  ) {
    return { error: "Active POGP partner access required", status: 403 } as const;
  }

  const { data: partner, error: partnerError } = await supabaseAdmin
    .from("pogp_partners")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (partnerError || !partner) {
    return { error: "Active POGP partner access required", status: 403 } as const;
  }

  return { user, partner } as const;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticatePogp(request);

    if ("error" in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category")?.trim();
    const search = searchParams.get("search")?.trim().slice(0, 100);

    if (
      category &&
      category !== "all" &&
      !ALLOWED_CATEGORIES.includes(
        category as (typeof ALLOWED_CATEGORIES)[number]
      )
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid resource category" },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from("pogp_resources")
      .select(
        "id, title, description, category, resource_type, external_url, storage_path, published_at, created_at, updated_at"
      )
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    // Restrict search characters to avoid malformed PostgREST filters.
    if (search) {
      const safeSearch = search.replace(/[,%()_*\\]/g, " ").trim();

      if (safeSearch) {
        query = query.or(
          `title.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`
        );
      }
    }

    const { data: resources, error } = await query;

    if (error) {
      console.error("POGP resources query failed:", error);

      return NextResponse.json(
        { success: false, error: "Unable to load resources" },
        { status: 500 }
      );
    }

    // Never expose internal Storage paths to the partner-facing API.
    const safeResources = (resources ?? []).map(
      ({ storage_path, ...resource }) => ({
        ...resource,
        has_file: Boolean(storage_path),
      })
    );

    return NextResponse.json({
      success: true,
      resources: safeResources,
      count: safeResources.length,
    });
  } catch (error) {
    console.error("POGP resources API error:", error);

    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
