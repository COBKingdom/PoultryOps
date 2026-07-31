# Migration 002: Enterprise Permission Foundation

## Overview
This migration establishes the database foundation for PoultryOps' enterprise permission system. It creates the core tables, relationships, and seed data needed for a robust, data-driven permission system.

## What This Migration Does

### 1. Creates Four New Tables

#### `permissions`
Stores all available permissions in the system with metadata for organization and display.

**Columns:**
- `id` (UUID) - Primary key
- `code` (TEXT, UNIQUE) - Permission code (e.g., 'flocks.view', 'eggs.create')
- `name` (TEXT) - Human-readable permission name
- `description` (TEXT) - Detailed description of what the permission allows
- `category` (TEXT) - Permission category for grouping (e.g., 'Flocks', 'Egg Production')
- `created_at` (TIMESTAMPTZ) - Creation timestamp

#### `user_permissions`
Links users to their granted permissions, allowing for user-specific permission overrides.

**Columns:**
- `user_id` (UUID, FK to profiles.id) - The user
- `permission_id` (UUID, FK to permissions.id) - The permission
- `granted` (BOOLEAN) - Whether permission is granted (true) or denied (false)
- `created_at` (TIMESTAMPTZ) - When the permission was assigned
- `updated_at` (TIMESTAMPTZ) - When the permission was last modified

**Primary Key:** (user_id, permission_id)

#### `role_templates`
Stores role templates (Manager, Staff) that define default permission sets.

**Columns:**
- `id` (UUID) - Primary key
- `role` (TEXT, UNIQUE) - Role identifier ('manager', 'staff')
- `name` (TEXT) - Display name
- `description` (TEXT) - Role description
- `is_system` (BOOLEAN) - Whether this is a system role (cannot be deleted)
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

#### `role_template_permissions`
Links role templates to their default permissions (many-to-many).

**Columns:**
- `role_template_id` (UUID, FK to role_templates.id) - The role template
- `permission_id` (UUID, FK to permissions.id) - The permission
- `created_at` (TIMESTAMPTZ) - When the association was created

**Primary Key:** (role_template_id, permission_id)

#### `audit_logs`
Stores audit trail for system actions (for future use).

**Columns:**
- `id` (UUID) - Primary key
- `user_id` (UUID, FK to profiles.id) - User who performed the action
- `action` (TEXT) - Action performed (e.g., 'create', 'update', 'delete')
- `resource_type` (TEXT) - Type of resource affected (e.g., 'flock', 'egg_production')
- `resource_id` (UUID) - ID of the affected resource
- `old_values` (JSONB) - Previous values before change
- `new_values` (JSONB) - New values after change
- `metadata` (JSONB) - Additional context
- `ip_address` (TEXT) - User's IP address
- `user_agent` (TEXT) - User's browser/client info
- `created_at` (TIMESTAMPTZ) - When the action occurred

### 2. Seeds Permission Data

The migration seeds **60+ permissions** organized into 15 categories:

1. **Dashboard** (2 permissions)
   - dashboard.view, dashboard.export

2. **Flocks** (5 permissions)
   - flocks.view, flocks.create, flocks.edit, flocks.delete, flocks.archive

3. **Egg Production** (4 permissions)
   - eggs.view, eggs.create, eggs.edit, eggs.delete

4. **Feed** (4 permissions)
   - feed.view, feed.create, feed.edit, feed.delete

5. **Feed Inventory** (4 permissions)
   - feed_inventory.view, feed_inventory.create, feed_inventory.edit, feed_inventory.delete

6. **Health** (4 permissions)
   - health.view, health.create, health.edit, health.delete

7. **Mortality** (4 permissions)
   - mortality.view, mortality.create, mortality.edit, mortality.delete

8. **Sales** (4 permissions)
   - sales.view, sales.create, sales.edit, sales.delete

9. **Expenses** (4 permissions)
   - expenses.view, expenses.create, expenses.edit, expenses.delete

