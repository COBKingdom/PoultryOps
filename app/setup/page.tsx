"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export default function SetupPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [farmName, setFarmName] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function createFarm() {
    try {
      if (!user) {
        setMessage("Please login first");
        return;
      }

      setLoading(true);
      setMessage("");

      // Create Farm

      const { data: farm, error: farmError } =
        await supabase
          .from("farms")
          .insert({
            name: farmName,
            owner_id: user.id,
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
          .eq("id", user.id);

      if (profileError) throw profileError;

      // Farm User

      const { error: farmUserError } =
        await supabase
          .from("farm_users")
          .insert({
            farm_id: farm.id,
            user_id: user.id,
            role: "owner",
          });

      if (farmUserError) throw farmUserError;

      // Subscription

      const trialStart = new Date();

      const trialEnd = new Date();

trialEnd.setDate(
  trialEnd.getDate() + 14
);

      const { error: subscriptionError } =
        await supabase
          .from("subscriptions")
          .insert({
            farm_id: farm.id,
            plan: "trial",
            status: "trial",
            trial_start: trialStart,
            trial_end: trialEnd,
          });

      if (subscriptionError)
        throw subscriptionError;

      router.push("/dashboard");

    } catch (error: any) {
      console.error(error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">
          Create Your Farm
        </h1>

        <p className="mt-2 text-gray-500">
          Let's set up your PoultryOps account.
        </p>

        <input
          value={farmName}
          onChange={(e) =>
            setFarmName(e.target.value)
          }
          placeholder="Farm Name"
          className="w-full border p-3 rounded mt-6"
        />

        <button
          onClick={createFarm}
          disabled={loading}
          className="w-full mt-4 bg-slate-900 text-white p-3 rounded"
        >
          {loading
            ? "Creating..."
            : "Create Farm"}
        </button>

        {message && (
          <p className="mt-4 text-sm text-red-500">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}