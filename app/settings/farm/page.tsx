
"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";

import AppShell from "@/components/layout/app-shell";
import OwnerOnly from "@/components/auth/owner-only";

import { supabase } from "@/lib/supabase";

const MAX_LOGO_SIZE = 2 * 1024 * 1024;

const ALLOWED_LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

const LOGO_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export default function FarmSettingsPage() {
  const { user } = useAuth();
  const { data, loading } = useDashboard();

  const farm = data?.farm;

  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  const [farmName, setFarmName] = useState("");
  const [currency, setCurrency] = useState("");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [loadingLogo, setLoadingLogo] = useState(false);

  useEffect(() => {
    if (!farm) return;

    setFarmName(farm.name ?? "");
    setCurrency(farm.currency ?? "NGN");
  }, [farm?.id, farm?.name, farm?.currency]);

  useEffect(() => {
    let cancelled = false;

    async function loadExistingLogo() {
      if (!farm?.logo_path) {
        setLogoPreview("");
        return;
      }

      setLoadingLogo(true);

      const { data: signed, error } = await supabase.storage
        .from("product-images")
        .createSignedUrl(farm.logo_path, 60 * 60);

      if (cancelled) return;

      if (error || !signed?.signedUrl) {
        console.warn("Could not load farm logo:", error?.message);
        setLogoPreview("");
      } else {
        setLogoPreview(signed.signedUrl);
      }

      setLoadingLogo(false);
    }

    void loadExistingLogo();

    return () => {
      cancelled = true;
    };
  }, [farm?.id, farm?.logo_path]);

  useEffect(() => {
    if (!logoFile) return;

    const previewUrl = URL.createObjectURL(logoFile);
    setLogoPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [logoFile]);

  function selectLogo(file?: File) {
    setMessage("");
    setMessageIsError(false);

    if (!file) return;

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setMessage("Choose a PNG, JPG or WebP image.");
      setMessageIsError(true);
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      setMessage("The logo must be 2 MB or smaller.");
      setMessageIsError(true);
      return;
    }

    setLogoFile(file);
  }

  async function saveFarm() {
    if (!farm?.id) {
      setMessage("Your farm details are not available. Refresh and try again.");
      setMessageIsError(true);
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setMessageIsError(false);

      const { error } = await supabase
        .from("farms")
        .update({
          name: farmName.trim() || farm.name,
          currency: currency || farm.currency,
        })
        .eq("id", farm.id);

      if (error) throw error;

      setMessage("Farm settings updated successfully.");
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save farm settings."
      );
      setMessageIsError(true);
    } finally {
      setSaving(false);
    }
  }

  async function uploadLogo() {
    if (!farm?.id || !user?.id) {
      setMessage("Your farm or user details are not available. Refresh and try again.");
      setMessageIsError(true);
      return;
    }

    if (!logoFile) {
      setMessage("Please choose a logo image first.");
      setMessageIsError(true);
      return;
    }

    try {
      setUploadingLogo(true);
      setMessage("");
      setMessageIsError(false);

      const extension = LOGO_EXTENSIONS[logoFile.type];

      // The first folder must be the farm ID to match the existing
      // farm-member storage policies.
      const imagePath =
        `${farm.id}/logo/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(imagePath, logoFile, {
          contentType: logoFile.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("farms")
        .update({ logo_path: imagePath })
        .eq("id", farm.id);

      if (updateError) {
        // Best-effort cleanup if saving the path fails.
        await supabase.storage
          .from("product-images")
          .remove([imagePath]);

        throw updateError;
      }

      const { data: signed, error: signedError } = await supabase.storage
        .from("product-images")
        .createSignedUrl(imagePath, 60 * 60);

      if (signedError || !signed?.signedUrl) {
        setLogoFile(null);
        setMessage(
          "Logo uploaded and saved. Refresh the page if the preview does not appear."
        );
        return;
      }

      setLogoFile(null);
      setLogoPreview(signed.signedUrl);
      setMessage("Farm logo uploaded successfully.");
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to upload the farm logo."
      );
      setMessageIsError(true);
    } finally {
      setUploadingLogo(false);
    }
  }

  if (loading) {
    return (
      <AppShell email={user?.email}>
        <div className="space-y-6">
          <div>
            <div className="mb-2 h-10 w-56 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-5 w-80 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="h-64 animate-pulse rounded-xl border border-blue-100 bg-white p-6" />
        </div>
      </AppShell>
    );
  }

  if (!farm?.id) {
    return (
      <OwnerOnly>
        <AppShell email={user?.email}>
          <div className="rounded-xl border border-amber-200 bg-white p-6 text-slate-700">
            Farm details could not be loaded. Please refresh the page and try again.
          </div>
        </AppShell>
      </OwnerOnly>
    );
  }

  const cardClass =
    "relative overflow-hidden rounded-xl border border-blue-100 bg-white p-6 shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]";

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-200 transition-all";

  const buttonClass =
    "inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <OwnerOnly>
      <AppShell email={user?.email}>
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Farm Settings
            </h1>
            <p className="mt-1 text-slate-500">
              Manage your farm information, branding and currency settings.
            </p>
          </div>

          <div className={cardClass}>
            <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

            <div className="space-y-6 pt-1">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Farm Information
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update the basic information used throughout PoultryOps.
                </p>
              </div>

              <div>
                <label htmlFor="farm-name" className="mb-2 block text-sm font-medium text-slate-600">
                  Farm Name
                </label>
                <input
                  id="farm-name"
                  value={farmName}
                  onChange={(event) => setFarmName(event.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="farm-currency" className="mb-2 block text-sm font-medium text-slate-600">
                  Currency
                </label>
                <select
                  id="farm-currency"
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  className={inputClass}
                >
                  <option value="NGN">NGN</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={saveFarm}
                  disabled={saving || uploadingLogo}
                  className={buttonClass}
                >
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <div className="absolute inset-x-0 top-0 h-[3px] bg-emerald-500/85" />

            <div className="space-y-5 pt-1">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Farm Logo
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add your farm's logo to personalise your public online store.
                </p>
              </div>

              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoPreview}
                      alt={`${farm.name} logo preview`}
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <div className="px-2 text-center text-sm text-slate-400">
                      {loadingLogo ? "Loading logo..." : "No logo uploaded"}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="farm-logo"
                    className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {logoFile ? "Choose another image" : "Choose logo"}
                  </label>

                  <input
                    id="farm-logo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(event) => {
                      selectLogo(event.target.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />

                  <p className="text-sm text-slate-500">
                    PNG, JPG or WebP. Maximum file size: 2 MB.
                  </p>

                  {logoFile && (
                    <button
                      type="button"
                      onClick={uploadLogo}
                      disabled={uploadingLogo || saving}
                      className={buttonClass}
                    >
                      {uploadingLogo ? "Uploading logo..." : "Upload and Save Logo"}
                    </button>
                  )}
                </div>
              </div>

              {message && (
                <p
                  role="status"
                  className={`text-sm font-medium ${
                    messageIsError ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </OwnerOnly>
  );
}
