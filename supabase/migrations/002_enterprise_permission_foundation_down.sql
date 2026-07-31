-- =====================================================
-- PoultryOps
-- Migration 002 Down
-- Enterprise Permission Foundation
-- =====================================================

-- Drop policies first
drop policy if exists "Permissions are readable by authenticated users" on public.permissions;
drop policy if exists "Users can view their own permissions" on public.user_permissions;
drop policy if exists "Owners can manage all user permissions" on public.user_permissions;
drop policy if exists "Role templates are readable by authenticated users" on public.role_templates;
drop policy if exists "Role template permissions are readable by authenticated users" on public.role_template_permissions;
drop policy if exists "Users can view their own audit logs" on public.audit_logs;
drop policy if exists "Owners can view all audit logs" on public.audit_logs;

-- Disable RLS
alter table public.permissions disable row level security;
alter table public.user_permissions disable row level security;
alter table public.role_templates disable row level security;
alter table public.role_template_permissions disable row level security;
alter table public.audit_logs disable row level security;

-- Drop indexes
drop index if exists public.idx_permissions_code;
drop index if exists public.idx_permissions_category;
drop index if exists public.idx_user_permissions_user_id;
drop index if exists public.idx_user_permissions_permission_id;
drop index if exists public.idx_user_permissions_granted;
drop index if exists public.idx_role_templates_role;
drop index if exists public.idx_role_template_permissions_role_id;
drop index if exists public.idx_role_template_permissions_permission_id;
drop index if exists public.idx_audit_logs_user_id;
drop index if exists public.idx_audit_logs_action;
drop index if exists public.idx_audit_logs_resource_type;
drop index if exists public.idx_audit_logs_resource_id;
drop index if exists public.idx_audit_logs_created_at;

-- Drop tables (in reverse order due to foreign keys)
drop table if exists public.audit_logs cascade;
drop table if exists public.role_template_permissions cascade;
drop table if exists public.role_templates cascade;
drop table if exists public.user_permissions cascade;
drop table if exists public.permissions cascade;