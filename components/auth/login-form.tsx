"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { supabase } from "@/lib/supabase";

/*
 * Existing shared PoultryOps Demo account.
 *
 * Only this email is treated as the Demo. Every other account
 * keeps the existing login behaviour untouched.
 */
const DEMO_EMAIL = "demo@poultryops.app";

/*
 * Browser storage key for the opaque Demo visitor token issued by
 * /api/demo/visit. The token is how a repeat Demo access is matched
 * to an existing visitor record.
 */
const DEMO_VISITOR_TOKEN_KEY = "poultryops_demo_visitor_token";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const verified = searchParams.get("verified") === "1";
  const verificationError =
    searchParams.get("verification_error") === "1";

  /*
   * Demo visitor capture fields.
   *
   * Requested only when the Demo email is being used.
   */
  const [demoFullName, setDemoFullName] = useState("");
  const [demoPhone, setDemoPhone] = useState("");

  const isDemoLogin =
    email.trim().toLowerCase() === DEMO_EMAIL;

  async function handleResendVerification() {
    const targetEmail = email.trim().toLowerCase();

    if (!targetEmail) {
      setResendMessage("Please enter your email address first.");
      return;
    }

    try {
      setResending(true);
      setResendMessage("");

      const response = await fetch("/api/vend/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await response.json().catch(() => ({}));

      setResendMessage(
        data.message ||
          "If the email belongs to an unverified PoultryOps VEND account, a verification email has been sent."
      );
    } catch {
      setResendMessage(
        "If the email belongs to an unverified PoultryOps VEND account, a verification email has been sent."
      );
    } finally {
      setResending(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");
      setNeedsVerification(false);
      setResendMessage("");

      // ----------------------------------------------------------
      // Demo visitor capture
      //
      // Runs BEFORE the existing authentication call so that the
      // login only continues once the visitor has been recorded.
      // ----------------------------------------------------------

      if (isDemoLogin) {
        if (!demoFullName.trim()) {
          throw new Error("Full name is required for Demo access");
        }

        if (!demoPhone.trim()) {
          throw new Error(
            "Phone number is required for Demo access"
          );
        }

        const existingToken = window.localStorage.getItem(
          DEMO_VISITOR_TOKEN_KEY
        );

        const visitResponse = await fetch("/api/demo/visit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            visitor_token: existingToken || undefined,
            full_name: demoFullName.trim(),
            phone: demoPhone.trim(),
          }),
        });

        const visitData = await visitResponse.json();

        if (!visitResponse.ok || !visitData.success) {
          throw new Error(
            visitData.error || "Unable to start Demo access"
          );
        }

        if (visitData.visitor_token) {
          window.localStorage.setItem(
            DEMO_VISITOR_TOKEN_KEY,
            visitData.visitor_token
          );
        }
      }

      const {
        data,
        error,
      } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        throw error;
      }

      const user = data.user;

      if (!user) {
        throw new Error("Unable to identify logged-in user");
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "farm_id, role, must_change_password"
        )
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      // ----------------------------------------------------------
      // POGP USER
      //
      // POGPs are independent PoultryOps partners.
      // They do NOT have a farm_id.
      // ----------------------------------------------------------

      if (profile?.role === "pogp") {
        if (profile.must_change_password) {
          router.push("/reset-password?type=pogp");
          return;
        }

        router.push("/pogp");
        return;
      }

      // ----------------------------------------------------------
      // VEND USER
      //
      // VENDs are independent PoultryOps referral partners.
      // They do NOT have a farm_id.
      // ----------------------------------------------------------

      if (profile?.role === "vend") {
        if (profile.must_change_password) {
          router.push("/reset-password?type=vend");
          return;
        }

        router.push("/vend");
        return;
      }

      // ----------------------------------------------------------
      // NORMAL FARM USER
      // ----------------------------------------------------------

      if (!profile?.farm_id) {
        router.push("/onboarding");
        return;
      }

      // ----------------------------------------------------------
      // FIRST LOGIN
      //
      // Invited farm users must change their temporary password.
      // ----------------------------------------------------------

      if (profile.must_change_password) {
        router.push("/reset-password");
        return;
      }

      // ----------------------------------------------------------
      // PRESERVE INTENDED DESTINATION
      // ----------------------------------------------------------

      const params = new URLSearchParams(
        window.location.search
      );

      const next = params.get("next");

      if (
        next &&
        next.startsWith("/") &&
        !next.startsWith("//")
      ) {
        router.push(next);
        return;
      }

      // ----------------------------------------------------------
      // DEFAULT FARM DASHBOARD
      // ----------------------------------------------------------

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);

      const rawMessage = String(error?.message || "");

      // Unconfirmed email — friendly VEND-aware message with resend.
      // Farm-user and POGP behaviour is otherwise unchanged.
      if (
        rawMessage.toLowerCase().includes("email not confirmed") ||
        rawMessage.toLowerCase().includes("email is not confirmed") ||
        rawMessage.toLowerCase().includes("not confirmed")
      ) {
        setNeedsVerification(true);
        setMessage("Please verify your email before logging in.");
        return;
      }

      setMessage(
        error?.message ||
          "Invalid login credentials"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleLogin}
      className="space-y-4"
    >
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
        }
        className="
          w-full
          border
          p-3
          rounded-lg
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
          border
          p-3
          rounded-lg
        "
        required
      />

      {isDemoLogin && (
        <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Demo access
            </p>
            <p className="text-xs text-slate-500">
              Please tell us who is using the Demo.
            </p>
          </div>

          <input
            type="text"
            placeholder="Full name"
            value={demoFullName}
            onChange={(e) =>
              setDemoFullName(e.target.value)
            }
            className="
              w-full
              border
              bg-white
              p-3
              rounded-lg
            "
            required
          />

          <input
            type="tel"
            placeholder="Phone number"
            value={demoPhone}
            onChange={(e) =>
              setDemoPhone(e.target.value)
            }
            className="
              w-full
              border
              bg-white
              p-3
              rounded-lg
            "
            required
          />
        </div>
      )}

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="
            text-sm
            text-blue-600
            hover:underline
          "
        >
          Forgot Password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="
          w-full
          bg-blue-600
          text-white
          p-3
          rounded-lg
          font-semibold
          disabled:opacity-60
        "
      >
        {loading
          ? "Signing In..."
          : "Login"}
      </button>

      {verified && (
        <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Email verified successfully. You can now log in.
        </p>
      )}

      {verificationError && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          We couldn&apos;t complete email verification. Please try the
          verification link again or request a new verification email.
        </p>
      )}

      {message && (
        <p className="text-sm text-red-500">
          {message}
        </p>
      )}

      {needsVerification && (
        <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3">
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resending}
            className="text-sm font-semibold text-blue-700 hover:underline disabled:opacity-60"
          >
            {resending ? "Sending..." : "Resend verification email"}
          </button>

          {resendMessage && (
            <p className="mt-2 text-sm text-slate-600">{resendMessage}</p>
          )}
        </div>
      )}
    </form>
  );
}