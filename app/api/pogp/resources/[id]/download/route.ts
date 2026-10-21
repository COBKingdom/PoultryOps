
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const BUCKET = "pogp-resources";
const SIGNED_URL_EXPIRY_SECONDS = 120;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authorization.slice(7).trim();

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired login session" },
        { status: 401 }
      );
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
      return NextResponse.json(
        { success: false, error: "Active POGP access required" },
        { status: 403 }
      );
    }

    const { data: partner, error: partnerError } = await supabaseAdmin
      .from("pogp_partners")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (partnerError || !partner) {
      return NextResponse.json(
        { success: false, error: "Active POGP partner record required" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid resource ID" },
        { status: 400 }
      );
    }

    const { data: resource, error: resourceError } = await supabaseAdmin
      .from("pogp_resources")
      .select("id, title, storage_path, status")
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();

    if (resourceError) {
      console.error("POGP resource lookup failed:", resourceError);

      return NextResponse.json(
        { success: false, error: "Unable to retrieve resource" },
        { status: 500 }
      );
    }

    if (!resource) {
      return NextResponse.json(
        { success: false, error: "Published resource not found" },
        { status: 404 }
      );
    }

    const storagePath = resource.storage_path;

    if (
      !storagePath ||
      storagePath.startsWith("/") ||
      storagePath.includes("..") ||
      storagePath.includes("\\")
    ) {
      return NextResponse.json(
        { success: false, error: "No downloadable file is available" },
        { status: 404 }
      );
    }

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SECONDS, {
        download: true,
      });

    if (error || !data?.signedUrl) {
      console.error("POGP signed URL creation failed:", error);

      return NextResponse.json(
        { success: false, error: "Unable to generate download link" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      download_url: data.signedUrl,
      expires_in_seconds: SIGNED_URL_EXPIRY_SECONDS,
    });
  } catch (error) {
    console.error("POGP download API error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to process download request" },
      { status: 500 }
    );
  }
}
