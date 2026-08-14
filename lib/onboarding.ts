import { supabase } from "@/lib/supabase";
// END TrueOps Email Framework

type CreateFarmParams = {
  userId: string;
  farmName: string;
  farmType: string;
  currency: string;
  selectedPlan: string;
};

/**
 * Thrown when the authenticated user already owns a farm.
 *
 * Business rule (current PoultryOps architecture):
 * ONE AUTH ACCOUNT / EMAIL = ONE FARM OWNER = ONE FARM.
 *
 * The onboarding form catches this error and redirects the user
 * to their existing farm/dashboard instead of creating another farm.
 */
export class FarmAlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FarmAlreadyExistsError";
  }
}

/**
 * Returns true when a PostgREST error is a unique-constraint violation
 * (PostgreSQL SQLSTATE 23505). This is how we detect a lost race between
 * two simultaneous onboarding requests — the database unique index on
 * farms(owner_id) is the final protection.
 */
function isUniqueViolation(error: { code?: string; message?: string }): boolean {
  return error?.code === "23505" || /unique constraint|duplicate key/i.test(error?.message ?? "");
}

export async function createFarmAndTrial({
  userId,
  farmName,
  farmType,
  currency,
  selectedPlan,
}: CreateFarmParams) {
  // =============================================================
  // APPLICATION-LEVEL PROTECTION
  // Prevent duplicate farms for the same owner.
  // The DB unique index on farms(owner_id) is the final guard.
  // =============================================================

  const {
    data: existingFarm,
    error: existingFarmError,
  } = await supabase
    .from("farms")
    .select("id, name")
    .eq("owner_id", userId)
    .maybeSingle();

  if (existingFarmError) {
    throw existingFarmError;
  }

  if (existingFarm) {
    throw new FarmAlreadyExistsError(
      "This account already has a farm. Redirecting you to your dashboard..."
    );
  }

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
    // Race condition caught by the database unique index.
    // Convert the raw PostgreSQL error into a useful message and
    // send the user to their existing farm/dashboard.
    if (isUniqueViolation(farmError)) {
      throw new FarmAlreadyExistsError(
        "This account already has a farm. Redirecting you to your dashboard..."
      );
    }

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
      plan: null,
      status: "trial",
      selected_plan: selectedPlan,
      billing_cycle: null,
      payment_reference: null,
      next_billing_date: null,
      trial_start: trialStart,
      trial_end: trialEnd,
    });

  if (subscriptionError) {
    throw subscriptionError;
  }

try {
  const response = await fetch("/api/send-welcome", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      farmName,
    }),
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      if (body?.error) {
        errorDetail = body.error;
      }
    } catch {
      // response body was not JSON — keep the HTTP status detail
    }
    console.error("[onboarding] Welcome email failed:", errorDetail);
  } else {
    console.log("[onboarding] Welcome email sent successfully");
  }
} catch (error) {
  console.error("[onboarding] Welcome email failed (request error):", error);
}
  return farm;
}