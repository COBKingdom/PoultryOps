"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  /*
   * Demo visitor capture fields.
   *
   * Requested only when the Demo email is being used.
   */
  const [demoFullName, setDemoFullName] = useState("");
  const [demoPhone, setDemoPhone] = useState("");

  const isDemoLogin =
    email.trim().toLowerCase() === DEMO_EMAIL;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

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

      {message && (
        <p className="text-sm text-red-500">
          {message}
        </p>
      )}
    </form>
  );
}