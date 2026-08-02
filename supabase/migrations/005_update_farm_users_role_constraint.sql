-- =====================================================
-- PoultryOps
-- Migration 005
-- Update farm_users role constraint
-- =====================================================

-- Drop the old constraint if it exists
ALTER TABLE farm_users
DROP CONSTRAINT IF EXISTS farm_users_role_check;

-- Add the new constraint with updated roles
ALTER TABLE farm_users
ADD CONSTRAINT farm_users_role_check 
  CHECK (role IN ('owner', 'manager', 'staff'));

-- Update any existing data_entry roles to staff
UPDATE farm_users
SET role = 'staff'
WHERE role = 'data_entry';

-- Also update in profiles table if it has a role column
UPDATE profiles
SET role = 'staff'
WHERE role = 'data_entry';