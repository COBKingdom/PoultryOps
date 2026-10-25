
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get("farmId");

    if (!farmId || !UUID_REGEX.test(farmId)) {
      return NextResponse.json(
        { error: "Invalid farm identifier." },
        { status: 400 }
      );
    }

    const { data: farm, error: farmError } = await supabaseAdmin
      .from("farms")
      .select("id, active, logo_path")
      .eq("id", farmId)
      .maybeSingle();

    if (farmError) {
      console.error("Farm logo lookup failed:", farmError.message);
      return NextResponse.json(
        { error: "Unable to load farm logo." },
        { status: 500 }
      );
    }

    if (!farm || farm.active === false || !farm.logo_path) {
      return NextResponse.json(
        { error: "Farm logo unavailable." },
        { status: 404 }
      );
    }

    // Ensure the path belongs to this farm's logo folder.
    const expectedPrefix = `${farm.id}/logo/`;

    if (!farm.logo_path.startsWith(expectedPrefix)) {
      return NextResponse.json(
        { error: "Invalid farm logo path." },
        { status: 400 }
      );
    }

    const { data: signed, error: signedError } =
      await supabaseAdmin.storage
        .from("product-images")
        .createSignedUrl(farm.logo_path, 60 * 60);

    if (signedError || !signed?.signedUrl) {
      console.error("Farm logo signing failed:", signedError?.message);
      return NextResponse.json(
        { error: "Unable to generate farm logo URL." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { signedUrl: signed.signedUrl },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Farm logo endpoint failed:", error);
    return NextResponse.json(
      { error: "Unable to load farm logo." },
      { status: 500 }
    );
  }
}