10. **Reports** (2 permissions)
    - reports.view, reports.export

11. **Analytics** (2 permissions)
    - analytics.view, analytics.export

12. **Migration** (3 permissions)
    - migration.view, migration.execute, migration.manage

13. **Team** (5 permissions)
    - team.view, team.invite, team.edit, team.remove, team.assign_roles

14. **Settings** (3 permissions)
    - settings.view, settings.edit, settings.manage_users

15. **Subscription** (2 permissions)
    - subscription.view, subscription.manage

16. **Billing** (3 permissions)
    - billing.view, billing.manage, billing.export

### 3. Seeds Role Templates

#### Manager Role
- **Name:** Manager
- **Description:** Farm manager with extensive access
- **Permissions:** 24 permissions including full CRUD on most modules, team management, and reporting

#### Staff Role
- **Name:** Staff
- **Description:** Farm staff with basic operational access
- **Permissions:** 18 permissions focused on data entry and viewing (no delete, no team management)

### 4. Implements Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

- **permissions:** Readable by all authenticated users
- **user_permissions:** Users can view their own; Owners can manage all
- **role_templates:** Readable by all authenticated users
- **role_template_permissions:** Readable by all authenticated users
- **audit_logs:** Users can view their own; Owners can view all

### 5. Creates Indexes

Performance-optimized indexes on:
- Foreign keys (user_id, permission_id, role_template_id)
- Frequently queried columns (code, category, role, action, resource_type, created_at)
- Boolean flags (granted)

## Migration Characteristics

### Reversible
The companion file `002_enterprise_permission_foundation_down.sql` drops all created objects in the correct order (policies → RLS → indexes → tables).

### Idempotent
- Uses `CREATE TABLE IF NOT EXISTS`
- Uses `CREATE INDEX IF NOT EXISTS`
- Uses `ON CONFLICT DO NOTHING` for seed data
- Safe to run multiple times

### Non-Breaking
- Does NOT modify any existing tables
- Does NOT modify authentication or authorization logic
- Does NOT change existing user roles or behavior
- All existing functionality continues to work unchanged

## What This Does NOT Do

- Does NOT integrate with the existing permission checking system yet
- Does NOT populate user_permissions for existing users
- Does NOT modify the hard-coded permission system in `lib/core/permissions.ts`
- Does NOT add any UI components
- Does NOT change any authorization logic

## Next Steps (Future Phases)

This migration sets the foundation for:
1. **Phase 2:** Permission Service implementation
2. **Phase 3:** Integration with existing authorization logic
3. **Phase 4:** UI for managing permissions
4. **Phase 5:** Migration from hard-coded to database-driven permissions

## Verification

After running this migration, verify:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('permissions', 'user_permissions', 'role_templates', 'role_template_permissions', 'audit_logs');

-- Check permissions were seeded
SELECT category, COUNT(*) as count 
FROM permissions 
GROUP BY category 
ORDER BY category;

-- Check role templates were created
SELECT role, name, is_system FROM role_templates;

-- Check role template permissions
SELECT rt.role, COUNT(rtp.permission_id) as permission_count
FROM role_templates rt
LEFT JOIN role_template_permissions rtp ON rt.id = rtp.role_template_id
GROUP BY rt.role;

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('permissions', 'user_permissions', 'role_templates', 'role_template_permissions', 'audit_logs');
```

## Rollback

To rollback this migration:

```bash
# Using Supabase CLI
supabase migration down

# Or manually execute the down migration
psql -f supabase/migrations/002_enterprise_permission_foundation_down.sql
```

## Notes

- The `profiles` table is referenced but not created in this migration (it's part of Supabase Auth)
- All foreign keys use `ON DELETE CASCADE` for child tables and `ON DELETE SET NULL` for audit_logs
- The `granted` boolean in user_permissions allows for both granting and denying specific permissions to users
- System role templates (is_system = true) should not be deleted or modified by the application