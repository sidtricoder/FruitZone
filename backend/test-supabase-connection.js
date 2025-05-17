// Database health check script
// This will test the connection to Supabase directly

const { Pool } = require('pg');
require('dotenv').config();

async function testDatabase() {
  console.log('Testing database connection...');

  // Get connection string from environment
  const connectionString = process.env.SUPABASE_DB_URL;
  
  if (!connectionString) {
    console.error('ERROR: SUPABASE_DB_URL environment variable is not set!');
    process.exit(1);
  }

  // Create a connection pool
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Attempting to connect to database...');
    
    // Test connection with a simple query
    const result = await pool.query('SELECT NOW() as time');
    console.log('✅ Connection successful!');
    console.log(`Server time: ${result.rows[0].time}`);
    
    // Check if the required tables exist
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
    
    // Done
    console.log('\n✅ Database check completed successfully!');
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('Error stack:', error.stack);
    
    // Provide specific guidance based on error type
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
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the test
testDatabase().catch(err => {
  console.error('Unhandled error in test script:', err);
});
