const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pycnrvctqemiysjxbafd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5Y25ydmN0cWVtaXlzanhiYWZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDkzMzIwNSwiZXhwIjoyMDk2NTA5MjA1fQ.E-PeL4S9zxCsHpmev_V-Bj8S7DJaw60Wk5uA78pI_5Y';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  try {
    console.log('Checking farm_users table for data_entry roles...');
    
    // Check for data_entry roles in farm_users
    const { data: farmUsers, error: farmUsersError } = await supabase
      .from('farm_users')
      .select('id, role')
      .eq('role', 'data_entry');

    if (farmUsersError) {
      console.error('Error checking farm_users:', farmUsersError);
    } else {
      console.log(`Found ${farmUsers?.length || 0} farm_users with data_entry role`);
      if (farmUsers && farmUsers.length > 0) {
        console.log('Sample:', farmUsers.slice(0, 5));
      }
    }

    // Check for data_entry roles in profiles
    console.log('\nChecking profiles table for data_entry roles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('role', 'data_entry');

    if (profilesError) {
      console.error('Error checking profiles:', profilesError);
    } else {
      console.log(`Found ${profiles?.length || 0} profiles with data_entry role`);
      if (profiles && profiles.length > 0) {
        console.log('Sample:', profiles.slice(0, 5));
      }
    }

    // Try to get constraint information using raw SQL
    console.log('\nTrying to check constraints...');
    const { data: constraints, error: constraintsError } = await supabase.rpc('exec_sql', {
      sql: "SELECT conname, pg_get_constraintdef(c.oid) FROM pg_constraint c WHERE conrelid = 'farm_users'::regclass AND conname LIKE '%role%';"
    });

    if (constraintsError) {
      console.log('Could not retrieve constraints (exec_sql may not exist):', constraintsError.message);
    } else {
      console.log('Constraints found:', constraints);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabase();