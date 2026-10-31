"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { supabase } from "@/lib/supabase";

/*
 * Existing shared PoultryOps Demo account.
 */
const DEMO_EMAIL = "demo@poultryops.app";
const DEMO_PASSWORD = "PoultryOps1!";

/*
 * Browser storage key for the opaque Demo visitor token
 * issued by /api/demo/visit.
 */
const DEMO_VISITOR_TOKEN_KEY =
  "poultryops_demo_visitor_token";

interface LoginFormProps {
  demoMode?: boolean;
}

export default function LoginForm({
  demoMode = false,
}: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  /*
   * Demo mode automatically populates the shared credentials.
   * Normal login retains empty email/password fields.
   */
  const [email, setEmail] = useState(
    demoMode ? DEMO_EMAIL : ""
  );

  const [password, setPassword] = useState(
    demoMode ? DEMO_PASSWORD : ""
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [needsVerification, setNeedsVerification] =
    useState(false);

  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const verified = searchParams.get("verified") === "1";

  const verificationError =
    searchParams.get("verification_error") === "1";

  /*
   * Demo visitor capture fields.
   */
  const [demoFullName, setDemoFullName] = useState("");
  const [demoPhone, setDemoPhone] = useState("");

  const isDemoLogin =
    email.trim().toLowerCase() === DEMO_EMAIL;

  /*
   * Resend email verification.
   * Existing VEND verification functionality preserved.
   */
  async function handleResendVerification() {
    const targetEmail = email.trim().toLowerCase();

    if (!targetEmail) {
      setResendMessage(
        "Please enter your email address first."
      );
      return;
    }

    try {
      setResending(true);
      setResendMessage("");

      const response = await fetch(
        "/api/vend/resend-verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: targetEmail,
          }),
        }
      );

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

  /*
   * Main login handler.
   *
   * Existing authentication and routing logic is retained.
   * Demo visitor registration runs before authentication.
   */
  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");
      setNeedsVerification(false);
      setResendMessage("");

      // ----------------------------------------------------------
      // 1. DEMO VISITOR CAPTURE
      // ----------------------------------------------------------

      if (isDemoLogin) {
        if (!demoFullName.trim()) {
          throw new Error(
            "Full name is required for Demo access"
          );
        }

        if (!demoPhone.trim()) {
          throw new Error(
            "Phone number is required for Demo access"
          );
        }

        const existingToken =
          window.localStorage.getItem(
            DEMO_VISITOR_TOKEN_KEY
          );

        const visitResponse = await fetch(
          "/api/demo/visit",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              visitor_token: existingToken || undefined,
              full_name: demoFullName.trim(),
              phone: demoPhone.trim(),
            }),
          }
        );

        const visitData = await visitResponse.json();

        if (!visitResponse.ok || !visitData.success) {
          throw new Error(
            visitData.error ||
              "Unable to start Demo access"
          );
        }

        if (visitData.visitor_token) {
          window.localStorage.setItem(
            DEMO_VISITOR_TOKEN_KEY,
            visitData.visitor_token
          );
        }
      }

      // ----------------------------------------------------------
      // 2. SUPABASE AUTHENTICATION
      // ----------------------------------------------------------

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
        throw new Error(
          "Unable to identify logged-in user"
        );
      }

      // ----------------------------------------------------------
      // 3. FETCH USER PROFILE
      // ----------------------------------------------------------

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
      // 4. POGP USER
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
      // 5. VEND USER
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
      // 6. NORMAL FARM USER
      // ----------------------------------------------------------

      if (!profile?.farm_id) {
        router.push("/onboarding");
        return;
      }

      // ----------------------------------------------------------
      // 7. FIRST LOGIN PASSWORD CHANGE
      // ----------------------------------------------------------

      if (profile.must_change_password) {
        router.push("/reset-password");
        return;
      }

      // ----------------------------------------------------------
      // 8. PRESERVE INTENDED DESTINATION
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
      // 9. DEFAULT FARM DASHBOARD
      // ----------------------------------------------------------

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);

      const rawMessage = String(
        error?.message || ""
      );

      // ----------------------------------------------------------
      // EMAIL VERIFICATION ERROR
      // ----------------------------------------------------------

      if (
        rawMessage.toLowerCase().includes(
          "email not confirmed"
        ) ||
        rawMessage.toLowerCase().includes(
          "email is not confirmed"
        ) ||
        rawMessage.toLowerCase().includes(
          "not confirmed"
        )
      ) {
        setNeedsVerification(true);

        setMessage(
          "Please verify your email before logging in."
        );

        return;
      }

      setMessage(
        error?.message || "Invalid login credentials"
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
      {/* -------------------------------------------------------
          EMAIL
      ------------------------------------------------------- */}

      <div className="space-y-1">
        {demoMode && (
          <label className="text-sm font-medium text-slate-700">
            Demo Email
          </label>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          readOnly={demoMode}
          autoComplete="username"
          className={`
            w-full
            border
            p-3
            rounded-lg
            outline-none
            focus:ring-2
            focus:ring-blue-500
            ${
              demoMode
                ? "bg-slate-100 text-slate-600 cursor-not-allowed"
                : "bg-white"
            }
          `}
          required
        />
      </div>

      {/* -------------------------------------------------------
          PASSWORD
      ------------------------------------------------------- */}

      <div className="space-y-1">
        {demoMode && (
          <label className="text-sm font-medium text-slate-700">
            Demo Password
          </label>
        )}

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          readOnly={demoMode}
          autoComplete="current-password"
          className={`
            w-full
            border
            p-3
            rounded-lg
            outline-none
            focus:ring-2
            focus:ring-blue-500
            ${
              demoMode
                ? "bg-slate-100 text-slate-600 cursor-not-allowed"
                : "bg-white"
            }
          `}
          required
        />
      </div>

      {/* -------------------------------------------------------
          DEMO VISITOR INFORMATION
      ------------------------------------------------------- */}

      {isDemoLogin && (
        <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">

          <div>
            <p className="text-sm font-semibold text-slate-800">
              {demoMode
                ? "Your Demo Access Details"
                : "Demo access"}
            </p>

            <p className="text-xs text-slate-500 mt-1">
              {demoMode
                ? "Please enter your details to access the PoultryOps Demo Farm."
                : "Please tell us who is using the Demo."}
            </p>
          </div>

          {/* FULL NAME */}

          <div className="space-y-1">
            <label
              htmlFor="demo-full-name"
              className="text-sm font-medium text-slate-700"
            >
              Full Name
            </label>

            <input
              id="demo-full-name"
              type="text"
              placeholder="Enter your full name"
              value={demoFullName}
              onChange={(e) =>
                setDemoFullName(e.target.value)
              }
              maxLength={120}
              autoComplete="name"
              className="
                w-full
                border
                bg-white
                p-3
                rounded-lg
                outline-none
                focus:ring-2
                focus:ring-blue-500
              "
              required
            />
          </div>

          {/* PHONE NUMBER */}

          <div className="space-y-1">
            <label
              htmlFor="demo-phone"
              className="text-sm font-medium text-slate-700"
            >
              Phone Number
            </label>

            <input
              id="demo-phone"
              type="tel"
              placeholder="Enter your phone number"
              value={demoPhone}
              onChange={(e) =>
                setDemoPhone(e.target.value)
              }
              maxLength={32}
              autoComplete="tel"
              className="
                w-full
                border
                bg-white
                p-3
                rounded-lg
                outline-none
                focus:ring-2
                focus:ring-blue-500
              "
              required
            />
          </div>

        </div>
      )}

      {/* -------------------------------------------------------
          FORGOT PASSWORD
          Hidden in dedicated Demo mode.
      ------------------------------------------------------- */}

      {!demoMode && (
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
      )}

      {/* -------------------------------------------------------
          SUBMIT BUTTON
      ------------------------------------------------------- */}

      <button
        type="submit"
        disabled={loading}
        className={`
          w-full
          text-white
          p-3
          rounded-lg
          font-semibold
          transition
          disabled:opacity-60
          disabled:cursor-not-allowed
          ${
            demoMode
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-blue-600 hover:bg-blue-700"
          }
        `}
      >
        {loading
          ? demoMode
            ? "Entering Demo..."
            : "Signing In..."
          : demoMode
            ? "Enter Demo Farm"
            : "Login"}
      </button>

      {/* -------------------------------------------------------
          SUCCESSFUL EMAIL VERIFICATION
      ------------------------------------------------------- */}

      {verified && (
        <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Email verified successfully. You can now log in.
        </p>
      )}

      {/* -------------------------------------------------------
          VERIFICATION ERROR
      ------------------------------------------------------- */}

      {verificationError && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          We couldn&apos;t complete email verification.
          Please try the verification link again or
          request a new verification email.
        </p>
      )}

      {/* -------------------------------------------------------
          LOGIN ERROR
      ------------------------------------------------------- */}

      {message && (
        <p
          role="alert"
          className="text-sm text-red-500"
        >
          {message}
        </p>
      )}

      {/* -------------------------------------------------------
          RESEND VERIFICATION
      ------------------------------------------------------- */}

      {needsVerification && (
        <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3">

          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resending}
            className="
              text-sm
              font-semibold
              text-blue-700
              hover:underline
              disabled:opacity-60
            "
          >
            {resending
              ? "Sending..."
              : "Resend verification email"}
          </button>

          {resendMessage && (
            <p className="mt-2 text-sm text-slate-600">
              {resendMessage}
            </p>
          )}

        </div>
      )}

    </form>
  );
}