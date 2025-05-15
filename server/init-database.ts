// Initialize database with required tables if they don't exist
import { pool } from './src/config/database';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

async function initializeDatabase() {
  console.log('Starting database initialization...');

  let client;
  try {
    client = await pool.connect();
    console.log('Connected to database.');
    
    // Check if the users table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('Creating users table...');
      
      // Create the users table
      await client.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          mobile_number VARCHAR(15) UNIQUE NOT NULL,
          otp VARCHAR(10),
          otp_expires_at TIMESTAMP,
          is_verified BOOLEAN DEFAULT FALSE,
          name VARCHAR(100),
          default_address_id BIGINT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Users table created successfully.');
    } else {
      console.log('Users table already exists.');
      
      // Validate table structure
      const columnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users';
      `);
      
      // Check for required columns
      const columns = columnsResult.rows.map(row => row.column_name);
      const requiredColumns = [
        'id', 'mobile_number', 'otp', 'otp_expires_at', 'is_verified', 
        'name', 'default_address_id', 'created_at', 'updated_at'
      ];
      
      const missingColumns = requiredColumns.filter(col => !columns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log(`Warning: Missing columns in users table: ${missingColumns.join(', ')}`);
        
        // Add missing columns
        for (const column of missingColumns) {
          try {
            switch(column) {
              case 'name':
                await client.query(`ALTER TABLE users ADD COLUMN name VARCHAR(100);`);
                break;
              case 'default_address_id':
                await client.query(`ALTER TABLE users ADD COLUMN default_address_id BIGINT;`);
                break;
              case 'is_verified':
                await client.query(`ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;`);
                break;
              case 'created_at':
                await client.query(`ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
                break;
              case 'updated_at':
                await client.query(`ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
                break;
            }
            console.log(`Added missing column: ${column}`);
          } catch (err) {
            console.error(`Failed to add column ${column}:`, err);
          }
        }
      }
    }

    // Check if addresses table exists
    const addressesTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'addresses'
      );
    `);

    if (!addressesTableExists.rows[0].exists) {
      console.log('Creating addresses table...');
      
      // Create the addresses table
      await client.query(`
        CREATE TABLE addresses (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          street_address TEXT NOT NULL,
          city VARCHAR(100) NOT NULL,
          state VARCHAR(100) NOT NULL,
          postal_code VARCHAR(20) NOT NULL,
          country VARCHAR(100) DEFAULT 'India',
          is_default BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Addresses table created successfully.');
    } else {
      console.log('Addresses table already exists.');
    }

    console.log('Database initialization completed successfully.');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

initializeDatabase();
