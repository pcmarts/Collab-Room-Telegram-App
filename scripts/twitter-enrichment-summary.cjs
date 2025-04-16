/**
 * Twitter Data Enrichment Summary Report
 * 
 * This script generates a summary report of the Twitter data enrichment process,
 * showing statistics and details about the enriched company data.
 * 
 * Run with:
 * node scripts/twitter-enrichment-summary.cjs
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

/**
 * Formats a number with commas for better readability
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Main function to generate the report
 */
async function generateReport() {
  try {
    console.log('\n==============================================');
    console.log('    TWITTER DATA ENRICHMENT SUMMARY REPORT    ');
    console.log('==============================================\n');
    
    // Connect to the database
    const client = await pool.connect();
    
    try {
      // Count total number of companies with Twitter data
      const totalResult = await client.query('SELECT COUNT(*) FROM company_twitter_data');
      const totalCompanies = parseInt(totalResult.rows[0].count, 10);
      
      // Get total count of companies
      const allCompaniesResult = await client.query('SELECT COUNT(*) FROM companies');
      const allCompanies = parseInt(allCompaniesResult.rows[0].count, 10);
      
      // Calculate percentage of companies with Twitter data
      const percentage = ((totalCompanies / allCompanies) * 100).toFixed(2);
      
      console.log(`Total companies enriched with Twitter data: ${totalCompanies} / ${allCompanies} (${percentage}%)\n`);
      
      // Get follower statistics
      const followerStatsQuery = `
        SELECT 
          MIN(followers_count) as min_followers,
          MAX(followers_count) as max_followers,
          AVG(followers_count)::int as avg_followers,
          SUM(followers_count) as total_followers
        FROM company_twitter_data
      `;
      
      const followerStats = await client.query(followerStatsQuery);
      const stats = followerStats.rows[0];
      
      console.log('Follower Statistics:');
      console.log(`- Minimum followers: ${formatNumber(stats.min_followers)}`);
      console.log(`- Maximum followers: ${formatNumber(stats.max_followers)}`);
      console.log(`- Average followers: ${formatNumber(stats.avg_followers)}`);
      console.log(`- Total followers reach: ${formatNumber(stats.total_followers)}\n`);
      
      // Get top 5 accounts by followers
      const topAccountsQuery = `
        SELECT c.name as company_name, t.username, t.name as twitter_name, t.followers_count, t.rest_id
        FROM company_twitter_data t
        JOIN companies c ON t.company_id = c.id
        ORDER BY t.followers_count DESC
        LIMIT 5
      `;
      
      const topAccounts = await client.query(topAccountsQuery);
      
      console.log('Top 5 Twitter Accounts by Followers:');
      topAccounts.rows.forEach((account, index) => {
        console.log(`${index + 1}. ${account.company_name} (@${account.username})`);
        console.log(`   Twitter name: ${account.twitter_name}`);
        console.log(`   Followers: ${formatNumber(account.followers_count)}`);
        console.log(`   Rest ID: ${account.rest_id}`);
        console.log('');
      });
      
      // Count verified accounts
      const verifiedQuery = `
        SELECT COUNT(*) FROM company_twitter_data WHERE is_verified = true
      `;
      
      const verifiedResult = await client.query(verifiedQuery);
      const verifiedCount = parseInt(verifiedResult.rows[0].count, 10);
      const verifiedPercentage = ((verifiedCount / totalCompanies) * 100).toFixed(2);
      
      console.log(`Verified accounts: ${verifiedCount} (${verifiedPercentage}% of enriched companies)\n`);
      
      // Count business accounts
      const businessQuery = `
        SELECT COUNT(*) FROM company_twitter_data WHERE is_business_account = true
      `;
      
      const businessResult = await client.query(businessQuery);
      const businessCount = parseInt(businessResult.rows[0].count, 10);
      const businessPercentage = ((businessCount / totalCompanies) * 100).toFixed(2);
      
      console.log(`Business accounts: ${businessCount} (${businessPercentage}% of enriched companies)\n`);
      
      // Get most recent enrichments
      const recentQuery = `
        SELECT c.name as company_name, t.username, t.created_at
        FROM company_twitter_data t
        JOIN companies c ON t.company_id = c.id
        ORDER BY t.created_at DESC
        LIMIT 5
      `;
      
      const recentResults = await client.query(recentQuery);
      
      console.log('Most Recent Enrichments:');
      recentResults.rows.forEach((record, index) => {
        const date = new Date(record.created_at).toLocaleString();
        console.log(`${index + 1}. ${record.company_name} (@${record.username}) - ${date}`);
      });
      
      console.log('\n==============================================');
      console.log('              REPORT COMPLETE                ');
      console.log('==============================================\n');
      
    } finally {
      // Release the database client
      client.release();
    }
  } catch (error) {
    console.error('Error generating report:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the report generation
generateReport().catch(console.error);