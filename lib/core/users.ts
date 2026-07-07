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
  const { data, error } =
    await supabase
      .from("user_invitations")
      .insert({
        farm_id: farmId,
        email: email.trim().toLowerCase(),
        role,
        invited_by: invitedBy,
        status: "pending",
      })
      .select()
      .single();

  if (error) {
    console.error(error);
    throw error;
  }

  return data;
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