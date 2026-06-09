"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function RegisterForm() {
  const [farmName, setFarmName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const { data, error } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (error) throw error;

      if (!data.user) {
        throw new Error(
          "User creation failed"
        );
      }

      const userId = data.user.id;

      // Create Farm

      const {
        data: farm,
        error: farmError,
      } = await supabase
        .from("farms")
        .insert({
          name: farmName,
          owner_id: userId,
          farm_type: "Poultry",
          active: true,
        })
        .select()
        .single();

      if (farmError) throw farmError;

      // Update Profile

      const { error: profileError } =
        await supabase
          .from("profiles")
          .update({
            farm_id: farm.id,
            role: "owner",
          })
          .eq("id", userId);

      if (profileError)
        throw profileError;

      // Farm User

      const {
        error: farmUserError,
      } = await supabase
        .from("farm_users")
        .insert({
          farm_id: farm.id,
          user_id: userId,
          role: "owner",
        });

      if (farmUserError)
        throw farmUserError;

      // Subscription

      const trialStart =
        new Date();

      const trialEnd =
        new Date();

      trialEnd.setDate(
        trialEnd.getDate() + 30
      );

      const {
        error: subscriptionError,
      } = await supabase
        .from("subscriptions")
        .insert({
          farm_id: farm.id,
          plan: "starter",
          status: "trial",
          trial_start: trialStart,
          trial_end: trialEnd,
        });

      if (subscriptionError)
        throw subscriptionError;

      setMessage(
        "Account created. Check your email to verify your account."
      );
    } catch (error: any) {
      setMessage(
        error.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">
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
          type="text"
          placeholder="Farm Name"
          value={farmName}
          onChange={(e) =>
            setFarmName(
              e.target.value
            )
          }
          className="w-full rounded-lg border p-3"
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          className="w-full rounded-lg border p-3"
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
          className="w-full rounded-lg border p-3"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-slate-900 p-3 text-white"
        >
          {loading
            ? "Creating..."
            : "Start Free Trial"}
        </button>

        {message && (
          <p className="text-sm">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}