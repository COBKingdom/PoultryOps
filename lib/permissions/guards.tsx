"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { usePermissions } from "./provider";
import { PermissionCode } from "./constants";

interface PermissionGuardProps {
  permission: PermissionCode;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * PermissionGuard - Conditionally renders children based on permission
 * 
 * @example
 * <PermissionGuard permission={PERMISSIONS.SALES_CREATE}>
 *   <Button>Record Sale</Button>
 * </PermissionGuard>
 */
export function PermissionGuard({ 
  permission, 
  children, 
  fallback = null 
}: PermissionGuardProps) {
  const { can, loading } = usePermissions();

  if (loading) {
    return null;
  }

  if (!can(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface AnyPermissionGuardProps {
  permissions: PermissionCode[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * PermissionGuard with any() - Renders if user has ANY of the specified permissions
 */
export function AnyPermissionGuard({ 
  permissions, 
  children, 
  fallback = null 
}: AnyPermissionGuardProps) {
  const { canAny, loading } = usePermissions();

  if (loading) {
    return null;
  }

  if (!canAny(permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface AllPermissionGuardProps {
  permissions: PermissionCode[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * PermissionGuard with all() - Renders if user has ALL of the specified permissions
 */
export function AllPermissionGuard({ 
  permissions, 
  children, 
  fallback = null 
}: AllPermissionGuardProps) {
  const { canAll, loading } = usePermissions();

  if (loading) {
    return null;
  }

  if (!canAll(permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface PagePermissionProps {
  permission: PermissionCode;
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * PagePermission - Protects entire pages
 * Redirects unauthorized users or shows nothing
 * 
 * @example
 * <PagePermission permission={PERMISSIONS.REPORTS_VIEW}>
 *   <ReportsWorkspace />
 * </PagePermission>
 */
export function PagePermission({ 
  permission, 
  children, 
  redirectTo = "/flocks" 
}: PagePermissionProps) {
  const { can, loading, isOwner } = usePermissions();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !can(permission) && !isOwner) {
      router.replace(redirectTo);
    }
  }, [loading, can, permission, isOwner, router, redirectTo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!can(permission) && !isOwner) {
    return null;
  }

  return <>{children}</>;
}

interface OwnerOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * OwnerOnly - Legacy component for backward compatibility
 * Use PermissionGuard with PERMISSIONS instead for new code
 * 
 * @deprecated Use PermissionGuard with specific permissions instead
 */
export function OwnerOnly({ children, fallback = null }: OwnerOnlyProps) {
  const { isOwner, loading } = usePermissions();

  if (loading) {
    return null;
  }

  if (!isOwner) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}