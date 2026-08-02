const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pycnrvctqemiysjxbafd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5Y25ydmN0cWVtaXlzanhiYWZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDkzMzIwNSwiZXhwIjoyMDk2NTA5MjA1fQ.E-PeL4S9zxCsHpmev_V-Bj8S7DJaw60Wk5uA78pI_5Y';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAllTables() {
  const tables = ['farm_users', 'profiles', 'user_permissions', 'user_invitations'];
  
  for (const table of tables) {
    try {
      console.log(`\nChecking ${table} table...`);
      
      // Try to query the table to see if it exists and check for data_entry
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`  Table error: ${error.message}`);
        continue;
      }

      // Now check specifically for data_entry
      const { data: dataEntryRows, error: dataEntryError } = await supabase
        .from(table)
        .select('count')
        .eq('role', 'data_entry');

      if (dataEntryError) {
        // Table might not have a role column
        console.log(`  Table exists but may not have 'role' column: ${dataEntryError.message}`);
      } else {
        console.log(`  data_entry count: ${dataEntryRows?.[0]?.count || 0}`);
      }

      // Get all distinct roles if possible
      const { data: allRoles, error: rolesError } = await supabase
        .from(table)
        .select('role');

      if (!rolesError && allRoles) {
        const distinctRoles = [...new Set(allRoles.map(r => r.role).filter(Boolean))];
        console.log(`  All distinct roles found: ${distinctRoles.join(', ') || 'none'}`);
      }

    } catch (error) {
      console.log(`  Error checking ${table}: ${error.message}`);
    }
  }
}

checkAllTables();