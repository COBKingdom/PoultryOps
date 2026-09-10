"use client";

import { FormEvent, useEffect, useState } from "react";
import { X, UserPlus, CheckCircle2, Copy, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Pogp = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  pogpCode: string;
  status: string;
  territory: string | null;
};

type AddVendModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function AddVendModal({
  open,
  onClose,
  onCreated,
}: AddVendModalProps) {
  const [pogps, setPogps] = useState<Pogp[]>([]);
  const [loadingPogps, setLoadingPogps] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [territory, setTerritory] = useState("");
  const [recruitedByPogpId, setRecruitedByPogpId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdVend, setCreatedVend] = useState<{
    vendCode: string;
    temporaryPassword: string;
    fullName: string;
    email: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;

    const loadPogps = async () => {
      setLoadingPogps(true);
      setError("");

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Your admin session has expired.");
        }

        const response = await fetch("/api/admin/pogp", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || "Unable to load POGP partners."
          );
        }

        const activePogps = (data.partners || [])
          .filter((partner: Pogp) => partner.status === "active")
          .sort((a: Pogp, b: Pogp) =>
            a.fullName.localeCompare(b.fullName)
          );

        setPogps(activePogps);
      } catch (err) {
        console.error("Load POGPs error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load POGP partners."
        );
      } finally {
        setLoadingPogps(false);
      }
    };

    loadPogps();
  }, [open]);

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setTerritory("");
    setRecruitedByPogpId("");
    setError("");
    setCreatedVend(null);
    setCopied(false);
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setSubmitting(true);
    setError("");
    setCreatedVend(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Your admin session has expired.");
      }

      const response = await fetch("/api/admin/vend/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          territory,
          recruitedByPogpId: recruitedByPogpId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to create VEND partner."
        );
      }

      setCreatedVend({
        vendCode: data.vend?.vend_code || "",
        temporaryPassword: data.temporaryPassword || "",
        fullName: data.vend?.full_name || fullName,
        email: data.vend?.email || email,
      });

      onCreated();
    } catch (err) {
      console.error("Create VEND error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create VEND partner."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const copyPassword = async () => {
    if (!createdVend?.temporaryPassword) return;

    try {
      await navigator.clipboard.writeText(
        createdVend.temporaryPassword
      );
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError("Unable to copy the temporary password.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <UserPlus className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Add VEND Partner
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Create a VEND account and partner profile.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {createdVend ? (
          <div className="p-6">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />

                <div>
                  <h3 className="font-bold text-emerald-900">
                    VEND created successfully
                  </h3>
                  <p className="mt-1 text-sm text-emerald-800">
                    {createdVend.fullName} has been registered as{" "}
                    <strong>{createdVend.vendCode}</strong>.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-emerald-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Temporary password
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 rounded-md bg-slate-100 px-3 py-2 font-mono text-sm font-semibold text-slate-900">
                    {createdVend.temporaryPassword}
                  </code>

                  <button
                    type="button"
                    onClick={copyPassword}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  The invitation email has been sent to{" "}
                  <strong>{createdVend.email}</strong>. The partner
                  will be required to change this password on first
                  login.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-5 p-6">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Full name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  required
                  placeholder="e.g. John Ibrahim"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    required
                    placeholder="vendor@example.com"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    required
                    placeholder="080..."
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Territory
                  <span className="ml-1 font-normal text-slate-400">
                    (optional)
                  </span>
                </label>
                <input
                  type="text"
                  value={territory}
                  onChange={(event) =>
                    setTerritory(event.target.value)
                  }
                  placeholder="e.g. Kaduna North"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Recruited by POGP
                  <span className="ml-1 font-normal text-slate-400">
                    (optional)
                  </span>
                </label>

                <select
                  value={recruitedByPogpId}
                  onChange={(event) =>
                    setRecruitedByPogpId(event.target.value)
                  }
                  disabled={loadingPogps}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                >
                  <option value="">
                    {loadingPogps
                      ? "Loading POGP partners..."
                      : "No recruiting POGP"}
                  </option>

                  {pogps.map((pogp) => (
                    <option key={pogp.id} value={pogp.id}>
                      {pogp.fullName} � {pogp.pogpCode}
                    </option>
                  ))}
                </select>

                <p className="mt-1.5 text-xs text-slate-500">
                  Select the POGP who recruited this VEND. This
                  preserves the POGP ? VEND ? Farm relationship.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting || loadingPogps}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Create VEND
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
