import { supabase } from "@/lib/supabase";

type MortalityRecordInput = {
  farm_id: string;
  flock_id: string;
  mortality_date: string;
  quantity: number;
  reason?: string | null;
  created_by?: string | null;
};

type MortalityUpdateInput = {
  farm_id?: string;
  flock_id: string;
  mortality_date: string;
  quantity: number;
  reason: string;
};

export async function createMortality(
  record: MortalityRecordInput
) {
  const { data, error } =
    await supabase
      .from("mortality")
      .insert({
        farm_id: record.farm_id,
        flock_id: record.flock_id,
        mortality_date:
          record.mortality_date,
        quantity: record.quantity,
        reason: record.reason ?? null,
        created_by:
          record.created_by ?? null,
      })
      .select()
      .single();

  if (error) throw error;

  return data;
}

export async function getMortality(
  farmId: string
) {
  const { data, error } =
    await supabase
      .from("mortality")
      .select(`
        *,
        flocks (
          flock_name
        ),
        created_by_profile:profiles!mortality_created_by_fkey (
          id,
          full_name,
          email
        ),
        updated_by_profile:profiles!mortality_updated_by_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq("farm_id", farmId)
      .order(
        "mortality_date",
        { ascending: false }
      )
      .order(
        "created_at",
        { ascending: false }
      );

  if (error) throw error;

  return data;
}

export async function getTotalMortality(
  farmId: string
) {
  const { data, error } =
    await supabase
      .from("mortality")
      .select("quantity")
      .eq("farm_id", farmId);

  if (error) throw error;

  return (
    data?.reduce(
      (sum, row) =>
        sum + row.quantity,
      0
    ) || 0
  );
}

export async function getFlockMortality(
  flockId: string
) {
  const { data, error } =
    await supabase
      .from("mortality")
      .select("quantity")
      .eq("flock_id", flockId);

  if (error) throw error;

  return (
    data?.reduce(
      (sum, row) =>
        sum + row.quantity,
      0
    ) || 0
  );
}

export async function updateMortality(
  id: string,
  updates: MortalityUpdateInput
) {
  /*
   * Get the current authenticated Supabase session.
   *
   * The server-side mortality API authenticates the
   * request using the user's Supabase access token.
   */
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session?.access_token) {
    throw new Error(
      "Unable to authenticate mortality update."
    );
  }

  /*
   * Send the update to the server-side route.
   *
   * The server route is responsible for:
   * - authenticating the user
   * - validating farm ownership
   * - checking governance permissions
   * - updating the mortality record
   * - writing the audit log using supabaseAdmin
   */
  const response = await fetch(
    `/api/mortality/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        ...updates,
        farm_id:
          updates.farm_id,
      }),
    }
  );

  const result =
    await response.json();

  if (
    !response.ok ||
    !result.success
  ) {
    throw new Error(
      result.error ||
        "Unable to update mortality record"
    );
  }

  return result.mortality;
}