"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function handleLogin(
    e: React.FormEvent
  ) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const {
        data,
        error,
      } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        throw error;
      }

      const user =
        data.user;

      const {
        data: profile,
        error: profileError,
      } =
        await supabase
          .from("profiles")
          .select("farm_id")
          .eq("id", user.id)
          .single();

      if (profileError) {
        throw profileError;
      }

      if (
        !profile?.farm_id
      ) {
        router.push(
          "/onboarding"
        );

        return;
      }

      router.push(
        "/dashboard"
      );

    } catch (error: any) {
      console.error(error);

      setMessage(
        error.message ||
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
          setEmail(
            e.target.value
          )
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
          setPassword(
            e.target.value
          )
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