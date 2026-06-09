"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

useEffect(() => {
  async function loadUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      console.log("AUTH USER:", user);
      console.log("AUTH ERROR:", error);

      setUser(user ?? null);

    } catch (err) {
      console.error(
        "AuthContext loadUser error:",
        err
      );

    } finally {
      setLoading(false);
    }
  }

  loadUser();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      console.log(
        "AUTH STATE:",
        session?.user?.email
      );

      setUser(
        session?.user ?? null
      );
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}