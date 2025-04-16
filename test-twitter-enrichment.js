/**
 * Simple script to test Twitter enrichment for a specific company
 */

// Import the necessary modules
import { getTwitterProfile } from './server/utils/twitter-api.js';
import { db, companies } from './server/db.js';
import { eq } from 'drizzle-orm';

// Company ID to test
const COMPANY_ID = 'f6ccc6ca-d1a4-4b76-8ab5-03e717bad1f6';

async function main() {
  try {
    console.log(`Testing Twitter enrichment for company ID: ${COMPANY_ID}`);
    
    // Step 1: Get the company from the database
    const [company] = await db.select().from(companies).where(eq(companies.id, COMPANY_ID));
    
    if (!company) {
      console.error(`Company with ID ${COMPANY_ID} not found`);
      return;
    }
    
    console.log(`Company found: ${company.name}`);
    console.log(`Current logo URL: ${company.logo_url || 'None'}`);
    console.log(`Current description: ${company.short_description || 'None'}`);
    
    if (!company.twitter_handle) {
      console.error('Company has no Twitter handle');
      return;
    }
    
    console.log(`Twitter handle: ${company.twitter_handle}`);
    
    // Step 2: Fetch Twitter profile
    console.log(`\nFetching Twitter profile for @${company.twitter_handle}...`);
    const profile = await getTwitterProfile(company.twitter_handle);
    
    if (!profile) {
      console.error('Failed to fetch Twitter profile');
      return;
    }
    
    console.log('\nTwitter profile data:');
    console.log(`- Name: ${profile.name}`);
    console.log(`- Bio: ${profile.bio}`);
    console.log(`- Profile Image: ${profile.profileImageUrl}`);
    console.log(`- Banner Image: ${profile.bannerImageUrl || 'None'}`);
    console.log(`- Followers: ${profile.followers.toLocaleString()}`);
    console.log(`- Verified: ${profile.verified ? 'Yes' : 'No'}`);
    
    // Step 3: Update the company with Twitter data
    console.log('\nUpdating company with Twitter data...');
    
    // Use raw SQL to avoid potential ORM issues
    const updateQuery = `
      UPDATE companies 
      SET logo_url = $1, short_description = $2
      WHERE id = $3
      RETURNING id, name, logo_url, short_description;
    `;
    
    const updateValues = [
      profile.profileImageUrl,
      profile.bio || company.short_description,
      COMPANY_ID
    ];
    
    const result = await db.execute(updateQuery, updateValues);
    const updatedCompany = result[0];
    
    if (!updatedCompany) {
      console.error('Failed to update company');
      return;
    }
    
    console.log('Company successfully updated with Twitter data:');
    console.log(`- New logo URL: ${updatedCompany.logo_url}`);
    console.log(`- New description: ${updatedCompany.short_description}`);
    
    console.log('\nTwitter enrichment completed successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unexpected error:', error);
});