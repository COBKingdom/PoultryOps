
"use client";

import { useEffect, useState } from "react";
import { AlertCircle, LoaderCircle } from "lucide-react";
import PublicOrderingForm from "@/app/order/[farmId]/public-ordering-form";
import { supabase } from "@/lib/supabase";

type StorefrontLookup = {
  slug: string;
  catalog: {
    farm: {
      id: string;
      name: string;
      currency: string;
    };
    products: unknown[];
  };
};

export default function PublicShopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [slug, setSlug] = useState("");
  const [farmId, setFarmId] = useState("");
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadShop() {
      try {
        const resolved = await params;
        const requestedSlug = resolved.slug;

        if (!requestedSlug) {
          if (!cancelled) setUnavailable(true);
          return;
        }

        const { data, error } = await supabase.rpc(
          "get_public_storefront_catalog",
          { p_slug: requestedSlug }
        );

        if (error || !data) {
          console.error("Public shop lookup failed:", error);
          if (!cancelled) setUnavailable(true);
          return;
        }

        const result = data as StorefrontLookup;

        if (!result.catalog?.farm?.id) {
          if (!cancelled) setUnavailable(true);
          return;
        }

        if (!cancelled) {
          setSlug(result.slug);
          setFarmId(result.catalog.farm.id);
        }
      } catch (error) {
        console.error("Unable to resolve shop link:", error);
        if (!cancelled) setUnavailable(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadShop();

    return () => {
      cancelled = true;
    };
  }, [params]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <LoaderCircle className="animate-spin" size={20} />
          Opening shop...
        </div>
      </main>
    );
  }

  if (unavailable || !farmId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-3 text-amber-600" size={34} />
          <h1 className="text-xl font-bold text-slate-900">
            Shop unavailable
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This shop link is invalid, unpublished, or temporarily unavailable.
            Please contact the farm for its current ordering link.
          </p>
        </section>
      </main>
    );
  }

  return (
    <div data-shop-slug={slug}>
      <PublicOrderingForm farmId={farmId} />
    </div>
  );
}
