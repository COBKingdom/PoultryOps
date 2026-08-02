const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pycnrvctqemiysjxbafd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5Y25ydmN0cWVtaXlzanhiYWZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDkzMzIwNSwiZXhwIjoyMDk2NTA5MjA1fQ.E-PeL4S9zxCsHpmev_V-Bj8S7DJaw60Wk5uA78pI_5Y';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyConstraint() {
  try {
    console.log('=== Testing farm_users_role_check constraint ===\n');

    // Test 1: Try to insert a valid role 'owner'
    console.log('Test 1: Attempting to insert farm_user with role "owner"...');
    const { data: validOwner, error: ownerError } = await supabase
      .from('farm_users')
      .insert({ 
        user_id: '00000000-0000-0000-0000-000000000000',
        farm_id: '00000000-0000-0000-0000-000000000000',
        role: 'owner'
      })
      .select();

    if (ownerError) {
      console.log('❌ FAILED: Could not insert owner role -', ownerError.message);
    } else {
      console.log('✓ SUCCESS: owner role is allowed');
      // Clean up
      if (validOwner && validOwner[0]) {
        await supabase.from('farm_users').delete().eq('id', validOwner[0].id);
      }
    }

    // Test 2: Try to insert a valid role 'manager'
    console.log('\nTest 2: Attempting to insert farm_user with role "manager"...');
    const { data: validManager, error: managerError } = await supabase
      .from('farm_users')
      .insert({ 
        user_id: '00000000-0000-0000-0000-000000000001',
        farm_id: '00000000-0000-0000-0000-000000000000',
        role: 'manager'
      })
      .select();

    if (managerError) {
      console.log('❌ FAILED: Could not insert manager role -', managerError.message);
    } else {
      console.log('✓ SUCCESS: manager role is allowed');
      // Clean up
      if (validManager && validManager[0]) {
        await supabase.from('farm_users').delete().eq('id', validManager[0].id);
      }
    }

    // Test 3: Try to insert a valid role 'staff'
    console.log('\nTest 3: Attempting to insert farm_user with role "staff"...');
    const { data: validStaff, error: staffError } = await supabase
      .from('farm_users')
      .insert({ 
        user_id: '00000000-0000-0000-0000-000000000002',
        farm_id: '00000000-0000-0000-0000-000000000000',
        role: 'staff'
      })
      .select();

    if (staffError) {
      console.log('❌ FAILED: Could not insert staff role -', staffError.message);
    } else {
      console.log('✓ SUCCESS: staff role is allowed');
      // Clean up
      if (validStaff && validStaff[0]) {
        await supabase.from('farm_users').delete().eq('id', validStaff[0].id);
      }
    }

    // Test 4: Try to insert an invalid role 'data_entry' (should fail)
    console.log('\nTest 4: Attempting to insert farm_user with role "data_entry" (should be rejected)...');
    const { data: invalidData, error: dataEntryError } = await supabase
      .from('farm_users')
      .insert({ 
        user_id: '00000000-0000-0000-0000-000000000003',
        farm_id: '00000000-0000-0000-0000-000000000000',
        role: 'data_entry'
      })
      .select();

    if (dataEntryError) {
      console.log('✓ SUCCESS: data_entry role is correctly rejected -', dataEntryError.message);
    } else {
      console.log('❌ FAILED: data_entry role was allowed (constraint not working!)');
      // Clean up
      if (invalidData && invalidData[0]) {
        await supabase.from('farm_users').delete().eq('id', invalidData[0].id);
      }
    }

    // Test 5: Try to insert an invalid role 'admin' (should fail)
    console.log('\nTest 5: Attempting to insert farm_user with role "admin" (should be rejected)...');
    const { data: invalidAdmin, error: adminError } = await supabase
      .from('farm_users')
      .insert({ 
        user_id: '00000000-0000-0000-0000-000000000004',
        farm_id: '00000000-0000-0000-0000-000000000000',
        role: 'admin'
      })
      .select();

    if (adminError) {
      console.log('✓ SUCCESS: admin role is correctly rejected -', adminError.message);
    } else {
      console.log('❌ FAILED: admin role was allowed (constraint not working!)');
      // Clean up
      if (invalidAdmin && invalidAdmin[0]) {
        await supabase.from('farm_users').delete().eq('id', invalidAdmin[0].id);
      }
    }

    console.log('\n=== Constraint verification complete ===');
  } catch (error) {
    console.error('Error during verification:', error);
  }
}

verifyConstraint();