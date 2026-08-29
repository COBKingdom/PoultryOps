import { supabase } from "@/lib/supabase";
// END TrueOps Email Framework

type CreateFarmParams = {
  userId: string;
  fullName: string;
  farmName: string;
  farmType: string;
  currency: string;
  selectedPlan: string;
};

/**
 * Thrown when the authenticated user already owns a farm.
 *
 * Business rule:
 * ONE AUTH ACCOUNT / EMAIL = ONE FARM OWNER = ONE FARM.
 */
export class FarmAlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FarmAlreadyExistsError";
  }
}

/**
 * Returns true when a PostgREST error is a unique-constraint
 * violation (PostgreSQL SQLSTATE 23505).
 */
function isUniqueViolation(error: {
  code?: string;
  message?: string;
}): boolean {
  return (
    error?.code === "23505" ||
    /unique constraint|duplicate key/i.test(
      error?.message ?? ""
    )
  );
}

/**
 * Create the user's farm, farm user, trial subscription
 * and — when applicable — attribute the farm to a POGP.
 *
 * The owner's full name is stored in profiles.full_name.
 */
export async function createFarmAndTrial({
  userId,
  fullName,
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

  // =============================================================
  // Validate owner name
  // =============================================================

  const normalizedFullName = fullName.trim();

  if (!normalizedFullName) {
    throw new Error("Please enter your full name");
  }

  // =============================================================
  // Create Farm
  // =============================================================

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
    if (isUniqueViolation(farmError)) {
      throw new FarmAlreadyExistsError(
        "This account already has a farm. Redirecting you to your dashboard..."
      );
    }

    throw farmError;
  }

  // =============================================================
  // Update Profile
  //
  // Store the farm owner's required full name.
  // Existing profile fields remain unchanged.
  // =============================================================

  const {
    error: profileError,
  } = await supabase
    .from("profiles")
    .update({
      full_name: normalizedFullName,
      farm_id: farm.id,
      role: "owner",
    })
    .eq("id", userId);

  if (profileError) {
    throw profileError;
  }

  // =============================================================
  // Create Farm User
  // =============================================================

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

  // =============================================================
  // Create Subscription
  // =============================================================

  const trialStart = new Date();

  const trialEnd = new Date();

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

  // =============================================================
  // POGP ATTRIBUTION
  //
  // The registration form stores the referral code in the
  // authenticated user's metadata.
  //
  // The server endpoint reads the authenticated user itself,
  // validates the POGP code and creates the attribution.
  //
  // IMPORTANT:
  // A missing POGP code is perfectly valid.
  // An invalid code does not prevent farm creation.
  // =============================================================

  try {
    const {
      data: {
        session,
      },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      const response = await fetch(
        "/api/pogp/attribute",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            farmId: farm.id,
          }),
        }
      );

      if (!response.ok) {
        let errorDetail = `HTTP ${response.status}`;

        try {
          const body = await response.json();

          if (body?.error) {
            errorDetail = body.error;
          }
        } catch {
          // Keep HTTP status detail.
        }

        console.warn(
          "[onboarding] POGP attribution was not created:",
          errorDetail
        );
      } else {
        const result = await response.json();

        if (result?.attributed) {
          console.log(
            "[onboarding] Farm attributed to POGP:",
            result.pogpCode
          );
        } else {
          console.log(
            "[onboarding] No POGP attribution required."
          );
        }
      }
    }
  } catch (error) {
    // POGP attribution must never prevent the farmer
    // from completing their account setup.
    console.warn(
      "[onboarding] POGP attribution request failed:",
      error
    );
  }

  // =============================================================
  // Welcome Email
  // =============================================================

  try {
    const response = await fetch(
      "/api/send-welcome",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          farmName,
        }),
      }
    );

    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}`;

      try {
        const body = await response.json();

        if (body?.error) {
          errorDetail = body.error;
        }
      } catch {
        // Keep HTTP status detail.
      }

      console.error(
        "[onboarding] Welcome email failed:",
        errorDetail
      );
    } else {
      console.log(
        "[onboarding] Welcome email sent successfully"
      );
    }
  } catch (error) {
    console.error(
      "[onboarding] Welcome email failed (request error):",
      error
    );
  }

  return farm;
}