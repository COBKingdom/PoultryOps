/**
 * Edit Governance Foundation
 * 
 * Reusable governance entry point for Edit operations.
 * This module implements Edit governance rules for the application.
 * 
 * Usage:
 * ```typescript
 * import { canEdit } from '@/lib/permissions/governance';
 * 
 * const result = canEdit(user, record);
 * if (result.allowed) {
 *   // Proceed with edit
 * }
 * ```
 */

/**
 * User object for governance checks
 */
export interface GovernanceUser {
  id: string;
  email?: string;
  role?: string;
}

/**
 * Record object for governance checks
 */
export interface GovernanceRecord {
  id: string;
  [key: string]: any;
}

/**
 * Edit governance result
 */
export interface EditGovernanceResult {
  allowed: boolean;
  reason: string | null;
}

/**
 * Delete governance result
 */
export interface DeleteGovernanceResult {
  allowed: boolean;
  reason: string | null;
}

/**
 * Default Edit Window in hours
 * 
 * This constant defines the default time window during which Manager and Staff
 * can edit records after creation.
 * 
 * Future releases will make this configurable.
 */
const DEFAULT_EDIT_WINDOW_HOURS = 6;

/**
 * Check if a user can edit a record
 * 
 * Edit Governance Rules:
 * - Owner: Can edit at any time
 * - Manager: Can edit only within the Edit Window (6 hours from creation)
 * - Staff: Can edit only within the Edit Window (6 hours from creation)
 * 
 * IMPORTANT: This is an ADDITIONAL check, not a replacement for existing permission checks.
 * Existing permission checks (e.g., PERMISSIONS.FLOCK_EDIT) must continue to operate as before.
 * 
 * @param user - The user attempting to edit
 * @param record - The record being edited
 * @returns EditGovernanceResult with allowed flag and optional reason
 */
export function canEdit(
  user: GovernanceUser | null | undefined,
  record: GovernanceRecord | null | undefined
): EditGovernanceResult {
  // If no user or record, deny by default
  if (!user || !record) {
    return {
      allowed: false,
      reason: "Invalid user or record.",
    };
  }

  // Owner can always edit
  if (user.role === "owner") {
    return {
      allowed: true,
      reason: null,
    };
  }

  // For Manager and Staff, check the Edit Window
  if (user.role === "manager" || user.role === "staff") {
    // Check if record has a created_at timestamp
    if (!record.created_at) {
      return {
        allowed: false,
        reason: "The editing window has expired.",
      };
    }

    const createdAt = new Date(record.created_at);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation <= DEFAULT_EDIT_WINDOW_HOURS) {
      return {
        allowed: true,
        reason: null,
      };
    } else {
      return {
        allowed: false,
        reason: "The editing window has expired.",
      };
    }
  }

  // For any other role, deny by default
  return {
    allowed: false,
    reason: "The editing window has expired.",
  };
}

/**
 * Check if a user can delete a record
 * 
 * This is the foundation for Delete governance.
 * Currently returns { allowed: true } for all cases.
 * Future releases will add governance rules here.
 * 
 * IMPORTANT: This is an ADDITIONAL check, not a replacement for existing permission checks.
 * Existing permission checks (e.g., PERMISSIONS.FLOCK_DELETE) must continue to operate as before.
 * 
 * @param user - The user attempting to delete
 * @param record - The record being deleted
 * @returns DeleteGovernanceResult with allowed flag and reason
 */
export function canDelete(
  user: GovernanceUser | null | undefined,
  record: GovernanceRecord | null | undefined
): DeleteGovernanceResult {
  // Foundation implementation - always allow
  // Future governance rules will be added here without changing the signature
  return {
    allowed: true,
    reason: null,
  };
}
