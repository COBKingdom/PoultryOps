"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { permissionService } from "./service";
import { PermissionCode, Role } from "./constants";

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

export function PermissionProvider({ children }: PermissionProviderProps) {
  const { user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize permissions when user changes
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || !profile) {
      // No user, reset permission service
      permissionService.reset();
      setLoading(false);
      return;
    }

    // Initialize permission service with user data
    const initializePermissions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const role = profile.role as Role;
        await permissionService.initialize(user.id, role);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to initialize permissions");
        setError(error);
        console.error("Permission initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initializePermissions();
  }, [user, profile, authLoading]);

  // Refresh permissions
  const refreshPermissions = useCallback(async () => {
    if (!user || !profile) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await permissionService.refreshPermissions();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to refresh permissions");
      setError(error);
      console.error("Permission refresh error:", error);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  // Permission check functions
  const can = useCallback((permission: PermissionCode): boolean => {
    return permissionService.can(permission);
  }, []);

  const canAny = useCallback((permissions: PermissionCode[]): boolean => {
    return permissionService.canAny(permissions);
  }, []);

  const canAll = useCallback((permissions: PermissionCode[]): boolean => {
    return permissionService.canAll(permissions);
  }, []);

  // Role check functions
  const hasRole = useCallback((role: Role): boolean => {
    return permissionService.hasRole(role);
  }, []);

  const isOwner = permissionService.isOwner();
  const isManagerOrHigher = permissionService.isManagerOrHigher();
  const isStaffOrHigher = permissionService.isStaffOrHigher();

  // Get all permissions
  const getPermissions = useCallback((): PermissionCode[] => {
    return permissionService.getPermissions();
  }, []);

  // Context value
  const value: PermissionContextValue = {
    can,
    canAny,
    canAll,
    hasRole,
    isOwner,
    isManagerOrHigher,
    isStaffOrHigher,
    loading: loading || authLoading,
    error,
    refreshPermissions,
    getPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}