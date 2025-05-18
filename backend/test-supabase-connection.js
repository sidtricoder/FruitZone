const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { Pool } = require('pg');

console.log('SCRIPT_START: test-supabase-connection.js');

async function testDatabase() {
  console.log('Testing database connection...');

  const connectionString = process.env.SUPABASE_DB_URL;
  console.log(`Loaded SUPABASE_DB_URL: ${connectionString}`);

  if (!connectionString) {
    console.error('ERROR: SUPABASE_DB_URL environment variable is not set!');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Attempting to connect to database...');
    const result = await pool.query('SELECT NOW() as time');
    console.log('✅ Connection successful!');
    console.log(`Server time: ${result.rows[0].time}`);

    console.log('\nChecking database tables...');
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

    console.log('Tables found:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

    console.log('\n✅ Database check completed successfully!');
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('Error stack:', error.stack);
    if (error.message.includes('ENOTFOUND')) {
      console.error('\nTROUBLESHOOTING:');
      console.error('1. Check if the hostname is correct in your SUPABASE_DB_URL');
      console.error('2. Verify that your network can reach the Supabase servers');
      console.error('3. Confirm that your Supabase project is still active');
    } else if (error.message.includes('password authentication')) {
      console.error('\nTROUBLESHOOTING:');
      console.error('1. Verify your database username and password in SUPABASE_DB_URL');
      console.error('2. Check if your database credentials have been reset recently');
    }
    throw error; // Re-throw to be caught by the main catch
  } finally {
    console.log('Closing database pool...');
    await pool.end();
    console.log('Database pool closed.');
  }
}

testDatabase()
  .then(() => {
    console.log('SCRIPT_SUCCESS: testDatabase function completed.');
    process.exit(0);
  })
  .catch(err => {
    console.error('SCRIPT_ERROR: Unhandled error in test script execution:', err.message);
    if (err.stack) {
      console.error('SCRIPT_ERROR_STACK:', err.stack);
    }
    process.exit(1);
  });

console.log('SCRIPT_END: test-supabase-connection.js reached end of synchronous execution.');
