-- =====================================================
-- PoultryOps
-- Migration 002
-- Enterprise Permission Foundation
-- =====================================================

-- Create extension for UUID generation if not exists
create extension if not exists pgcrypto;

-- =====================================================
-- PERMISSIONS TABLE
-- =====================================================
create table if not exists public.permissions (
    id uuid primary key default gen_random_uuid(),
    code text unique not null,
    name text not null,
    description text,
    category text not null,
    created_at timestamptz not null default now()
);

-- Indexes for permissions
create index if not exists idx_permissions_code on public.permissions(code);
create index if not exists idx_permissions_category on public.permissions(category);

-- =====================================================
-- USER_PERMISSIONS TABLE
-- =====================================================
create table if not exists public.user_permissions (
    user_id uuid not null
        references public.profiles(id)
        on delete cascade,
    permission_id uuid not null
        references public.permissions(id)
        on delete cascade,
    granted boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (user_id, permission_id)
);

-- Indexes for user_permissions
create index if not exists idx_user_permissions_user_id on public.user_permissions(user_id);
create index if not exists idx_user_permissions_permission_id on public.user_permissions(permission_id);
create index if not exists idx_user_permissions_granted on public.user_permissions(granted);

-- =====================================================
-- ROLE_TEMPLATES TABLE
-- =====================================================
create table if not exists public.role_templates (
    id uuid primary key default gen_random_uuid(),
    role text unique not null,
    name text not null,
    description text,
    is_system boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Index for role_templates
create index if not exists idx_role_templates_role on public.role_templates(role);

-- =====================================================
-- ROLE_TEMPLATE_PERMISSIONS TABLE
-- =====================================================
create table if not exists public.role_template_permissions (
    role_template_id uuid not null
        references public.role_templates(id)
        on delete cascade,
    permission_id uuid not null
        references public.permissions(id)
        on delete cascade,
    created_at timestamptz not null default now(),
    primary key (role_template_id, permission_id)
);

-- Indexes for role_template_permissions
create index if not exists idx_role_template_permissions_role_id 
    on public.role_template_permissions(role_template_id);
create index if not exists idx_role_template_permissions_permission_id 
    on public.role_template_permissions(permission_id);

-- =====================================================
-- AUDIT_LOGS TABLE
-- =====================================================
create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid
        references public.profiles(id)
        on delete set null,
    action text not null,
    resource_type text,
    resource_id uuid,
    old_values jsonb,
    new_values jsonb,
    metadata jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz not null default now()
);

-- Indexes for audit_logs
create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);
create index if not exists idx_audit_logs_action on public.audit_logs(action);
create index if not exists idx_audit_logs_resource_type on public.audit_logs(resource_type);
create index if not exists idx_audit_logs_resource_id on public.audit_logs(resource_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at);

-- =====================================================
-- SEED PERMISSIONS
-- =====================================================

-- Dashboard
insert into public.permissions (code, name, description, category) values
('dashboard.view', 'View Dashboard', 'Access to view the main dashboard', 'Dashboard'),
('dashboard.export', 'Export Dashboard', 'Export dashboard data and reports', 'Dashboard')
on conflict (code) do nothing;

-- Flocks
insert into public.permissions (code, name, description, category) values
('flocks.view', 'View Flocks', 'View flock information and details', 'Flocks'),
('flocks.create', 'Create Flocks', 'Create new flock records', 'Flocks'),
('flocks.edit', 'Edit Flocks', 'Edit existing flock information', 'Flocks'),
('flocks.delete', 'Delete Flocks', 'Delete flock records', 'Flocks'),
('flocks.archive', 'Archive Flocks', 'Archive flock records', 'Flocks')
on conflict (code) do nothing;

-- Egg Production
insert into public.permissions (code, name, description, category) values
('eggs.view', 'View Egg Production', 'View egg production records', 'Egg Production'),
('eggs.create', 'Create Egg Production', 'Create new egg production records', 'Egg Production'),
('eggs.edit', 'Edit Egg Production', 'Edit egg production records', 'Egg Production'),
('eggs.delete', 'Delete Egg Production', 'Delete egg production records', 'Egg Production')
on conflict (code) do nothing;

-- Feed
insert into public.permissions (code, name, description, category) values
('feed.view', 'View Feed', 'View feed management information', 'Feed'),
('feed.create', 'Create Feed', 'Create new feed records', 'Feed'),
('feed.edit', 'Edit Feed', 'Edit feed records', 'Feed'),
('feed.delete', 'Delete Feed', 'Delete feed records', 'Feed')
on conflict (code) do nothing;

