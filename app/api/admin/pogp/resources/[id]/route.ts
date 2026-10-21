
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

type RouteContext = {
  params: Promise<{ id: string }>;
};

function validateExternalUrl(value: unknown): string | null | undefined {
  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  try {
    const url = new URL(value.trim());

    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      url.username ||
      url.password
    ) {
      return undefined;
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

function validStoragePath(value: unknown): boolean {
  if (value === null || value === "") {
    return true;
  }

  if (typeof value !== "string") {
    return false;
  }

  const path = value.trim();

  return (
    path.length > 0 &&
    path.length <= 500 &&
    !path.startsWith("/") &&
    !path.includes("..") &&
    !path.includes("\\")
  );
}

async function authorizeAdmin(request: Request) {
  const auth = await requirePlatformAdmin(request);

  if (!auth.success || !auth.user) {
    return {
      response: NextResponse.json(
        { success: false, error: auth.error || "Unauthorized" },
        { status: auth.statusCode || 403 }
      ),
    };
  }

  return { user: auth.user };
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const authorization = await authorizeAdmin(request);

    if ("response" in authorization) {
      return authorization.response;
    }

    const { id } = await context.params;

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid resource ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if ("title" in body) {
      if (
        typeof body.title !== "string" ||
        !body.title.trim() ||
        body.title.trim().length > 200
      ) {
        return NextResponse.json(
          { success: false, error: "Title must be between 1 and 200 characters" },
          { status: 400 }
        );
      }

      updates.title = body.title.trim();
    }

    if ("description" in body) {
      if (typeof body.description !== "string" || body.description.length > 5000) {
        return NextResponse.json(
          { success: false, error: "Description must be at most 5000 characters" },
          { status: 400 }
        );
      }

      updates.description = body.description.trim();
    }

    if ("category" in body) {
      if (!ALLOWED_CATEGORIES.includes(body.category)) {
        return NextResponse.json(
          { success: false, error: "Invalid resource category" },
          { status: 400 }
        );
      }

      updates.category = body.category;
    }

    if ("resource_type" in body) {
      if (!ALLOWED_TYPES.includes(body.resource_type)) {
        return NextResponse.json(
          { success: false, error: "Invalid resource type" },
          { status: 400 }
        );
      }

      updates.resource_type = body.resource_type;
    }

    if ("external_url" in body) {
      const externalUrl = validateExternalUrl(body.external_url);

      if (externalUrl === undefined) {
        return NextResponse.json(
          { success: false, error: "External URL must use HTTP or HTTPS" },
          { status: 400 }
        );
      }

      updates.external_url = externalUrl;
    }

    if ("storage_path" in body) {
      if (!validStoragePath(body.storage_path)) {
        return NextResponse.json(
          { success: false, error: "Invalid Storage path" },
          { status: 400 }
        );
      }

      updates.storage_path =
        typeof body.storage_path === "string" && body.storage_path.trim()
          ? body.storage_path.trim()
          : null;
    }

    if ("status" in body) {
      if (!ALLOWED_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: "Invalid resource status" },
          { status: 400 }
        );
      }

      updates.status = body.status;

      if (body.status === "published") {
        updates.published_at = new Date().toISOString();
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields supplied to update" },
        { status: 400 }
      );
    }

    updates.updated_by = authorization.user.id;
    updates.updated_at = new Date().toISOString();

    const { data: current, error: currentError } = await supabaseAdmin
      .from("pogp_resources")
      .select("id, storage_path, external_url, status")
      .eq("id", id)
      .maybeSingle();

    if (currentError) {
      console.error("POGP resource lookup failed:", currentError);

      return NextResponse.json(
        { success: false, error: "Unable to load resource" },
        { status: 500 }
      );
    }

    if (!current) {
      return NextResponse.json(
        { success: false, error: "Resource not found" },
        { status: 404 }
      );
    }

    const nextStoragePath =
      "storage_path" in updates
        ? (updates.storage_path as string | null)
        : current.storage_path;

    const nextExternalUrl =
      "external_url" in updates
        ? (updates.external_url as string | null)
        : current.external_url;

    const nextStatus =
      "status" in updates
        ? (updates.status as string)
        : current.status;

    if (nextStatus === "published" && !nextStoragePath && !nextExternalUrl) {
      return NextResponse.json(
        { success: false, error: "A published resource must have a file or external URL" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("pogp_resources")
      .update(updates)
      .eq("id", id)
      .select(
        "id, title, description, category, resource_type, storage_path, external_url, status, published_at, created_at, updated_at"
      )
      .single();

    if (error) {
      console.error("POGP resource update failed:", error);

      return NextResponse.json(
        { success: false, error: "Unable to update resource" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, resource: data });
  } catch (error) {
    console.error("POGP resource PATCH error:", error);

    return NextResponse.json(
      { success: false, error: "Invalid request or internal server error" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const authorization = await authorizeAdmin(request);

    if ("response" in authorization) {
      return authorization.response;
    }

    const { id } = await context.params;

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid resource ID" },
        { status: 400 }
      );
    }

    const { data: resource, error: lookupError } = await supabaseAdmin
      .from("pogp_resources")
      .select("id, storage_path")
      .eq("id", id)
      .maybeSingle();

    if (lookupError) {
      console.error("POGP resource deletion lookup failed:", lookupError);

      return NextResponse.json(
        { success: false, error: "Unable to load resource" },
        { status: 500 }
      );
    }

    if (!resource) {
      return NextResponse.json(
        { success: false, error: "Resource not found" },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from("pogp_resources")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("POGP resource deletion failed:", deleteError);

      return NextResponse.json(
        { success: false, error: "Unable to delete resource" },
        { status: 500 }
      );
    }

    // Storage cleanup is handled separately so a file is never
    // deleted before the database operation succeeds.
    return NextResponse.json({
      success: true,
      message: "Resource deleted",
      fileCleanupRequired: Boolean(resource.storage_path),
    });
  } catch (error) {
    console.error("POGP resource DELETE error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
