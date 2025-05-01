/**
 * Script to list all companies with approved users that have Twitter handles
 * 
 * Run with:
 * node scripts/list-approved-companies.cjs
 */

// Import PostgreSQL client
const { Pool } = require('pg');

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function listApprovedCompanies() {
  let client;
  
  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    
    // Query to get all companies with approved users that have Twitter handles
    const query = `
      SELECT 
        c.id AS company_id, 
        c.name AS company_name, 
        c.twitter_handle,
        u.id AS user_id,
        u.email AS user_email,
        u.first_name AS user_first_name
      FROM companies c
      JOIN users u ON c.user_id = u.id
      WHERE u.is_approved = true
      AND c.twitter_handle IS NOT NULL
      AND c.twitter_handle != ''
      ORDER BY c.name;
    `;
    
    console.log('Fetching approved companies with Twitter handles...');
    const result = await client.query(query);
    
    if (result.rows.length === 0) {
      console.log('No approved companies with Twitter handles found.');
      return [];
    }
    
    console.log(`Found ${result.rows.length} approved companies with Twitter handles:`);
    
    // Print the results and create a formatted output for batch script
    const companies = [];
    
    for (let i = 0; i < result.rows.length; i++) {
      const company = result.rows[i];
      
      // Clean up Twitter handle (remove @ if present)
      let handle = company.twitter_handle;
      if (handle.startsWith('@')) {
        handle = handle.substring(1);
      }
      
      companies.push({
        id: company.company_id,
        name: company.company_name,
        handle: handle,
        userId: company.user_id,
        userEmail: company.user_email,
        userName: company.user_first_name
      });
      
      console.log(`${i+1}. ${company.company_name} (ID: ${company.company_id})`);
      console.log(`   Twitter: @${handle}`);
      console.log(`   User: ${company.user_first_name} (${company.user_email})`);
      console.log('---');
    }
    
    // Generate batch script entries
    console.log('\nEntries for batch enrichment script:');
    for (const company of companies) {
      console.log(`  "${company.id}:${company.handle}"`);
    }
    
    return companies;
  } catch (error) {
    console.error('Error listing approved companies:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Main function
async function main() {
  try {
    await listApprovedCompanies();
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  } finally {
    // Close the database connection pool
    await pool.end();
    console.log('Database connection closed.');
  }
}

// Run the main function
main()
  .then(() => {
    console.log('List operation completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });