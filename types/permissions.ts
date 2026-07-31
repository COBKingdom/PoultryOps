// Permission system database types

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  created_at: string;
}

export interface UserPermission {
  user_id: string;
  permission_id: string;
  granted: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleTemplate {
  id: string;
  role: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleTemplatePermission {
  role_template_id: string;
  permission_id: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  metadata: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Extended profile with permissions
export interface ProfileWithPermissions {
  id: string;
  email: string;
  full_name: string;
  role: "owner" | "manager" | "staff";
  farm_id: string;
  created_at: string;
  updated_at: string;
  // Permission fields
  permissions?: Permission[];
  user_permissions?: UserPermission[];
}

// Permission check result
export interface PermissionCheckResult {
  hasPermission: boolean;
  permissionCode: string;
  userId: string;
  source: "role_template" | "user_override" | "none";
}