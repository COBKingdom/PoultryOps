import { supabase } from "./supabase";

export async function signUp(
  email: string,
  password: string
) {
  return await supabase.auth.signUp({
    email,
    password,
  });
}

export async function signIn(
  email: string,
  password: string
) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signOutUser() {
  await supabase.auth.signOut();
}

export async function getUser() {
  const { data } =
    await supabase.auth.getUser();

  return data.user;
}