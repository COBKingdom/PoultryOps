import { supabase } from "@/lib/supabase";
// END TrueOps Email Framework

type CreateFarmParams = {
  userId: string;
  farmName: string;
  farmType: string;
  currency: string;
};

export async function createFarmAndTrial({
  userId,
  farmName,
  farmType,
  currency,
}: CreateFarmParams) {
  // Create Farm

  const {
    data: farm,
    error: farmError,
  } = await supabase
    .from("farms")
    .insert({
      name: farmName,
      owner_id: userId,
      farm_type: farmType,
      currency,
      active: true,
    })
    .select()
    .single();

  if (farmError) {
    throw farmError;
  }

  // Update Profile

  const {
    error: profileError,
  } = await supabase
    .from("profiles")
    .update({
      farm_id: farm.id,
      role: "owner",
    })
    .eq("id", userId);

  if (profileError) {
    throw profileError;
  }

  // Create Farm User

  const {
    error: farmUserError,
  } = await supabase
    .from("farm_users")
    .insert({
      farm_id: farm.id,
      user_id: userId,
      role: "owner",
    });

  if (farmUserError) {
    throw farmUserError;
  }

  // Create Subscription

  const trialStart =
    new Date();

  const trialEnd =
    new Date();

trialEnd.setDate(
  trialEnd.getDate() + 14
);

  const {
    error: subscriptionError,
  } = await supabase
    .from("subscriptions")
    .insert({
      farm_id: farm.id,
      plan: "trial",
      status: "trial",
      trial_start: trialStart,
      trial_end: trialEnd,
    });

  if (subscriptionError) {
    throw subscriptionError;
  }

void fetch("/api/send-welcome", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    userId,
    farmName,
  }),
});
  return farm;
}