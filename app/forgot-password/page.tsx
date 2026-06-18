"use client";

import Link from "next/link";
import { useState } from "react";

import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleReset(
    e: React.FormEvent
  ) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo:
              "https://poultry.trueops.app/reset-password",
          }
        );

      if (error) {
        throw error;
      }

      setSuccess(true);

    } catch (err: any) {
      setError(
        err.message ||
          "Failed to send reset email"
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">

        <h1 className="text-2xl font-bold">
          Forgot Password
        </h1>

        <p className="text-slate-500 mt-2 mb-6">
          Enter your email address and we
          will send you a password reset link.
        </p>

        {success ? (
          <div className="space-y-4">

            <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-green-700">
              Password reset email sent.
              Check your inbox.
            </div>

            <Link
              href="/login"
              className="block text-center text-blue-600"
            >
              Back to Login
            </Link>

          </div>
        ) : (
          <form
            onSubmit={handleReset}
            className="space-y-4"
          >
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) =>
                setEmail(
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
                ? "Sending..."
                : "Send Reset Link"}
            </button>

            {error && (
              <p className="text-red-500 text-sm">
                {error}
              </p>
            )}

            <Link
              href="/login"
              className="block text-center text-sm text-slate-500"
            >
              Back to Login
            </Link>

          </form>
        )}

      </div>
    </main>
  );
}