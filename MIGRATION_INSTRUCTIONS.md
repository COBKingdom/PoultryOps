# Migration Application Instructions

The migration needs to be applied through the Supabase Dashboard SQL Editor.

## Steps:

1. Go to your Supabase Dashboard: https://pycnrvctqemiysjxbafd.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy and paste the following SQL:

```sql
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
```

5. Click **Run** to execute the migration
6. You should see "Success. No rows returned"

## Verification

After running the migration, verify it worked by running this query:

```sql
SELECT conname, pg_get_constraintdef(c.oid) 
FROM pg_constraint c 
WHERE conrelid = 'farm_users'::regclass 
AND conname LIKE '%role%';
```

You should see the constraint with: `CHECK (role IN ('owner'::text, 'manager'::text, 'staff'::text))`

Also verify no data_entry roles remain:

```sql
SELECT COUNT(*) FROM farm_users WHERE role = 'data_entry';
SELECT COUNT(*) FROM profiles WHERE role = 'data_entry';
```

Both should return 0.