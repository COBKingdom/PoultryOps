"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  PermissionCode,
  Role,
  ROLES,
} from "./constants";

interface PermissionContextValue {
  // Permission checks
  can: (permission: PermissionCode) => boolean;
  canAny: (permissions: PermissionCode[]) => boolean;
  canAll: (permissions: PermissionCode[]) => boolean;

  // Role checks
  hasRole: (role: Role) => boolean;
  isOwner: boolean;
  isManagerOrHigher: boolean;
  isStaffOrHigher: boolean;

  // Platform administration
  isPlatformAdmin: boolean;

  // State
  loading: boolean;
  error: Error | null;

  // Actions
  refreshPermissions: () => Promise<void>;
  getPermissions: () => PermissionCode[];
}

const PermissionContext =
  createContext<PermissionContextValue | null>(null);

export function usePermissions() {
  const context = useContext(PermissionContext);

  if (!context) {
    throw new Error(
      "usePermissions must be used within a PermissionProvider"
    );
  }

  return context;
}

interface PermissionProviderProps {
  children: React.ReactNode;
}

interface PermissionState {
  role: Role | null;
  permissions: Set<PermissionCode>;
  isPlatformAdmin: boolean;
  loading: boolean;
  error: Error | null;
}

export function PermissionProvider({
  children,
}: PermissionProviderProps) {
  const {
    user,
    profile,
    loading: authLoading,
  } = useAuth();

  const [state, setState] =
    useState<PermissionState>({
      role: null,
      permissions: new Set(),
      isPlatformAdmin: false,
      loading: true,
      error: null,
    });

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || !profile) {
      setState({
        role: null,
        permissions: new Set(),
        isPlatformAdmin: false,
        loading: false,
        error: null,
      });

      return;
    }

    const loadPermissions = async () => {
      try {
        setState((prev) => ({
          ...prev,
          loading: true,
          error: null,
        }));

        const {
          data: { session },
        } = await supabase.auth.getSession();

        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        if (session?.access_token) {
          headers.Authorization =
            `Bearer ${session.access_token}`;
        }

        const response = await fetch(
          "/api/permissions",
          {
            method: "GET",
            headers,
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load permissions: ${response.statusText}`
          );
        }

        const data = await response.json();

        setState({
          role: data.role,
          permissions: new Set(
            data.permissions || []
          ),
          isPlatformAdmin:
            Boolean(data.isPlatformAdmin),
          loading: false,
          error: null,
        });
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error(
                "Failed to load permissions"
              );

        setState((prev) => ({
          ...prev,
          loading: false,
          error,
        }));

        console.error(
          "Permission loading error:",
          error
        );
      }
    };

    loadPermissions();
  }, [user, profile, authLoading]);

  const refreshPermissions =
    useCallback(async () => {
      if (!user || !profile) {
        return;
      }

      try {
        setState((prev) => ({
          ...prev,
          loading: true,
          error: null,
        }));

        const {
          data: { session },
        } = await supabase.auth.getSession();

        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        if (session?.access_token) {
          headers.Authorization =
            `Bearer ${session.access_token}`;
        }

        const response = await fetch(
          "/api/permissions",
          {
            method: "GET",
            headers,
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to refresh permissions: ${response.statusText}`
          );
        }

        const data = await response.json();

        setState({
          role: data.role,
          permissions: new Set(
            data.permissions || []
          ),
          isPlatformAdmin:
            Boolean(data.isPlatformAdmin),
          loading: false,
          error: null,
        });
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error(
                "Failed to refresh permissions"
              );

        setState((prev) => ({
          ...prev,
          loading: false,
          error,
        }));

        console.error(
          "Permission refresh error:",
          error
        );
      }
    }, [user, profile]);

  const can = useCallback(
    (permission: PermissionCode): boolean => {
      if (!state.role) {
        return false;
      }

      if (state.role === ROLES.OWNER) {
        return true;
      }

      return state.permissions.has(permission);
    },
    [state.role, state.permissions]
  );

  const canAny = useCallback(
    (
      permissions: PermissionCode[]
    ): boolean => {
      if (!state.role) {
        return false;
      }

      if (state.role === ROLES.OWNER) {
        return true;
      }

      return permissions.some((permission) =>
        state.permissions.has(permission)
      );
    },
    [state.role, state.permissions]
  );

  const canAll = useCallback(
    (
      permissions: PermissionCode[]
    ): boolean => {
      if (!state.role) {
        return false;
      }

      if (state.role === ROLES.OWNER) {
        return true;
      }

      return permissions.every((permission) =>
        state.permissions.has(permission)
      );
    },
    [state.role, state.permissions]
  );

  const hasRole = useCallback(
    (role: Role): boolean => {
      return state.role === role;
    },
    [state.role]
  );

  const isOwner =
    state.role === ROLES.OWNER;

  const isManagerOrHigher =
    state.role === ROLES.OWNER ||
    state.role === ROLES.MANAGER;

  const isStaffOrHigher =
    state.role === ROLES.OWNER ||
    state.role === ROLES.MANAGER ||
    state.role === ROLES.STAFF;

  const getPermissions =
    useCallback((): PermissionCode[] => {
      return Array.from(state.permissions);
    }, [state.permissions]);

  const value: PermissionContextValue = {
    can,
    canAny,
    canAll,
    hasRole,
    isOwner,
    isManagerOrHigher,
    isStaffOrHigher,
    isPlatformAdmin:
      state.isPlatformAdmin,
    loading:
      state.loading || authLoading,
    error: state.error,
    refreshPermissions,
    getPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}