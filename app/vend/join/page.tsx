"use client";

import { FormEvent, useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  CheckCircle2,
  Copy,
  Link2,
  Loader2,
  MapPin,
  Phone,
  Share2,
  Users,
  Wallet,
  ArrowRight,
  Download,
} from "lucide-react";

const PRODUCTION_APP_URL = "https://poultry.trueops.app";

type RegistrationResult = {
  success: boolean;
  error?: string;
  vend?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    territory: string;
    vendCode: string;
    status: string;
    recruitedByPogpId: string | null;
    joinedAt: string;
  };
  referralUrl?: string;
};

export default function VendJoinPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [territory, setTerritory] = useState("");
  const [pogpCode, setPogpCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch("/api/vend/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          territory,
          pogpCode,
        }),
      });

      const data: RegistrationResult = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to complete registration.");
        return;
      }

      setResult(data);

      setFullName("");
      setPhone("");
      setEmail("");
      setTerritory("");
      setPogpCode("");
    } catch (err) {
      console.error("VEND registration error:", err);

      setError(
        "We could not complete your registration. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function getProductionReferralUrl(vendCode: string) {
    return `${PRODUCTION_APP_URL}/register?ref=${encodeURIComponent(
      vendCode
    )}`;
  }

  async function copyReferralLink() {
    const vendCode = result?.vend?.vendCode;

    if (!vendCode) return;

    const fullUrl = getProductionReferralUrl(vendCode);

    try {
      await navigator.clipboard.writeText(fullUrl);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError("Unable to copy the referral link. Please copy it manually.");
    }
  }

  function shareReferralLink() {
    const vendCode = result?.vend?.vendCode;

    if (!vendCode) return;

    const fullUrl = getProductionReferralUrl(vendCode);

    const text = `Register your poultry farm on PoultryOps and manage your farm more efficiently.\n\nRegister here: ${fullUrl}`;

    if (navigator.share) {
      navigator
        .share({
          title: "PoultryOps",
          text,
          url: fullUrl,
        })
        .catch(() => {});

      return;
    }

    copyReferralLink();
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
          <a
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              P
            </span>
            PoultryOps
          </a>

          <a
            href="/login"
            className="text-sm font-semibold text-slate-600 transition hover:text-blue-600"
          >
            Login
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-slate-50">
        <div className="mx-auto max-w-6xl px-5 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
              <Wallet className="h-4 w-4" />
              Earn ₦5,000 per successful referral
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              Become a PoultryOps VEND Partner
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Help poultry farmers discover PoultryOps and earn{" "}
              <span className="font-bold text-slate-900">
                ₦5,000 for every farm that successfully subscribes
              </span>{" "}
              through your referral.
            </p>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_460px] lg:items-start">
          {/* Benefits */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-bold text-slate-950">
                How it works
              </h2>

              <div className="mt-7 space-y-6">
                <Step
                  number="1"
                  icon={<Users className="h-5 w-5" />}
                  title="Join the VEND network"
                  description="Register your details and receive your unique VEND code."
                />

                <Step
                  number="2"
                  icon={<Link2 className="h-5 w-5" />}
                  title="Share your referral link"
                  description="Introduce PoultryOps to poultry farmers in your network and share your personal registration link."
                />

                <Step
                  number="3"
                  icon={<Wallet className="h-5 w-5" />}
                  title="Earn ₦5,000"
                  description="When a referred farm successfully subscribes, your ₦5,000 referral commission is recorded."
                />
              </div>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <CheckCircle2 className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="font-bold text-slate-950">
                    No farm to manage
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    VEND partners focus on referrals and earning. You do not
                    need to operate a farm or manage customers inside the
                    PoultryOps farm system.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <MiniBenefit
                icon={<Wallet className="h-5 w-5" />}
                title="₦5,000"
                text="per successful farm"
              />

              <MiniBenefit
                icon={<Link2 className="h-5 w-5" />}
                title="Your Code"
                text="unique referral link"
              />

              <MiniBenefit
                icon={<Share2 className="h-5 w-5" />}
                title="Simple"
                text="share and earn"
              />
            </div>
          </div>

          {/* Registration card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
            {!result?.success ? (
              <>
                <div className="mb-7">
                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                    VEND Registration
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    Join the network
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Complete the form below. Your VEND code will be generated
                    immediately after registration.
                  </p>
                </div>

                {error && (
                  <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <Field
                    label="Full name"
                    value={fullName}
                    onChange={setFullName}
                    placeholder="Enter your full name"
                    required
                  />

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Phone / WhatsApp
                      <span className="ml-1 text-blue-600">*</span>
                    </label>

                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        type="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="08012345678"
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <Field
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="you@example.com"
                    required
                  />

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Territory / Zone
                      <span className="ml-1 text-blue-600">*</span>
                    </label>

                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        type="text"
                        value={territory}
                        onChange={(event) =>
                          setTerritory(event.target.value)
                        }
                        placeholder="e.g. Abuja, Kaduna, Lagos"
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <Field
                    label="POGP referral code"
                    value={pogpCode}
                    onChange={setPogpCode}
                    placeholder="e.g. POGP-001"
                    hint="Leave blank if you were not recruited by a POGP."
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Creating your VEND account...
                      </>
                    ) : (
                      <>
                        Join PoultryOps VEND
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs leading-5 text-slate-400">
                    By registering, you agree to participate in the PoultryOps
                    referral network under its applicable partner terms.
                  </p>
                </form>
              </>
            ) : (
              <SuccessCard
                result={result}
                copied={copied}
                onCopy={copyReferralLink}
                onShare={shareReferralLink}
                productionUrl={getProductionReferralUrl(
                  result.vend?.vendCode || ""
                )}
              />
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-7 text-center text-sm text-slate-400 sm:px-6">
          © {new Date().getFullYear()} PoultryOps. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-blue-600">*</span>}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />

      {hint && (
        <p className="mt-1.5 text-xs leading-5 text-slate-400">{hint}</p>
      )}
    </div>
  );
}

function Step({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="relative">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          {icon}
        </div>

        {number !== "3" && (
          <div className="absolute left-1/2 top-12 h-8 w-px -translate-x-1/2 bg-slate-200" />
        )}
      </div>

      <div className="pt-0.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-blue-600">
            STEP {number}
          </span>
          <h3 className="font-bold text-slate-950">{title}</h3>
        </div>

        <p className="mt-1.5 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function MiniBenefit({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>

      <p className="mt-3 font-bold text-slate-950">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
    </div>
  );
}

function SuccessCard({
  result,
  copied,
  onCopy,
  onShare,
  productionUrl,
}: {
  result: RegistrationResult;
  copied: boolean;
  onCopy: () => void;
  onShare: () => void;
  productionUrl: string;
}) {
  const vendCode = result.vend?.vendCode || "";

  const [qrCode, setQrCode] = useState("");
  const [qrLoading, setQrLoading] = useState(true);
  const [qrError, setQrError] = useState("");

  useEffect(() => {
    let active = true;

    async function generateQr() {
      if (!productionUrl) {
        if (active) {
          setQrLoading(false);
          setQrError("Referral URL unavailable.");
        }

        return;
      }

      try {
        setQrLoading(true);
        setQrError("");

        const dataUrl = await QRCode.toDataURL(productionUrl, {
          width: 500,
          margin: 4,
          errorCorrectionLevel: "H",
        });

        if (!active) return;

        setQrCode(dataUrl);
      } catch (error) {
        console.error("QR generation error:", error);

        if (!active) return;

        setQrError("Unable to generate QR code.");
      } finally {
        if (active) {
          setQrLoading(false);
        }
      }
    }

    generateQr();

    return () => {
      active = false;
    };
  }, [productionUrl]);

  function downloadQrCode() {
    if (!qrCode || !vendCode) return;

    const link = document.createElement("a");

    link.href = qrCode;
    link.download = `${vendCode}-poultryops-referral-qr.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
        <CheckCircle2 className="h-9 w-9" />
      </div>

      <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-green-600">
        Registration successful
      </p>

      <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
        Welcome to PoultryOps VEND!
      </h2>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        Your unique VEND code has been created. Use your referral link or QR
        code when introducing PoultryOps to poultry farmers.
      </p>

      <div className="mt-7 grid gap-5 md:grid-cols-[1fr_230px] md:items-center">
        {/* VEND code */}
        <div className="rounded-2xl bg-slate-950 p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Your VEND Code
          </p>

          <p className="mt-2 text-3xl font-extrabold tracking-wide">
            {vendCode}
          </p>

          <p className="mt-3 text-xs text-slate-400">
            Use this code when promoting PoultryOps.
          </p>
        </div>

        {/* QR Code */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-bold text-slate-950">
            Your QR Code
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Farmers can scan this code to register with your referral.
          </p>

          <div className="mx-auto mt-3 flex aspect-square w-full max-w-[190px] items-center justify-center rounded-xl bg-white p-3 shadow-sm">
            {qrLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            ) : qrCode ? (
              <img
                src={qrCode}
                alt={`QR code for ${vendCode} PoultryOps referral`}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="px-3 text-center text-xs font-medium text-red-500">
                {qrError || "QR code unavailable."}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={downloadQrCode}
            disabled={!qrCode}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Download QR
          </button>
        </div>
      </div>

      <div className="mt-5 text-left">
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Your farmer referral link
        </label>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="break-all text-xs leading-5 text-slate-600">
            {productionUrl}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onCopy}
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <Copy className="h-4 w-4" />
          {copied ? "Copied!" : "Copy Link"}
        </button>

        <button
          type="button"
          onClick={onShare}
          className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          <Share2 className="h-4 w-4" />
          Share Link
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-left">
        <p className="text-sm font-bold text-slate-900">
          Your next step
        </p>

        <p className="mt-1 text-sm leading-6 text-slate-600">
          Start sharing your link or QR code with poultry farmers. When a
          referred farm subscribes successfully, your ₦5,000 commission will
          be recorded.
        </p>
      </div>
    </div>
  );
}