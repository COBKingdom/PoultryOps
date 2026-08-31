"use client";

import {
  Suspense,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { supabase } from "@/lib/supabase";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const accountType =
    searchParams.get("type");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function handleReset(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setMessage("");

    if (password.length < 8) {
      setMessage(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessage(
        "Passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Your login session has expired. Please sign in again."
        );
      }

      // ----------------------------------------------------------
      // Update Supabase Auth password
      // ----------------------------------------------------------

      const { error: passwordError } =
        await supabase.auth.updateUser({
          password,
        });

      if (passwordError) {
        throw passwordError;
      }

      // ----------------------------------------------------------
      // Retrieve current profile
      // ----------------------------------------------------------

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "role, must_change_password"
        )
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      // ----------------------------------------------------------
      // Clear temporary-password flag
      // ----------------------------------------------------------

      if (profile?.must_change_password) {
        const {
          error: updateError,
        } = await supabase
          .from("profiles")
          .update({
            must_change_password: false,
          })
          .eq("id", user.id);

        if (updateError) {
          throw updateError;
        }
      }

      // ----------------------------------------------------------
      // POGP
      // ----------------------------------------------------------

      if (
        profile?.role === "pogp" ||
        accountType === "pogp"
      ) {
        router.push("/pogp");
        return;
      }

      // ----------------------------------------------------------
      // Normal farm user
      // ----------------------------------------------------------

      router.push("/dashboard");
    } catch (error: any) {
      console.error(
        "Password reset error:",
        error
      );

      setMessage(
        error?.message ||
          "Failed to update password."
      );
    } finally {
      setLoading(false);
    }
  }

  const isPogp =
    accountType === "pogp";

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">

        <div className="mb-6">
          <p className="text-xs font-semibold tracking-[0.2em] text-blue-600 uppercase">
            PoultryOps
          </p>

          <h1 className="text-2xl font-bold mt-2">
            Create Your Password
          </h1>

          <p className="text-slate-500 mt-2">
            {isPogp
              ? "Welcome to the PoultryOps Growth Partner network. Please create your personal password to continue."
              : "Your temporary password must be replaced before you can continue."}
          </p>
        </div>

        <form
          onSubmit={handleReset}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              New Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter new password"
              className="w-full border rounded-lg p-3"
              minLength={8}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confirm Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              placeholder="Confirm new password"
              className="w-full border rounded-lg p-3"
              minLength={8}
              required
            />
          </div>

          <div className="rounded-lg bg-slate-50 border p-3 text-sm text-slate-600">
            Password must contain at least 8 characters.
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
              ? "Updating..."
              : "Create Password"}
          </button>

          {message && (
            <p className="text-red-500 text-sm">
              {message}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="text-slate-500">
            Loading...
          </div>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}