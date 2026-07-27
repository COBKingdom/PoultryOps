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

// ── Server-Side Authentication ─────────────────────────────────────────

/**
 * Verify the Supabase access token supplied by the PoultryOps browser
 * session and derive the user's authorised farm from their profile.
 *
 * Security:
 * - The access token is verified server-side with Supabase Auth.
 * - farm_id is NEVER accepted from the request body or browser state.
 * - The authorised farm is derived from the authenticated user's profile.
 */
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
 * Normalize flock names for comparison.
 *
 * This is used only for matching.
 * It does NOT modify the flock name stored in the database.
 */
function normalizeFlockName(flockName: string): string {
  return String(flockName)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Resolve a flock by name, verifying that it belongs to the
 * authenticated user's authorised farm.
 */
export async function resolveFlock(
  flockName: string,
  authorisedFarmId: string,
): Promise<FlockInfo | null> {
  const normalizedRequestedName = normalizeFlockName(flockName);

  const { data, error } = await supabaseAdmin
    .from("flocks")
    .select("id, flock_name, bird_type, quantity")
    .eq("farm_id", authorisedFarmId);

  if (error || !data) {
    return null;
  }

  const flock = data.find(
    (item) =>
      normalizeFlockName(item.flock_name) === normalizedRequestedName,
  );

  if (!flock) {
    return null;
  }

  return {
    id: flock.id,
    flock_name: flock.flock_name,
    bird_type: flock.bird_type,
    quantity: flock.quantity,
  };
}

/**
 * Resolve a flock by ID, verifying that it belongs to the
 * authenticated user's authorised farm.
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
 * Get all flocks belonging to the authenticated user's
 * authorised farm.
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
 * Build a normalized flock-name → flock-ID map for the
 * authenticated user's authorised farm.
 *
 * Example:
 *
 * "Migration Test Layers A"
 *
 * becomes:
 *
 * "migration test layers a"
 *
 * The normalization is for matching only. The original flock name
 * remains unchanged in the database.
 */
export async function buildFlockMap(
  authorisedFarmId: string,
): Promise<Record<string, string>> {
  const flocks = await getFarmFlocks(authorisedFarmId);

  const map: Record<string, string> = {};

  for (const flock of flocks) {
    const normalizedFlockName = normalizeFlockName(flock.flock_name);

    if (normalizedFlockName) {
      map[normalizedFlockName] = flock.id;
    }
  }

  return map;
}