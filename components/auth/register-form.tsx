"use client";

import { useState } from "react";

import { supabase } from "@/lib/supabase";

export function RegisterForm() {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const { error } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (error) {
        throw error;
      }

      setMessage(
        "Account created successfully. Please check your email and verify your account before signing in."
      );

    } catch (error: any) {
      console.error(error);

      setMessage(
        error.message ||
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

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4"
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
            setPassword(
              e.target.value
            )
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
          "
        >
          {loading
            ? "Creating Account..."
            : "Create Account"}
        </button>

        {message && (
          <p
            className="
              text-sm
              text-slate-600
            "
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}