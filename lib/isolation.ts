import { supabase } from "@/lib/supabase";
import { createMortality } from "@/lib/mortality";

export type IsolationStatus =
  | "active"
  | "recovered"
  | "deceased"
  | "transferred"
  | "completed";

export type CreateIsolationInput = {
  farm_id: string;
  flock_id: string;
  isolation_date: string;
  quantity: number;
  reason: string;
  notes?: string;
};

export type IsolationUpdate = {
  returned_quantity?: number;
  deceased_quantity?: number;
  returned_date?: string | null;
  status?: IsolationStatus;
  notes?: string | null;
};

function getLocalDateString() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function createIsolation(
  isolation: CreateIsolationInput
) {
  const { data, error } =
    await supabase
      .from("isolation_records")
      .insert({
        farm_id: isolation.farm_id,
        flock_id: isolation.flock_id,
        isolation_date:
          isolation.isolation_date,
        quantity: Number(
          isolation.quantity
        ),
        reason: isolation.reason,
        status: "active",
        returned_quantity: 0,
        deceased_quantity: 0,
        notes:
          isolation.notes || null,
      })
      .select(`
        *,
        flocks (
          id,
          flock_name,
          bird_type
        )
      `)
      .single();

  if (error) throw error;

  return data;
}

export async function getIsolationRecords(
  farmId: string
) {
  const { data, error } =
    await supabase
      .from("isolation_records")
      .select(`
        *,
        flocks (
          id,
          flock_name,
          bird_type
        )
      `)
      .eq("farm_id", farmId)
      .order("isolation_date", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

  if (error) throw error;

  return data || [];
}

export async function getActiveIsolationByFlock(
  flockId: string
) {
  const { data, error } =
    await supabase
      .from("isolation_records")
      .select("*")
      .eq("flock_id", flockId)
      .eq("status", "active");

  if (error) throw error;

  return data || [];
}

/**
 * Returns the number of birds currently remaining
 * in isolation for one flock.
 *
 * Currently isolated =
 *   isolated quantity
 *   - returned birds
 *   - deceased birds
 */
export async function getIsolatedBirdCount(
  flockId: string
) {
  const records =
    await getActiveIsolationByFlock(
      flockId
    );

  return records.reduce(
    (sum, record) =>
      sum +
      Math.max(
        0,
        Number(
          record.quantity || 0
        ) -
          Number(
            record.returned_quantity ||
              0
          ) -
          Number(
            record.deceased_quantity ||
              0
          )
      ),
    0
  );
}

/**
 * Returns the total number of birds currently
 * in isolation across the entire farm.
 *
 * This is used by the flock/dashboard arithmetic.
 *
 * IMPORTANT:
 * Deceased birds are NOT included here because
 * they have already been recorded in Mortality.
 */
export async function getTotalActiveIsolatedBirds(
  farmId: string
) {
  const { data, error } =
    await supabase
      .from("isolation_records")
      .select(
        "quantity, returned_quantity, deceased_quantity, status"
      )
      .eq("farm_id", farmId)
      .eq("status", "active");

  if (error) throw error;

  return (
    data?.reduce(
      (sum, record) => {
        const quantity =
          Number(
            record.quantity || 0
          );

        const returned =
          Number(
            record.returned_quantity ||
              0
          );

        const deceased =
          Number(
            record.deceased_quantity ||
              0
          );

        const remaining =
          Math.max(
            0,
            quantity -
              returned -
              deceased
          );

        return sum + remaining;
      },
      0
    ) || 0
  );
}

export async function updateIsolation(
  id: string,
  updates: IsolationUpdate
) {
  const {
    data: current,
    error: fetchError,
  } = await supabase
    .from("isolation_records")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  const totalQuantity =
    Number(current.quantity || 0);

  const returnedQuantity =
    Number(
      updates.returned_quantity ??
        current.returned_quantity ??
        0
    );

  const deceasedQuantity =
    Number(
      updates.deceased_quantity ??
        current.deceased_quantity ??
        0
    );

  if (
    returnedQuantity < 0 ||
    deceasedQuantity < 0
  ) {
    throw new Error(
      "Returned and deceased quantities cannot be negative."
    );
  }

  if (
    returnedQuantity +
      deceasedQuantity >
    totalQuantity
  ) {
    throw new Error(
      "The returned and deceased quantities cannot exceed the isolated quantity."
    );
  }

  const remaining =
    totalQuantity -
    returnedQuantity -
    deceasedQuantity;

  let status: IsolationStatus =
    updates.status ||
    current.status;

  if (remaining > 0) {
    status = "active";
  } else if (
    returnedQuantity > 0 &&
    deceasedQuantity === 0
  ) {
    status = "recovered";
  } else if (
    deceasedQuantity > 0 &&
    returnedQuantity === 0
  ) {
    status = "deceased";
  } else if (
    returnedQuantity > 0 &&
    deceasedQuantity > 0
  ) {
    status = "completed";
  }

  const { data, error } =
    await supabase
      .from("isolation_records")
      .update({
        returned_quantity:
          returnedQuantity,
        deceased_quantity:
          deceasedQuantity,
        returned_date:
          updates.returned_date ??
          current.returned_date ??
          null,
        status,
        notes:
          updates.notes ??
          current.notes ??
          null,
      })
      .eq("id", id)
      .select(`
        *,
        flocks (
          id,
          flock_name,
          bird_type
        )
      `)
      .single();

  if (error) throw error;

  return data;
}

export async function recordIsolationRecovery(
  id: string,
  quantity: number
) {
  const { data: current, error } =
    await supabase
      .from("isolation_records")
      .select("*")
      .eq("id", id)
      .single();

  if (error) throw error;

  const existingReturned =
    Number(
      current.returned_quantity || 0
    );

  const existingDeceased =
    Number(
      current.deceased_quantity || 0
    );

  const total =
    Number(current.quantity || 0);

  const remaining =
    total -
    existingReturned -
    existingDeceased;

  const recoveryQuantity =
    Number(quantity);

  if (
    !Number.isInteger(
      recoveryQuantity
    ) ||
    recoveryQuantity <= 0 ||
    recoveryQuantity > remaining
  ) {
    throw new Error(
      `Invalid recovery quantity. Please enter a whole number between 1 and ${remaining}.`
    );
  }

  return updateIsolation(id, {
    returned_quantity:
      existingReturned +
      recoveryQuantity,
    returned_date:
      getLocalDateString(),
  });
}

/**
 * Records birds that died while in isolation.
 *
 * The death is immediately recorded in the
 * normal Mortality table.
 *
 * The isolation record is then updated only as
 * an audit trail.
 *
 * The flock quantity itself is NOT changed.
 */
export async function recordIsolationDeath(
  id: string,
  quantity: number
) {
  const { data: current, error } =
    await supabase
      .from("isolation_records")
      .select(`
        *,
        flocks (
          id,
          flock_name,
          bird_type
        )
      `)
      .eq("id", id)
      .single();

  if (error) throw error;

  if (!current) {
    throw new Error(
      "Isolation record not found."
    );
  }

  const existingReturned =
    Number(
      current.returned_quantity || 0
    );

  const existingDeceased =
    Number(
      current.deceased_quantity || 0
    );

  const total =
    Number(current.quantity || 0);

  const remaining =
    total -
    existingReturned -
    existingDeceased;

  const deathQuantity =
    Number(quantity);

  if (
    !Number.isInteger(
      deathQuantity
    ) ||
    deathQuantity <= 0 ||
    deathQuantity > remaining
  ) {
    throw new Error(
      `Invalid deceased quantity. Please enter a whole number between 1 and ${remaining}.`
    );
  }

  if (!current.farm_id) {
    throw new Error(
      "Isolation record is missing its farm."
    );
  }

  if (!current.flock_id) {
    throw new Error(
      "Isolation record is missing its flock."
    );
  }

  /*
   * Create the normal mortality record.
   *
   * This is the official accounting event.
   */
  await createMortality({
    farm_id: current.farm_id,
    flock_id: current.flock_id,
    mortality_date:
      getLocalDateString(),
    quantity: deathQuantity,
    reason: `Isolation - ${
      current.reason ||
      "Bird died in isolation"
    }`,
  });

  /*
   * Update isolation only for audit purposes.
   */
  return updateIsolation(id, {
    deceased_quantity:
      existingDeceased +
      deathQuantity,
  });
}

export async function getTotalIsolationBirds(
  farmId: string
) {
  return getTotalActiveIsolatedBirds(
    farmId
  );
}