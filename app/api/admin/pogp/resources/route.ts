
import { NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ALLOWED_CATEGORIES = [
  "starter_pack",
  "sales_toolkit",
  "product_training",
  "marketing_materials",
  "live_sales_documents",
  "news_updates",
] as const;

const ALLOWED_TYPES = [
  "document",
  "pdf",
  "video",
  "link",
  "image",
  "other",
] as const;

const ALLOWED_STATUSES = ["draft", "published", "archived"] as const;

function validateExternalUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    const url = new URL(value.trim());

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    if (url.username || url.password) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
   const auth = await requirePlatformAdmin(request);

if (!auth.success || !auth.user) {
  return NextResponse.json(
    { success: false, error: auth.error || "Unauthorized" },
    { status: auth.statusCode || 403 }
  );
}
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    let query = supabaseAdmin
      .from("pogp_resources")
      .select(
        "id, title, description, category, resource_type, storage_path, external_url, status, published_at, created_at, updated_at, created_by, updated_by"
      )
      .order("updated_at", { ascending: false });

    if (status && status !== "all") {
      if (!ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
        return NextResponse.json(
          { success: false, error: "Invalid resource status" },
          { status: 400 }
        );
      }

      query = query.eq("status", status);
    }

    if (category && category !== "all") {
      if (!ALLOWED_CATEGORIES.includes(category as (typeof ALLOWED_CATEGORIES)[number])) {
        return NextResponse.json(
          { success: false, error: "Invalid resource category" },
          { status: 400 }
        );
      }

      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      console.error("POGP admin resources lookup failed:", error);

      return NextResponse.json(
        { success: false, error: "Unable to load resources" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      resources: data ?? [],
      count: data?.length ?? 0,
    });
  } catch (error) {
    console.error("POGP admin resources GET error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requirePlatformAdmin(request);

if (!auth.success || !auth.user) {
  return NextResponse.json(
    { success: false, error: auth.error || "Unauthorized" },
    { status: auth.statusCode || 403 }
  );
}
    const body = await request.json();

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const category = body.category;
    const resourceType = body.resource_type;
    const status = body.status ?? "draft";
    const storagePath =
      typeof body.storage_path === "string" && body.storage_path.trim()
        ? body.storage_path.trim()
        : null;
    const rawExternalUrl = body.external_url;
    const externalUrl = validateExternalUrl(rawExternalUrl);

    if (!title || title.length > 200) {
      return NextResponse.json(
        { success: false, error: "Title is required and must be at most 200 characters" },
        { status: 400 }
      );
    }

    if (description.length > 5000) {
      return NextResponse.json(
        { success: false, error: "Description must be at most 5000 characters" },
        { status: 400 }
      );
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { success: false, error: "Invalid resource category" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(resourceType)) {
      return NextResponse.json(
        { success: false, error: "Invalid resource type" },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid resource status" },
        { status: 400 }
      );
    }

    if (rawExternalUrl && !externalUrl) {
      return NextResponse.json(
        { success: false, error: "External URL must be a valid HTTP or HTTPS URL" },
        { status: 400 }
      );
    }

    if (storagePath && (storagePath.startsWith("/") || storagePath.includes(".."))) {
      return NextResponse.json(
        { success: false, error: "Invalid Storage path" },
        { status: 400 }
      );
    }

    if (status === "published" && !storagePath && !externalUrl) {
      return NextResponse.json(
        { success: false, error: "A published resource must have a file or external URL" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("pogp_resources")
      .insert({
        title,
        description,
        category,
        resource_type: resourceType,
        storage_path: storagePath,
        external_url: externalUrl,
        status,
        published_at: status === "published" ? now : null,
        created_by: auth.user.id,
        updated_by: auth.user.id,
      })
      .select(
        "id, title, description, category, resource_type, storage_path, external_url, status, published_at, created_at, updated_at"
      )
      .single();

    if (error) {
      console.error("POGP resource creation failed:", error);

      return NextResponse.json(
        { success: false, error: "Unable to create resource" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, resource: data },
      { status: 201 }
    );
  } catch (error) {
    console.error("POGP admin resources POST error:", error);

    return NextResponse.json(
      { success: false, error: "Invalid request or internal server error" },
      { status: 400 }
    );
  }
}
