
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  LoaderCircle,
  MessageCircle,
  Store,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";
import AppShell from "@/components/layout/app-shell";
import { supabase } from "@/lib/supabase";

type Storefront = {
  id: string;
  farm_id: string;
  slug: string;
  is_enabled: boolean;
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

export default function OnlineStorePage() {
  const { user, profile } = useAuth();
  const { data: dashboardData, loading: dashboardLoading } =
    useDashboard();

  const farmId =
    profile?.farm_id ||
    (dashboardData as any)?.farm?.id ||
    (dashboardData as any)?.farmId ||
    "";

  const farmName =
    (dashboardData as any)?.farm?.name ||
    (dashboardData as any)?.farmName ||
    "";

  const [storefront, setStorefront] = useState<Storefront | null>(null);
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (typeof window !== "undefined" ? window.location.origin : "")
).replace(/\/+$/, "");

const shopUrl =
  storefront && siteUrl
    ? `${siteUrl}/shop/${storefront.slug}`
    : "";

  const loadStorefront = useCallback(async () => {
    if (!farmId) {
      setStorefront(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase
      .from("public_storefronts")
      .select("id, farm_id, slug, is_enabled")
      .eq("farm_id", farmId)
      .maybeSingle();

    if (queryError) {
      console.error("Unable to load storefront:", queryError);
      setError(
        "Unable to load your online store. Please refresh and try again."
      );
      setStorefront(null);
    } else {
      const record = (data || null) as Storefront | null;
      setStorefront(record);

      if (record) {
        setSlug(record.slug);
      } else if (farmName) {
        setSlug(slugify(farmName));
      }
    }

    setLoading(false);
  }, [farmId, farmName]);

  useEffect(() => {
    void loadStorefront();
  }, [loadStorefront]);

  async function createStorefront(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const cleanSlug = slugify(slug);

    if (!cleanSlug || cleanSlug.length < 3) {
      setError("Enter a shop address with at least 3 valid characters.");
      return;
    }

    setSaving(true);

    try {
      const { data, error: createError } = await supabase.rpc(
        "create_my_public_storefront",
        { p_slug: cleanSlug }
      );

      if (createError) {
        throw new Error(createError.message);
      }

      if (!data?.id || !data?.slug) {
        throw new Error("The storefront was not returned. Please refresh.");
      }

      setStorefront(data as Storefront);
      setSlug(data.slug);
      setSuccess(
        "Your shop address has been reserved. Review it before publishing."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your shop address."
      );
    } finally {
      setSaving(false);
    }
  }

  async function setEnabled(enabled: boolean) {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const { data, error: updateError } = await supabase.rpc(
        "set_my_storefront_enabled",
        { p_enabled: enabled }
      );

      if (updateError) {
        throw new Error(updateError.message);
      }

      setStorefront((current) =>
        current
          ? { ...current, is_enabled: Boolean(data?.is_enabled) }
          : current
      );

      setSuccess(
        enabled
          ? "Your shop is published and available to customers."
          : "Your shop has been unpublished."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update your shop status."
      );
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    if (!shopUrl) return;

    try {
      await navigator.clipboard.writeText(shopUrl);
      setSuccess("Shop link copied. You can now share it with customers.");
      setError("");
    } catch {
      setError(
        "Your browser could not copy the link. Select and copy the address manually."
      );
    }
  }

  if (dashboardLoading || loading) {
    return (
      <AppShell email={user?.email}>
        <div className="flex items-center gap-3 p-6 text-sm text-slate-500">
          <LoaderCircle className="animate-spin" size={20} />
          Loading Online Store...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell email={user?.email}>
      <main className="space-y-6 p-4 sm:p-6">
        <header>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
            <Store size={18} />
            POULTRYOPS CUSTOMER ORDERING
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Online Store
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Create a short shop link for your customers. Share it on WhatsApp
            or anywhere your customers communicate with you.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {!farmId ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            We could not identify the farm linked to your account. Please
            sign in with your farm account and try again.
          </section>
        ) : !storefront ? (
          <section className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-bold text-slate-900">
              Create your shop address
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Use a short name customers can remember. It must be unique
              across PoultryOps.
            </p>

            <form onSubmit={createStorefront} className="mt-6 space-y-4">
              <label className="block space-y-2 text-sm font-medium text-slate-700">
                Shop address
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="text-sm text-slate-500">
                    /shop/
                  </span>
                  <input
                    required
                    minLength={3}
                    maxLength={60}
                    value={slug}
                    onChange={(event) => setSlug(event.target.value)}
                    placeholder="your-farm-name"
                    className={inputClass}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <span className="block text-xs font-normal text-slate-500">
                  Lowercase letters, numbers and single hyphens only.
                </span>
              </label>

              <button
                type="submit"
                disabled={saving}
                className={buttonClass}
              >
                {saving ? (
                  <LoaderCircle className="animate-spin" size={17} />
                ) : (
                  <Store size={17} />
                )}
                Reserve shop address
              </button>
            </form>
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Your customer shop
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {farmName || "Your farm"} · /shop/{storefront.slug}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    storefront.is_enabled
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {storefront.is_enabled ? "Published" : "Unpublished"}
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Your shop link
                </p>
                <p className="break-all text-sm font-semibold text-slate-900">
                  {shopUrl}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void copyLink()}
                    className={buttonClass}
                  >
                    <Copy size={16} />
                    Copy link
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Order from ${farmName || "our farm"} using our PoultryOps shop: ${shopUrl}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                  >
                    <MessageCircle size={16} />
                    Share on WhatsApp
                  </a>

                  {storefront.is_enabled && (
                    <a
                      href={shopUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <ExternalLink size={16} />
                      Preview shop
                    </a>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <h3 className="font-semibold text-blue-950">
                  Before you publish
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-blue-900">
                  <li>Check that your active product prices are correct.</li>
                  <li>Customers can submit orders without a PoultryOps login.</li>
                  <li>Orders still require your review before fulfilment.</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                {!storefront.is_enabled ? (
                  <button
                    type="button"
                    onClick={() => void setEnabled(true)}
                    disabled={saving}
                    className={buttonClass}
                  >
                    {saving ? (
                      <LoaderCircle className="animate-spin" size={17} />
                    ) : (
                      <CheckCircle2 size={17} />
                    )}
                    Publish shop
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void setEnabled(false)}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    {saving && (
                      <LoaderCircle className="animate-spin" size={17} />
                    )}
                    Unpublish shop
                  </button>
                )}
              </div>
            </section>

            <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-900">How it works</h2>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-slate-600">
                <li>Copy or share your shop link.</li>
                <li>Customers select products and submit orders.</li>
                <li>Review incoming orders in the Orders section.</li>
                <li>Confirm availability and arrange payment.</li>
              </ol>
            </aside>
          </div>
        )}
      </main>
    </AppShell>
  );
}
