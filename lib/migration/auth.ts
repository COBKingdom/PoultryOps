/**
 * PoultryOps Migration — Server-Side Authentication & Farm Isolation
 *
 * Phase B: Establishes the authenticated user and authorised farm
 * server-side, without modifying the existing AuthContext architecture.
 *
 * Uses @supabase/ssr's createServerClient with request cookies to
 * establish the authenticated user. This is a standard Next.js App
 * Router pattern and does NOT change the existing client-side auth.
 *
 * The existing AuthContext (contexts/AuthContext.tsx) remains the
 * client-side auth provider. This module is server-side only.
 */

import { createServerClient } from "@supabase/ssr";
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

/**
 * Establish the authenticated user and authorised farm from request cookies.
 *
 * This function:
 * 1. Creates a server-side Supabase client using @supabase/ssr
 * 2. Calls getUser() to establish the authenticated user
 * 3. Queries the profiles table for the user's farm_id and role
 * 4. Returns the authorisedFarmId
 *
 * NEVER trusts farm_id from:
 * - request body
 * - query parameters
 * - uploaded spreadsheet
 * - browser state
 *
 * @param cookies - The cookies() function from next/headers
 * @returns AuthContext or AuthError
 */
export async function getAuthContext(
  cookies: () => Promise<any>,
): Promise<AuthContext | AuthError> {
  // Step 1: Resolve cookie store ONCE (Next.js 15+ async cookies API)
  const cookieStore = await cookies();

  // Step 2: Create server-side client using @supabase/ssr
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    },
  );

  // Step 3: Establish authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: "Unauthorized: No authenticated user",
      status: 401,
    };
  }

  // Step 3: Query profiles table for farm_id and role
  // Using supabaseAdmin (service role) to bypass RLS for profile lookup
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

  // Step 4: Derive authorisedFarmId server-side
  const authorisedFarmId = profile.farm_id;

  if (!authorisedFarmId) {
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
    authorisedFarmId,
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
