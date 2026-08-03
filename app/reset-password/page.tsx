"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

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

    if (
      password !==
      confirmPassword
    ) {
      setMessage(
        "Passwords do not match"
      );

      return;
    }

    try {
      setLoading(true);

      const { error } =
        await supabase.auth.updateUser({
          password,
        });

      if (error) {
        throw error;
      }

      // First-login flow: if the user was required to change their
      // temporary password, clear the flag and go straight to the dashboard.
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (user) {
        const { data: profile } =
          await supabase
            .from("profiles")
            .select("must_change_password")
            .eq("id", user.id)
            .single();

        if (
          profile?.must_change_password
        ) {
          await supabase
            .from("profiles")
            .update({
              must_change_password: false,
            })
            .eq("id", user.id);

          router.push(
            "/dashboard"
          );

          return;
        }
      }

      router.push(
        "/login?reset=success"
      );

    } catch (err: any) {
      setMessage(
        err.message ||
          "Failed to reset password"
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">

        <h1 className="text-2xl font-bold">
          Reset Password
        </h1>

        <p className="text-slate-500 mt-2 mb-6">
          Choose a new password.
        </p>

        <form
          onSubmit={handleReset}
          className="space-y-4"
        >
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            className="w-full border rounded-lg p-3"
            required
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(
                e.target.value
              )
            }
            className="w-full border rounded-lg p-3"
            required
          />

          <button
            disabled={loading}
            className="
              w-full
              bg-blue-600
              text-white
              p-3
              rounded-lg
              font-semibold
            "
          >
            {loading
              ? "Updating..."
              : "Update Password"}
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