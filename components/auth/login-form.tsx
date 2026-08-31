"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

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