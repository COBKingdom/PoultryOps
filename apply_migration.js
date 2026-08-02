const https = require('https');

const supabaseUrl = 'https://pycnrvctqemiysjxbafd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5Y25ydmN0cWVtaXlzanhiYWZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDkzMzIwNSwiZXhwIjoyMDk2NTA5MjA1fQ.E-PeL4S9zxCsHpmev_V-Bj8S7DJaw60Wk5uA78pI_5Y';
const projectId = 'pycnrvctqemiysjxbafd';

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

function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });

    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${projectId}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(result);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function applyMigration() {
  try {
    console.log('Applying migration...');
    
    const result = await executeSQL(migrationSQL);

    console.log('Migration applied successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error applying migration:', error.message);
    process.exit(1);
  }
}

applyMigration();