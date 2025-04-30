/**
 * Script to update a specific company with Twitter profile data
 * 
 * This script takes a company ID, fetches Twitter data for the company's Twitter handle,
 * and updates the company record with the logo and description.
 * 
 * Run with:
 * npx tsx update-company-with-twitter.js
 */

import { pool } from './server/db.js';

// Company ID to update
const COMPANY_ID = 'f6ccc6ca-d1a4-4b76-8ab5-03e717bad1f6';

// Utility to clean Twitter handle
function cleanTwitterHandle(handle) {
  if (!handle) return null;
  return handle.replace(/^@/, '');
}

// Twitter profile fetching
async function fetchTwitterProfile(handle) {
  try {
    const username = cleanTwitterHandle(handle);
    console.log(`Fetching Twitter profile for @${username}`);

    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.X_RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'twitter241.p.rapidapi.com'
      }
    };

    const url = `https://twitter241.p.rapidapi.com/user?username=${encodeURIComponent(username)}`;
    const response = await fetch(url, options);
    
    if (!response.ok) {
      console.error(`Twitter API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.errors) {
      console.error('Twitter API returned errors:', data.errors);
      return null;
    }
    
    if (!data.result?.data?.user?.result) {
      console.error('No user data found in response');
      return null;
    }
    
    const { result: { data: { user } } } = data;
    const userData = user.result || {};
    const legacy = userData.legacy || {};
    
    let profileImageUrl = legacy.profile_image_url_https || '';
    if (profileImageUrl) {
      profileImageUrl = profileImageUrl.replace('_normal', '');
    }
    
    const profile = {
      username: username,
      name: legacy.name,
      bio: legacy.description,
      followers: legacy.followers_count || 0,
      following: legacy.friends_count || 0,
      tweets: legacy.statuses_count || 0,
      profileImageUrl: profileImageUrl,
      bannerImageUrl: legacy.profile_banner_url,
      verified: userData.is_blue_verified || legacy.verified || false
    };
    
    console.log(`Successfully fetched profile for @${username}`);
    return profile;
  } catch (error) {
    console.error(`Error fetching Twitter profile:`, error);
    return null;
  }
}

// Main function
async function main() {
  console.log(`Starting Twitter enrichment for company ID: ${COMPANY_ID}`);
  
  try {
    // Get the company details
    const companyQuery = 'SELECT * FROM companies WHERE id = $1';
    const companyResult = await pool.query(companyQuery, [COMPANY_ID]);
    
    if (companyResult.rows.length === 0) {
      console.error(`Company with ID ${COMPANY_ID} not found`);
      return;
    }
    
    const company = companyResult.rows[0];
    console.log(`Company found: ${company.name}`);
    console.log(`Current logo URL: ${company.logo_url || 'None'}`);
    console.log(`Current description: ${company.short_description || 'None'}`);
    
    if (!company.twitter_handle) {
      console.error('Company has no Twitter handle');
      return;
    }
    
    console.log(`Twitter handle: ${company.twitter_handle}`);
    
    // Fetch Twitter profile
    const profile = await fetchTwitterProfile(company.twitter_handle);
    
    if (!profile) {
      console.error('Failed to fetch Twitter profile');
      return;
    }
    
    console.log('\nTwitter profile data:');
    console.log(`- Name: ${profile.name}`);
    console.log(`- Bio: ${profile.bio}`);
    console.log(`- Profile Image: ${profile.profileImageUrl}`);
    console.log(`- Banner Image: ${profile.bannerImageUrl || 'None'}`);
    console.log(`- Followers: ${profile.followers}`);
    console.log(`- Verified: ${profile.verified ? 'Yes' : 'No'}`);
    
    // Update the company with Twitter data
    console.log('\nUpdating company with Twitter data...');
    
    const updateQuery = `
      UPDATE companies
      SET logo_url = $1, short_description = $2
      WHERE id = $3
      RETURNING id, name, logo_url, short_description
    `;
    
    const updateResult = await pool.query(updateQuery, [
      profile.profileImageUrl,
      profile.bio || company.short_description,
      COMPANY_ID
    ]);
    
    if (updateResult.rows.length === 0) {
      console.error('Failed to update company');
      return;
    }
    
    const updatedCompany = updateResult.rows[0];
    console.log('Company successfully updated with Twitter data:');
    console.log(`- New logo URL: ${updatedCompany.logo_url}`);
    console.log(`- New description: ${updatedCompany.short_description}`);
    
    console.log('\n✅ Twitter enrichment completed successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the pool when done
    await pool.end();
    console.log('Database connection closed');
  }
}

// Execute the main function
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});