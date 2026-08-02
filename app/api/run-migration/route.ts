import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST() {
  try {
    const migrationSQL = `
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
    `;

    // Execute the SQL using the rpc function
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: (error as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}