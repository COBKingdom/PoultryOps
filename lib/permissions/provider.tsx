"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { PermissionCode, Role, ROLES, ALL_PERMISSIONS } from "./constants";

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
  
  // State
  loading: boolean;
  error: Error | null;
  
  // Actions
  refreshPermissions: () => Promise<void>;
  getPermissions: () => PermissionCode[];
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function usePermissions() {
  const context = useContext(PermissionContext);
  
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  
  return context;
}

interface PermissionProviderProps {
  children: React.ReactNode;
}

interface PermissionState {
  role: Role | null;
  permissions: Set<PermissionCode>;
  loading: boolean;
  error: Error | null;
}

export function PermissionProvider({ children }: PermissionProviderProps) {
  const { user, profile, loading: authLoading } = useAuth();
  const [state, setState] = useState<PermissionState>({
    role: null,
    permissions: new Set(),
    loading: true,
    error: null,
  });

  // Load permissions from API
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || !profile) {
      // No user, reset state
      setState({
        role: null,
        permissions: new Set(),
        loading: false,
        error: null,
      });
      return;
    }

    // Load permissions from server
    const loadPermissions = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        // Get the current session to include JWT in Authorization header
        const { data: { session } } = await supabase.auth.getSession();
        
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
        
        const response = await fetch("/api/permissions", {
          method: "GET",
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to load permissions: ${response.statusText}`);
        }

        const data = await response.json();
        
        setState({
          role: data.role,
          permissions: new Set(data.permissions),
          loading: false,
          error: null,
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to load permissions");
        setState(prev => ({
          ...prev,
          loading: false,
          error,
        }));
        console.error("Permission loading error:", error);
      }
    };

    loadPermissions();
  }, [user, profile, authLoading]);

  // Refresh permissions
  const refreshPermissions = useCallback(async () => {
    if (!user || !profile) {
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Get the current session to include JWT in Authorization header
      const { data: { session } } = await supabase.auth.getSession();
      
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch("/api/permissions", {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh permissions: ${response.statusText}`);
      }

      const data = await response.json();
      
      setState({
        role: data.role,
        permissions: new Set(data.permissions),
        loading: false,
        error: null,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to refresh permissions");
      setState(prev => ({
        ...prev,
        loading: false,
        error,
      }));
      console.error("Permission refresh error:", error);
    }
  }, [user, profile]);

  // Permission check functions
  const can = useCallback((permission: PermissionCode): boolean => {
    if (!state.role) {
      return false;
    }

    // Owner has all permissions
    if (state.role === ROLES.OWNER) {
      return true;
    }

    return state.permissions.has(permission);
  }, [state.role, state.permissions]);

  const canAny = useCallback((permissions: PermissionCode[]): boolean => {
    if (!state.role) {
      return false;
    }

    // Owner has all permissions
    if (state.role === ROLES.OWNER) {
      return true;
    }

    return permissions.some(permission => state.permissions.has(permission));
  }, [state.role, state.permissions]);

  const canAll = useCallback((permissions: PermissionCode[]): boolean => {
    if (!state.role) {
      return false;
    }

    // Owner has all permissions
    if (state.role === ROLES.OWNER) {
      return true;
    }

    return permissions.every(permission => state.permissions.has(permission));
  }, [state.role, state.permissions]);

  // Role check functions
  const hasRole = useCallback((role: Role): boolean => {
    return state.role === role;
  }, [state.role]);

  const isOwner = state.role === ROLES.OWNER;
  const isManagerOrHigher = state.role === ROLES.OWNER || state.role === ROLES.MANAGER;
  const isStaffOrHigher = state.role === ROLES.OWNER || state.role === ROLES.MANAGER || state.role === ROLES.STAFF;

  // Get all permissions
  const getPermissions = useCallback((): PermissionCode[] => {
    return Array.from(state.permissions);
  }, [state.permissions]);

  // Context value
  const value: PermissionContextValue = {
    can,
    canAny,
    canAll,
    hasRole,
    isOwner,
    isManagerOrHigher,
    isStaffOrHigher,
    loading: state.loading || authLoading,
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