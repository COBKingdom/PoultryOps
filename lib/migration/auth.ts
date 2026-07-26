/**
 * PoultryOps Migration — Server-Side Authentication & Farm Isolation
 *
 * Migration authentication uses the same Supabase session already used
 * by the PoultryOps client application.
 *
 * The browser sends its Supabase access token in the Authorization header.
 * The server verifies that token with Supabase Auth, then derives farm_id
 * from the authenticated user's profile.
 */
import { supabaseAdmin } from "@/lib/supabase-admin";

// ── Types ───────────────────────────────────────────────────────────────

export interface AuthContext {
  userId: string;
  userEmail: string | null;
  profile: {
    id: string;
    farm_id: string | null;
    role: string | null;
    full_name: string | null;
    email: string | null;
  } | null;
  authorisedFarmId: string | null;
}

export interface AuthError {
  error: string;
  status: number;
}

// ── Server-Side Auth ────────────────────────────────────────────────────

export async function getAuthContext(
  request: Request,
): Promise<AuthContext | AuthError> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      error: "Unauthorized: Missing authentication token",
      status: 401,
    };
  }

  const accessToken = authHeader.substring(7).trim();

  if (!accessToken) {
    return {
      error: "Unauthorized: Missing authentication token",
      status: 401,
    };
  }

  // Verify the browser's Supabase access token server-side.
  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !user) {
    return {
      error: "Unauthorized: Invalid or expired authentication session",
      status: 401,
    };
  }

  // Derive farm access from the verified user's profile.
  // farm_id is NEVER accepted from the browser.
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, farm_id, role, full_name, email")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      error: "Forbidden: No profile associated with user",
      status: 403,
    };
  }

  if (!profile.farm_id) {
    return {
      error: "Forbidden: No farm associated with user profile",
      status: 403,
    };
  }

  return {
    userId: user.id,
    userEmail: user.email ?? profile.email ?? null,
    profile: {
      id: profile.id,
      farm_id: profile.farm_id,
      role: profile.role,
      full_name: profile.full_name,
      email: profile.email,
    },
    authorisedFarmId: profile.farm_id,
  };
}

// ── Flock Isolation ─────────────────────────────────────────────────────

export interface FlockInfo {
  id: string;
  flock_name: string;
  bird_type: string;
  quantity: number;
}

/**
 * Resolve a flock by name, verifying it belongs to the authorised farm.
 *
 * This function NEVER trusts a client-supplied flock_id. It resolves
 * flocks by name within the authorised farm only.
 *
 * @param flockName - The flock name to resolve
 * @param authorisedFarmId - The server-derived farm ID
 * @returns FlockInfo or null if not found / not owned
 */
export async function resolveFlock(
  flockName: string,
  authorisedFarmId: string,
): Promise<FlockInfo | null> {
  const { data, error } = await supabaseAdmin
    .from("flocks")
    .select("id, flock_name, bird_type, quantity")
    .eq("farm_id", authorisedFarmId)
    .eq("flock_name", flockName)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    flock_name: data.flock_name,
    bird_type: data.bird_type,
    quantity: data.quantity,
  };
}

/**
 * Resolve a flock by ID, verifying it belongs to the authorised farm.
 *
 * This function verifies that the flock exists AND belongs to the
 * authorised farm. It does NOT trust the client-supplied flock_id
 * without this ownership check.
 *
 * @param flockId - The flock ID to verify
 * @param authorisedFarmId - The server-derived farm ID
 * @returns FlockInfo or null if not found / not owned
 */
export async function resolveFlockById(
  flockId: string,
  authorisedFarmId: string,
): Promise<FlockInfo | null> {
  const { data, error } = await supabaseAdmin
    .from("flocks")
    .select("id, flock_name, bird_type, quantity")
    .eq("farm_id", authorisedFarmId)
    .eq("id", flockId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    flock_name: data.flock_name,
    bird_type: data.bird_type,
    quantity: data.quantity,
  };
}

/**
 * Get all flocks belonging to the authorised farm.
 *
 * Used by the parse/validate endpoint to build a flockMap for
 * flock resolution during validation.
 *
 * @param authorisedFarmId - The server-derived farm ID
 * @returns Array of FlockInfo
 */
export async function getFarmFlocks(
  authorisedFarmId: string,
): Promise<FlockInfo[]> {
  const { data, error } = await supabaseAdmin
    .from("flocks")
    .select("id, flock_name, bird_type, quantity")
    .eq("farm_id", authorisedFarmId)
    .order("flock_name");

  if (error || !data) {
    return [];
  }

  return data.map((f) => ({
    id: f.id,
    flock_name: f.flock_name,
    bird_type: f.bird_type,
    quantity: f.quantity,
  }));
}

/**
 * Build a flock name → flock ID map for the authorised farm.
 *
 * Used by the validator to resolve flock_name references in
 * spreadsheet rows to actual flock IDs.
 *
 * @param authorisedFarmId - The server-derived farm ID
 * @returns Record mapping flock_name → flock_id
 */
export async function buildFlockMap(
  authorisedFarmId: string,
): Promise<Record<string, string>> {
  const flocks = await getFarmFlocks(authorisedFarmId);
const map: Record<string, string> = {};
for (const f of flocks) {
  map[f.flock_name] = f.id;
}
return map;
}
