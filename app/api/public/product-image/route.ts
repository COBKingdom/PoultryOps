
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get("farmId");
    const productId = searchParams.get("productId");

    if (
      !farmId ||
      !productId ||
      !UUID_REGEX.test(farmId) ||
      !UUID_REGEX.test(productId)
    ) {
      return NextResponse.json(
        { error: "Invalid farm or product identifier." },
        { status: 400 }
      );
    }

    // Confirm that the farm exists and is active.
    const { data: farm, error: farmError } = await supabaseAdmin
      .from("farms")
      .select("id, active")
      .eq("id", farmId)
      .maybeSingle();

    if (farmError) {
      console.error("Product image farm lookup failed:", farmError.message);
      return NextResponse.json(
        { error: "Unable to verify farm." },
        { status: 500 }
      );
    }

    if (!farm || farm.active === false) {
      return NextResponse.json(
        { error: "Product image unavailable." },
        { status: 404 }
      );
    }

    // Only allow images for active products belonging to this farm.
    const { data: product, error: productError } = await supabaseAdmin
      .from("farm_products")
      .select("id, image_path")
      .eq("id", productId)
      .eq("farm_id", farmId)
      .eq("active", true)
      .maybeSingle();

    if (productError) {
      console.error(
        "Product image product lookup failed:",
        productError.message
      );
      return NextResponse.json(
        { error: "Unable to verify product." },
        { status: 500 }
      );
    }

    if (!product?.image_path) {
      return NextResponse.json(
        { error: "Product image unavailable." },
        { status: 404 }
      );
    }

    // Generate a time-limited URL on the server.
    const { data: signedData, error: signedError } =
      await supabaseAdmin.storage
        .from("product-images")
        .createSignedUrl(product.image_path, 60 * 60);

    if (signedError || !signedData?.signedUrl) {
      console.error(
        "Product image signing failed:",
        productId,
        signedError?.message
      );

      return NextResponse.json(
        { error: "Unable to load product image." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { signedUrl: signedData.signedUrl },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Product image endpoint failed:", error);

    return NextResponse.json(
      { error: "Unable to load product image." },
      { status: 500 }
    );
  }
}