-- Feed Inventory
insert into public.permissions (code, name, description, category) values
('feed_inventory.view', 'View Feed Inventory', 'View feed inventory levels', 'Feed Inventory'),
('feed_inventory.create', 'Create Feed Inventory', 'Add new feed inventory records', 'Feed Inventory'),
('feed_inventory.edit', 'Edit Feed Inventory', 'Edit feed inventory records', 'Feed Inventory'),
('feed_inventory.delete', 'Delete Feed Inventory', 'Delete feed inventory records', 'Feed Inventory')
on conflict (code) do nothing;

-- Health
insert into public.permissions (code, name, description, category) values
('health.view', 'View Health Records', 'View health and vaccination records', 'Health'),
('health.create', 'Create Health Records', 'Create new health records', 'Health'),
('health.edit', 'Edit Health Records', 'Edit health records', 'Health'),
('health.delete', 'Delete Health Records', 'Delete health records', 'Health')
on conflict (code) do nothing;

-- Mortality
insert into public.permissions (code, name, description, category) values
('mortality.view', 'View Mortality Records', 'View mortality records', 'Mortality'),
('mortality.create', 'Create Mortality Records', 'Create new mortality records', 'Mortality'),
('mortality.edit', 'Edit Mortality Records', 'Edit mortality records', 'Mortality'),
('mortality.delete', 'Delete Mortality Records', 'Delete mortality records', 'Mortality')
on conflict (code) do nothing;

-- Sales
insert into public.permissions (code, name, description, category) values
('sales.view', 'View Sales', 'View sales records', 'Sales'),
('sales.create', 'Create Sales', 'Create new sales records', 'Sales'),
('sales.edit', 'Edit Sales', 'Edit sales records', 'Sales'),
('sales.delete', 'Delete Sales', 'Delete sales records', 'Sales')
on conflict (code) do nothing;

-- Expenses
insert into public.permissions (code, name, description, category) values
('expenses.view', 'View Expenses', 'View expense records', 'Expenses'),
('expenses.create', 'Create Expenses', 'Create new expense records', 'Expenses'),
('expenses.edit', 'Edit Expenses', 'Edit expense records', 'Expenses'),
('expenses.delete', 'Delete Expenses', 'Delete expense records', 'Expenses')
on conflict (code) do nothing;

-- Reports
insert into public.permissions (code, name, description, category) values
('reports.view', 'View Reports', 'View and access reports', 'Reports'),
('reports.export', 'Export Reports', 'Export reports to various formats', 'Reports')
on conflict (code) do nothing;

-- Analytics
insert into public.permissions (code, name, description, category) values
('analytics.view', 'View Analytics', 'View analytics and insights', 'Analytics'),
('analytics.export', 'Export Analytics', 'Export analytics data', 'Analytics')
on conflict (code) do nothing;

-- Migration
insert into public.permissions (code, name, description, category) values
('migration.view', 'View Migration', 'View migration status and history', 'Migration'),
('migration.execute', 'Execute Migration', 'Execute data migrations', 'Migration'),
('migration.manage', 'Manage Migration', 'Full migration management access', 'Migration')
on conflict (code) do nothing;

-- Team
insert into public.permissions (code, name, description, category) values
('team.view', 'View Team', 'View team members', 'Team'),
('team.invite', 'Invite Team Members', 'Send team invitations', 'Team'),
('team.edit', 'Edit Team', 'Edit team member information', 'Team'),
('team.remove', 'Remove Team Members', 'Remove team members', 'Team'),
('team.assign_roles', 'Assign Roles', 'Assign roles to team members', 'Team')
on conflict (code) do nothing;

-- Settings
insert into public.permissions (code, name, description, category) values
('settings.view', 'View Settings', 'View farm settings', 'Settings'),
('settings.edit', 'Edit Settings', 'Edit farm settings', 'Settings'),
('settings.manage_users', 'Manage Users', 'Manage user accounts and permissions', 'Settings')
on conflict (code) do nothing;

-- Subscription
insert into public.permissions (code, name, description, category) values
('subscription.view', 'View Subscription', 'View subscription details', 'Subscription'),
('subscription.manage', 'Manage Subscription', 'Manage subscription and billing', 'Subscription')
on conflict (code) do nothing;

-- Billing
insert into public.permissions (code, name, description, category) values
('billing.view', 'View Billing', 'View billing information', 'Billing'),
('billing.manage', 'Manage Billing', 'Manage billing and payments', 'Billing'),
('billing.export', 'Export Billing', 'Export billing data', 'Billing')
on conflict (code) do nothing;

-- =====================================================
-- SEED ROLE TEMPLATES
-- =====================================================

