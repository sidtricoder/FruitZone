import { pool } from '../config/database';

/**
 * Script to initialize database schema
 * Run this script to create or update database tables
 */
async function initSchema() {
  console.log('🔄 Initializing database schema...');
  
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create users table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          mobile_number VARCHAR(15) UNIQUE NOT NULL,
          name VARCHAR(100),
          is_verified BOOLEAN NOT NULL DEFAULT FALSE,
          otp VARCHAR(10),
          otp_expires_at TIMESTAMP,
          default_address_id BIGINT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      console.log('✅ Users table initialized');
      
      // Check if the addresses table exists and create it if not
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'addresses'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        // Create addresses table
        await client.query(`
          CREATE TABLE addresses (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            address_line1 VARCHAR(255) NOT NULL,
            address_line2 VARCHAR(255),
            city VARCHAR(100) NOT NULL,
            state VARCHAR(100) NOT NULL,
            postal_code VARCHAR(20) NOT NULL,
            country VARCHAR(100) DEFAULT 'India',
            is_default BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        
        console.log('✅ Addresses table created');
      } else {
        console.log('ℹ️ Addresses table already exists');
      }
      
      // Create foreign key constraint on users.default_address_id if it doesn't exist
      try {
        await client.query(`
          ALTER TABLE users 
          ADD CONSTRAINT fk_default_address 
          FOREIGN KEY (default_address_id) 
          REFERENCES addresses(id) 
          ON DELETE SET NULL
        `);
        console.log('✅ Added foreign key constraint on users.default_address_id');
      } catch (error: any) {
        if (error.code === '42710') { // constraint already exists
          console.log('ℹ️ Foreign key constraint already exists on users.default_address_id');
        } else {
          throw error;
        }
      }
      
      await client.query('COMMIT');
      console.log('🎉 Database schema initialization completed successfully');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error initializing database schema:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw error;
  }
}

// Run the initialization when this script is executed directly
if (require.main === module) {
  initSchema().then(() => {
    console.log('Schema initialization script finished');
    process.exit(0);
  }).catch((error) => {
    console.error('Schema initialization failed:', error);
    process.exit(1);
  });
}

export default initSchema;
