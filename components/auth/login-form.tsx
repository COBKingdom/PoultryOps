"use client";

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

      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) throw error;

      router.push("/dashboard");
    } catch (error: any) {
      setMessage(error.message);
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
        className="w-full border p-3 rounded"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) =>
          setPassword(e.target.value)
        }
        className="w-full border p-3 rounded"
      />

      <button
        disabled={loading}
        className="w-full bg-slate-900 text-white p-3 rounded"
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