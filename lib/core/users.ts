import { supabase } from "@/lib/supabase";

export async function getFarmUsers(
  farmId: string
) {
  const { data, error } =
    await supabase
      .from("profiles")
      .select("*")
      .eq("farm_id", farmId)
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    console.error(error);
    throw error;
  }

  return data ?? [];
}

export async function inviteUser(
  farmId: string,
  email: string,
  role: string,
  invitedBy: string
) {
  // Route through the existing /api/team endpoint so the centralized
  // subscription user-limit check (checkUserLimit) is enforced.
  // This prevents pending invitations from bypassing the plan limits.
  const { data: { session } } = await supabase.auth.getSession();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch("/api/team", {
    method: "POST",
    headers,
    body: JSON.stringify({
      full_name: email.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      role,
      invitedBy,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to create invitation");
  }

  return result;
}

export async function getPendingInvitations(
  farmId: string
) {
  const { data, error } =
    await supabase
      .from("user_invitations")
      .select("*")
      .eq("farm_id", farmId)
      .eq("status", "pending")
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    console.error(error);
    throw error;
  }

  return data ?? [];
}

export async function cancelInvitation(
  invitationId: string
) {
  const { error } =
    await supabase
      .from("user_invitations")
      .delete()
      .eq("id", invitationId);

  if (error) {
    console.error(error);
    throw error;
  }

  return true;
}