/**
 * Script to sync Twitter data with company profiles
 * 
 * This script:
 * 1. Updates company logo_url with Twitter profile image URL for all companies with Twitter data
 * 2. Updates company short_description with Twitter bio ONLY IF the short_description is empty
 * 
 * Run with:
 * node scripts/sync-twitter-data-to-companies.cjs [test|full]
 * 
 * Example:
 * node scripts/sync-twitter-data-to-companies.cjs test  # Run test on specific companies
 * node scripts/sync-twitter-data-to-companies.cjs full  # Run on all companies
 */

// Import required modules
const { Pool } = require('pg');

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test company IDs
const TEST_COMPANY_IDS = [
  '4c95f244-d5c1-4369-9531-834401fdce12', // Has description, shouldn't update bio
  '4a4fddf8-6357-4bfa-9993-f8610a91e1f7'  // No description, should update bio
];

/**
 * Updates a single company's data using Twitter profile information
 */
async function updateCompanyWithTwitterData(client, companyId, twitterData) {
  try {
    console.log(`Processing company ${companyId}...`);
    
    // Get current company data
    const companyResult = await client.query(
      'SELECT id, name, short_description, logo_url FROM companies WHERE id = $1',
      [companyId]
    );
    
    if (companyResult.rows.length === 0) {
      console.log(`Company ${companyId} not found in database.`);
      return { success: false, reason: 'Company not found' };
    }
    
    const company = companyResult.rows[0];
    
    // Prepare update fields
    const updates = [];
    const updateValues = [];
    let updateCount = 1;
    
    // Always update logo_url with Twitter profile image
    updates.push(`logo_url = $${updateCount}`);
    updateValues.push(twitterData.profile_image_url);
    updateCount++;
    
    // Only update short_description if it's empty or null
    let descriptionUpdated = false;
    if (!company.short_description) {
      updates.push(`short_description = $${updateCount}`);
      updateValues.push(twitterData.bio);
      updateCount++;
      descriptionUpdated = true;
    }
    
    // Skip if no updates to make
    if (updates.length === 0) {
      console.log(`No updates needed for company ${companyId}`);
      return { success: true, changes: 0 };
    }
    
    // Add company ID to values array
    updateValues.push(companyId);
    
    // Construct and execute update query
    const updateQuery = `
      UPDATE companies 
      SET ${updates.join(', ')} 
      WHERE id = $${updateCount}
      RETURNING id, name, short_description, logo_url
    `;
    
    const updateResult = await client.query(updateQuery, updateValues);
    
    if (updateResult.rows.length === 0) {
      console.log(`Failed to update company ${companyId}`);
      return { success: false, reason: 'Update failed' };
    }
    
    const updatedCompany = updateResult.rows[0];
    
    console.log(`Successfully updated company: ${updatedCompany.name} (${companyId})`);
    console.log(`- Logo URL: ${updatedCompany.logo_url}`);
    console.log(`- Short description: ${descriptionUpdated ? 'Updated' : 'Not updated (already had value)'}`);
    
    return { 
      success: true, 
      changes: updates.length,
      logoUpdated: true,
      descriptionUpdated: descriptionUpdated
    };
  } catch (error) {
    console.error(`Error updating company ${companyId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Main function to sync Twitter data to companies
 */
async function syncTwitterDataToCompanies(mode = 'test') {
  try {
    console.log('\n=================================================');
    console.log('    SYNCING TWITTER DATA TO COMPANY PROFILES      ');
    console.log('=================================================\n');
    
    console.log(`Running in ${mode.toUpperCase()} mode\n`);
    
    // Connect to the database
    const client = await pool.connect();
    
    try {
      // Stats tracking
      const stats = {
        processed: 0,
        logosUpdated: 0,
        descriptionsUpdated: 0,
        failed: 0
      };
      
      // Get Twitter data to sync
      let twitterDataQuery;
      
      if (mode === 'test') {
        // Test mode - only process specific test companies
        twitterDataQuery = {
          text: `
            SELECT company_id, bio, profile_image_url
            FROM company_twitter_data
            WHERE company_id = ANY($1)
          `,
          values: [TEST_COMPANY_IDS]
        };
        
        console.log(`Test mode: Processing only ${TEST_COMPANY_IDS.length} specific companies\n`);
      } else {
        // Full mode - process all companies with Twitter data
        twitterDataQuery = {
          text: `
            SELECT company_id, bio, profile_image_url
            FROM company_twitter_data
            ORDER BY followers_count DESC
          `,
          values: []
        };
        
        const countResult = await client.query('SELECT COUNT(*) FROM company_twitter_data');
        console.log(`Full mode: Processing all ${countResult.rows[0].count} companies with Twitter data\n`);
      }
      
      const twitterDataResult = await client.query(twitterDataQuery);
      
      if (twitterDataResult.rows.length === 0) {
        console.log('No Twitter data found to process.');
        return;
      }
      
      // Process each Twitter profile
      for (const twitterData of twitterDataResult.rows) {
        console.log(`\n-------------------------------------------------`);
        
        const result = await updateCompanyWithTwitterData(client, twitterData.company_id, twitterData);
        
        // Update stats
        stats.processed++;
        
        if (result.success) {
          if (result.logoUpdated) stats.logosUpdated++;
          if (result.descriptionUpdated) stats.descriptionsUpdated++;
        } else {
          stats.failed++;
        }
      }
      
      // Show summary
      console.log('\n=================================================');
      console.log('                  SYNC SUMMARY                   ');
      console.log('=================================================');
      console.log(`Companies processed: ${stats.processed}`);
      console.log(`Logos updated: ${stats.logosUpdated}`);
      console.log(`Descriptions updated: ${stats.descriptionsUpdated}`);
      console.log(`Failed updates: ${stats.failed}`);
      console.log('=================================================\n');
      
    } finally {
      // Release the database client
      client.release();
    }
  } catch (error) {
    console.error('Error syncing Twitter data to companies:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Parse command line arguments
const mode = process.argv[2] === 'full' ? 'full' : 'test';

// Run the sync process
syncTwitterDataToCompanies(mode).catch(console.error);