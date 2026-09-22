"use client";

import {
  useEffect,
  useState,
} from "react";

import QRCode from "qrcode";

import {
  Check,
  Copy,
  Download,
  Link2,
  QrCode,
  Share2,
} from "lucide-react";

type Props = {
  pogpCode: string;
};

export default function ReferralTools({
  pogpCode,
}: Props) {
  const [qrDataUrl, setQrDataUrl] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?ref=${encodeURIComponent(
          pogpCode
        )}`
      : `/register?ref=${encodeURIComponent(
          pogpCode
        )}`;

  useEffect(() => {
    let cancelled = false;

    async function generateQr() {
      try {
        const dataUrl =
          await QRCode.toDataURL(
            referralLink,
            {
              width: 320,
              margin: 2,
              errorCorrectionLevel: "M",
            }
          );

        if (!cancelled) {
          setQrDataUrl(dataUrl);
        }
      } catch (error) {
        console.error(
          "Unable to generate POGP QR code:",
          error
        );
      }
    }

    generateQr();

    return () => {
      cancelled = true;
    };
  }, [referralLink]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(
        referralLink
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        "Unable to copy referral link:",
        error
      );
    }
  }

  async function handleShare() {
    try {
      if (
        navigator.share
      ) {
        await navigator.share({
          title:
            "Join PoultryOps",
          text:
            "Register with PoultryOps using my referral link.",
          url: referralLink,
        });

        return;
      }

      await handleCopy();
    } catch (error: any) {
      if (
        error?.name !==
        "AbortError"
      ) {
        console.error(
          "Unable to share referral link:",
          error
        );
      }
    }
  }

  function handleDownload() {
    if (!qrDataUrl) {
      return;
    }

    const link =
      document.createElement("a");

    link.href = qrDataUrl;
    link.download = `${pogpCode}-referral-qr.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(8,31,70,0.05)]">
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <Link2 className="h-5 w-5 text-[#0b57d0]" />
          </div>

          <div>
            <h2 className="text-base font-bold text-[#081f46]">
              Your Referral Tools
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Share your PoultryOps referral link or QR code with poultry farmers.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_260px] lg:items-center">
        {/* Referral information */}
        <div>
          <div className="rounded-2xl bg-[#082b62] p-5 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f5c75d]">
              Your POGP Code
            </p>

            <p className="mt-2 text-3xl font-extrabold tracking-tight">
              {pogpCode}
            </p>

            <p className="mt-2 max-w-lg text-xs leading-5 text-white/65">
              Use this code and your referral link when introducing PoultryOps to poultry businesses.
            </p>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              Your Farmer Referral Link
            </p>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="break-all text-xs font-medium leading-5 text-slate-600">
                {referralLink}
              </p>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#1769f5] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b57d0]"
              >
                <Share2 className="h-4 w-4" />
                Share Link
              </button>
            </div>
          </div>
        </div>

        {/* QR code */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <QrCode className="h-4 w-4 text-[#0b57d0]" />

              <p className="text-sm font-bold text-[#081f46]">
                Your QR Code
              </p>
            </div>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Farmers can scan this code to register with your referral.
            </p>
          </div>

          <div className="mx-auto mt-4 flex h-[210px] w-[210px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code for ${pogpCode} referral link`}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="text-center text-xs text-slate-400">
                Generating QR code...
              </div>
            )}
          </div>

          <p className="mt-3 text-center text-sm font-bold text-[#081f46]">
            {pogpCode}
          </p>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-[#0b57d0] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Download QR
          </button>
        </div>
      </div>

      <div className="mx-6 mb-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4">
        <p className="text-sm font-bold text-[#081f46]">
          Start sharing
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Send your referral link directly to poultry farmers, or let them scan your QR code. Their registration will carry your POGP referral code automatically.
        </p>
      </div>
    </section>
  );
}