-- Manager role template
insert into public.role_templates (role, name, description, is_system) values
('manager', 'Manager', 'Farm manager with extensive access', true)
on conflict (role) do nothing;

-- Staff role template
insert into public.role_templates (role, name, description, is_system) values
('staff', 'Staff', 'Farm staff with basic operational access', true)
on conflict (role) do nothing;

-- =====================================================
-- SEED ROLE TEMPLATE PERMISSIONS
-- =====================================================

-- Manager permissions
insert into public.role_template_permissions (role_template_id, permission_id)
select 
    rt.id as role_template_id,
    p.id as permission_id
from public.role_templates rt
cross join public.permissions p
where rt.role = 'manager'
  and p.code in (
    -- Dashboard
    'dashboard.view', 'dashboard.export',
    -- Flocks
    'flocks.view', 'flocks.create', 'flocks.edit', 'flocks.archive',
    -- Egg Production
    'eggs.view', 'eggs.create', 'eggs.edit',
    -- Feed
    'feed.view', 'feed.create', 'feed.edit',
    -- Feed Inventory
    'feed_inventory.view', 'feed_inventory.create', 'feed_inventory.edit',
    -- Health
    'health.view', 'health.create', 'health.edit',
    -- Mortality
    'mortality.view', 'mortality.create', 'mortality.edit',
    -- Sales
    'sales.view', 'sales.create', 'sales.edit',
    -- Expenses
    'expenses.view', 'expenses.create', 'expenses.edit',
    -- Reports
    'reports.view', 'reports.export',
    -- Analytics
    'analytics.view', 'analytics.export',
    -- Team
    'team.view', 'team.invite', 'team.edit',
    -- Settings
    'settings.view', 'settings.edit'
  )
on conflict (role_template_id, permission_id) do nothing;

-- Staff permissions
insert into public.role_template_permissions (role_template_id, permission_id)
select 
    rt.id as role_template_id,
    p.id as permission_id
from public.role_templates rt
cross join public.permissions p
where rt.role = 'staff'
  and p.code in (
    -- Dashboard
    'dashboard.view',
    -- Flocks
    'flocks.view',
    -- Egg Production
    'eggs.view', 'eggs.create', 'eggs.edit',
    -- Feed
    'feed.view', 'feed.create', 'feed.edit',
    -- Feed Inventory
    'feed_inventory.view', 'feed_inventory.create', 'feed_inventory.edit',
    -- Health
    'health.view', 'health.create', 'health.edit',
    -- Mortality
    'mortality.view', 'mortality.create', 'mortality.edit',
    -- Sales
    'sales.view', 'sales.create', 'sales.edit',
    -- Expenses
    'expenses.view', 'expenses.create', 'expenses.edit'
  )
on conflict (role_template_id, permission_id) do nothing;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all new tables
alter table public.permissions enable row level security;
alter table public.user_permissions enable row level security;
alter table public.role_templates enable row level security;
alter table public.role_template_permissions enable row level security;
alter table public.audit_logs enable row level security;

-- Permissions: readable by all authenticated users
create policy "Permissions are readable by authenticated users"
    on public.permissions for select
    to authenticated
    using (true);

-- User Permissions: users can view their own permissions
create policy "Users can view their own permissions"
    on public.user_permissions for select
    to authenticated
    using (auth.uid() = user_id);

-- User Permissions: owners can manage all permissions
create policy "Owners can manage all user permissions"
    on public.user_permissions for all
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid()
            and role = 'owner'
        )
    );

-- Role Templates: readable by all authenticated users
create policy "Role templates are readable by authenticated users"
    on public.role_templates for select
    to authenticated
    using (true);

-- Role Template Permissions: readable by all authenticated users
create policy "Role template permissions are readable by authenticated users"
    on public.role_template_permissions for select
    to authenticated
    using (true);

-- Audit Logs: users can view their own audit logs
create policy "Users can view their own audit logs"
    on public.audit_logs for select
    to authenticated
    using (auth.uid() = user_id);

-- Audit Logs: owners can view all audit logs
create policy "Owners can view all audit logs"
    on public.audit_logs for select
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid()
            and role = 'owner'
        )
    );

-- =====================================================
-- COMMENTS
-- =====================================================

comment on table public.permissions is 'Stores all available permissions in the system';
comment on table public.user_permissions is 'Links users to their granted permissions';
comment on table public.role_templates is 'Stores role templates (manager, staff, etc.)';
comment on table public.role_template_permissions is 'Links role templates to their default permissions';
comment on table public.audit_logs is 'Stores audit trail for system actions';