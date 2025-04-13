/**
 * Simple database connection test script
 * 
 * Run with:
 * npx tsx test-db-connection.js
 */

import pkg from 'pg';
const { Pool } = pkg;

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  // Get connection string from environment variable
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    return;
  }
  
  const pool = new Pool({ 
    connectionString,
    ssl: true 
  });
  
  try {
    // Test the connection by querying the current timestamp
    const res = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful!');
    console.log(`Server time: ${res.rows[0].current_time}`);
    
    // Get database version
    const versionRes = await pool.query('SELECT version()');
    console.log(`Database version: ${versionRes.rows[0].version}`);
    
    // Get table counts
    const tableCountRes = await pool.query(`
      SELECT 
        table_name as tablename, 
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM 
        information_schema.tables t
      WHERE 
        table_schema = 'public'
      ORDER BY 
        tablename
    `);
    
    console.log('\nDatabase Table Information:');
    console.table(tableCountRes.rows);
    
  } catch (err) {
    console.error('❌ Database connection failed:', err);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

testDatabaseConnection();