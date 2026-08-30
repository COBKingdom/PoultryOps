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
  profile: any | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext =
  createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    refreshProfile: async () => {},
  });

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [profile, setProfile] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  /*
   * Load the current user's profile.
   *
   * This is kept separate from the Supabase
   * auth state-change callback so that profile
   * queries do not run directly inside
   * onAuthStateChange().
   */
  const loadProfile = async (
    authUser: User | null
  ) => {
    if (!authUser) {
      setProfile(null);
      return;
    }

    try {
      const {
        data: profile,
        error,
      } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) {
        console.error(
          "Error loading profile:",
          error
        );

        setProfile(null);
        return;
      }

      setProfile(profile);
    } catch (error) {
      console.error(
        "Error loading profile:",
        error
      );

      setProfile(null);
    }
  };

  /*
   * Public profile refresh function.
   *
   * Existing PoultryOps code can continue
   * calling refreshProfile() without needing
   * to know anything about the auth lifecycle.
   */
  const refreshProfile = async () => {
    try {
      const {
        data: { user: currentUser },
      } =
        await supabase.auth.getUser();

      if (!currentUser) {
        setProfile(null);
        return;
      }

      await loadProfile(
        currentUser
      );
    } catch (error) {
      console.error(
        "Error refreshing profile:",
        error
      );
    }
  };

  useEffect(() => {
    let mounted = true;

    /*
     * Initial authentication check.
     *
     * This establishes the initial user and
     * profile state when the application loads.
     */
    async function loadUser() {
      try {
        const {
          data: { user: currentUser },
          error,
        } =
          await supabase.auth.getUser();

        if (error) {
          throw error;
        }

        if (!mounted) return;

        setUser(
          currentUser ?? null
        );

        if (currentUser) {
          /*
           * Load the profile separately from
           * the authentication listener.
           */
          await loadProfile(
            currentUser
          );
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error(
          "Error loading authenticated user:",
          error
        );

        if (!mounted) return;

        setUser(null);
        setProfile(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadUser();

    /*
     * Authentication state listener.
     *
     * IMPORTANT:
     *
     * We do NOT await Supabase database queries
     * inside this callback.
     *
     * The callback only updates authentication
     * state. Profile loading is deferred so that
     * authentication state changes are not blocked
     * by another Supabase request.
     */
    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          const authUser =
            session?.user ?? null;

          if (!mounted) return;

          setUser(authUser);

          if (!authUser) {
            setProfile(null);
            return;
          }

          /*
           * Defer profile loading until after
           * the auth-state callback has returned.
           *
           * This avoids making an awaited Supabase
           * request directly inside
           * onAuthStateChange().
           */
          setTimeout(() => {
            if (!mounted) return;

            loadProfile(
              authUser
            ).catch((error) => {
              console.error(
                "Error loading profile after auth change:",
                error
              );
            });
          }, 0);
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(
    AuthContext
  );
}

/*
 * Standalone profile refresh helper.
 *
 * Kept for compatibility with existing
 * PoultryOps code that imports refreshProfile
 * directly rather than using useAuth().
 */
export async function refreshProfile() {
  try {
    const {
      data: { user: currentUser },
    } =
      await supabase.auth.getUser();

    if (!currentUser) {
      return null;
    }

    const {
      data: profile,
      error,
    } =
      await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

    if (error) {
      console.error(
        "Error refreshing profile:",
        error
      );

      return null;
    }

    return profile;
  } catch (error) {
    console.error(
      "Error refreshing profile:",
      error
    );

    return null;
  }
}