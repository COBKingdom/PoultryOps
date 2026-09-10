"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { supabase } from "@/lib/supabase";

export function RegisterForm() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [pogpCode, setPogpCode] = useState<string | null>(null);
  const [vendCode, setVendCode] = useState<string | null>(null);

  // ----------------------------------------------------------
  // Capture referral code from:
  //
  // /register?ref=POGP-001
  // /register?ref=VEND-001
  //
  // The code is not entered manually by the farmer.
  // ----------------------------------------------------------

  useEffect(() => {
    const ref = searchParams.get("ref");

    if (!ref) {
      setPogpCode(null);
      setVendCode(null);
      return;
    }

    const normalized = ref.trim().toUpperCase();

    if (/^POGP-\d+$/.test(normalized)) {
      setPogpCode(normalized);
      setVendCode(null);
      return;
    }

    if (/^VEND-\d+$/.test(normalized)) {
      setVendCode(normalized);
      setPogpCode(null);
      return;
    }

    setPogpCode(null);
    setVendCode(null);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      // ------------------------------------------------------
      // Create account
      //
      // The referral code is stored in Supabase user metadata.
      // Attribution happens later when the farm is created.
      // ------------------------------------------------------

      const referralData =
        pogpCode
          ? { pogp_code: pogpCode }
          : vendCode
            ? { vend_code: vendCode }
            : undefined;

      const { error } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: referralData,
          },
        });

      if (error) {
        throw error;
      }

      setMessage(
        pogpCode || vendCode
          ? "Your account has been created. Check your email to verify your account. Your referral has been recorded."
          : "Check your email to verify your account, or sign in if you're already registered."
      );
    } catch (error: any) {
      console.error(error);

      setMessage(
        error?.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="
        w-full
        max-w-md
        rounded-2xl
        border
        bg-white
        p-8
        shadow-sm
      "
    >
      <h1 className="text-3xl font-bold">
        Start Your Free Trial
      </h1>

      <p className="mt-2 text-sm text-slate-500">
        Create your PoultryOps account.
      </p>

      {(pogpCode || vendCode) && (
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-sm font-medium text-blue-900">
            {pogpCode
              ? "Referred by a PoultryOps Growth Partner"
              : "Referred by a PoultryOps VEND Partner"}
          </p>

          <p className="mt-1 text-xs text-blue-700">
            Referral code:{" "}
            <span className="font-bold">
              {pogpCode || vendCode}
            </span>
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4"
      >
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="
            w-full
            rounded-lg
            border
            p-3
          "
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="
            w-full
            rounded-lg
            border
            p-3
          "
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="
            w-full
            rounded-lg
            bg-blue-600
            p-3
            text-white
            font-semibold
            hover:bg-blue-700
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {loading
            ? "Creating Account..."
            : "Create Account"}
        </button>

        {message && (
          <>
            <p
              className="
                text-sm
                text-slate-600
              "
            >
              {message}
            </p>

            <div className="mt-4">
              <Link
                href="/login"
                className="
                  text-sm
                  font-medium
                  text-blue-600
                  hover:underline
                "
              >
                Already have an account? Login
              </Link>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
