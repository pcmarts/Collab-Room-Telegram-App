/**
 * Twitter Enrichment Utility
 * 
 * This module provides functions to enrich company data with Twitter information
 * when a user is approved.
 */

import { db, users, companies } from '../db';
import { eq } from 'drizzle-orm';
import { config } from '../../shared/config';
import { downloadAndSaveImage } from './image-downloader';

/**
 * Fetch Twitter profile data for a username
 */
async function fetchTwitterProfile(username) {
  try {
    // Clean the username (remove @ if present)
    username = username.replace(/^@/, '');
    
    console.log(`Fetching Twitter profile for @${username}...`);
    
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': config.X_RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'twitter241.p.rapidapi.com'
      }
    };
    
    const url = `https://twitter241.p.rapidapi.com/user?username=${encodeURIComponent(username)}`;
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check for errors in the response
    if (data.errors) {
      throw new Error(`Twitter API returned errors: ${JSON.stringify(data.errors)}`);
    }
    
    // The structure is: data.result.data.user.result
    if (!data.result || !data.result.data || !data.result.data.user || !data.result.data.user.result) {
      throw new Error('No user data found in response');
    }
    
    // Extract the user data
    const user = data.result.data.user;
    const userData = user.result || {};
    const legacy = userData.legacy || {};
    
    // Get profile image URL with safe handling
    let profileImageUrl = legacy.profile_image_url_https || '';
    if (profileImageUrl) {
      profileImageUrl = profileImageUrl.replace('_normal', '');
    }
    
    // Transform the response into a clean profile object
    const profile = {
      username: username,
      name: legacy.name || `Unknown-${username}`, // Provide a default name to avoid null constraint violations
      bio: legacy.description || '', // Provide a default empty bio
      followers: legacy.followers_count || 0,
      following: legacy.friends_count || 0,
      tweets: legacy.statuses_count || 0,
      profileImageUrl: profileImageUrl || '',
      bannerImageUrl: legacy.profile_banner_url || null,
      verified: userData.is_blue_verified || legacy.verified || false,
      isBusinessAccount: userData.professional?.professional_type === 'Business' || false,
      businessCategory: userData.professional?.category?.[0]?.name || null,
      location: legacy.location || '',
      url: legacy.entities?.url?.urls?.[0]?.expanded_url || legacy.url || null,
      createdAt: legacy.created_at || new Date().toISOString(), // Provide current date as default
      restId: userData.rest_id || null, // Include the Twitter rest_id for API integrations
      rawData: JSON.stringify(data)
    };
    
    console.log('Profile data extracted successfully');
    
    return { success: true, profile };
  } catch (error) {
    console.error(`Error fetching Twitter profile for @${username}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Store the Twitter data for a company
 */
async function storeTwitterData(companyId, profile) {
  try {
    console.log(`Storing Twitter data for company ${companyId} with handle @${profile.username}...`);
    
    // Use direct SQL execution through Drizzle DB connection
    // This improves reliability and avoids creating new connections
    try {
      // Create a custom SQL query with the existing drizzle connection
      const query = `
        INSERT INTO company_twitter_data (
          company_id, 
          username, 
          name, 
          bio, 
          followers_count, 
          following_count, 
          tweet_count, 
          profile_image_url, 
          banner_image_url, 
          is_verified, 
          is_business_account, 
          business_category, 
          location, 
          website_url, 
          created_at, 
          twitter_created_at,
          rest_id,
          raw_data
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        )
        ON CONFLICT (company_id) DO UPDATE SET
          username = EXCLUDED.username,
          name = EXCLUDED.name,
          bio = EXCLUDED.bio,
          followers_count = EXCLUDED.followers_count,
          following_count = EXCLUDED.following_count,
          tweet_count = EXCLUDED.tweet_count,
          profile_image_url = EXCLUDED.profile_image_url,
          banner_image_url = EXCLUDED.banner_image_url,
          is_verified = EXCLUDED.is_verified,
          is_business_account = EXCLUDED.is_business_account,
          business_category = EXCLUDED.business_category,
          location = EXCLUDED.location,
          website_url = EXCLUDED.website_url,
          twitter_created_at = EXCLUDED.twitter_created_at,
          rest_id = EXCLUDED.rest_id,
          raw_data = EXCLUDED.raw_data,
          last_fetched_at = NOW()
        RETURNING id;
      `;
      
      const values = [
        companyId,
        profile.username,
        profile.name,
        profile.bio,
        profile.followers,
        profile.following,
        profile.tweets,
        profile.profileImageUrl,
        profile.bannerImageUrl,
        profile.verified,
        profile.isBusinessAccount,
        profile.businessCategory,
        profile.location,
        profile.url,
        new Date(), // current timestamp
        profile.createdAt,
        profile.restId,
        profile.rawData
      ];
      
      // Execute raw SQL using Drizzle's db instance
      const result = await db.execute(query, values);
      
      if (result && result.length > 0) {
        console.log(`Successfully stored Twitter data for company ${companyId}`);
        return {
          success: true,
          id: result[0].id
        };
      } else {
        console.error(`Failed to store Twitter data for company ${companyId}`);
        return {
          success: false,
          error: 'No rows returned after insert/update'
        };
      }
    } catch (dbError) {
      console.error(`Database error while storing Twitter data: ${dbError}`);
      throw dbError;
    }
  } catch (error) {
    console.error(`Error storing Twitter data for company ${companyId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update a company with Twitter data and download logo
 */
async function updateCompanyWithTwitterData(companyId, twitterData) {
  try {
    console.log(`Processing company ${companyId}...`);
    
    try {
      // Get current company data using Drizzle
      const [company] = await db.select({
        id: companies.id,
        name: companies.name,
        short_description: companies.short_description,
        logo_url: companies.logo_url
      })
      .from(companies)
      .where(eq(companies.id, companyId));
      
      if (!company) {
        console.log(`Company ${companyId} not found in database.`);
        return { success: false, reason: 'Company not found' };
      }
      
      const updates = {};
      
      // Step 1: Download the Twitter profile image to our server
      let localLogoUrl = null;
      if (twitterData.profile_image_url) {
        console.log(`Downloading logo for company ${companyId} from Twitter...`);
        const downloadResult = await downloadAndSaveImage(twitterData.profile_image_url, companyId);
        
        if (downloadResult.success) {
          console.log(`Successfully downloaded company logo to ${downloadResult.localPath}`);
          localLogoUrl = downloadResult.publicPath;
        } else {
          console.warn(`Failed to download image: ${downloadResult.error}`);
          // Fall back to the original URL if download fails
          localLogoUrl = twitterData.profile_image_url;
        }
      } else {
        console.warn(`No profile image URL found for company ${companyId}`);
      }
      
      // Update logo_url with local path if download succeeded, otherwise use original Twitter URL
      updates.logo_url = localLogoUrl || twitterData.profile_image_url;
      
      // Only update short_description if it's empty or null
      let descriptionUpdated = false;
      if (!company.short_description) {
        updates.short_description = twitterData.bio;
        descriptionUpdated = true;
      }
      
      // Skip if no updates to make (shouldn't happen as we always update logo_url)
      if (Object.keys(updates).length === 0) {
        console.log(`No updates needed for company ${companyId}`);
        return { success: true, changes: 0 };
      }
      
      // Update company using Drizzle
      const [updatedCompany] = await db.update(companies)
        .set(updates)
        .where(eq(companies.id, companyId))
        .returning({
          id: companies.id,
          name: companies.name,
          short_description: companies.short_description,
          logo_url: companies.logo_url
        });
      
      if (!updatedCompany) {
        console.log(`Failed to update company ${companyId}`);
        return { success: false, reason: 'Update failed' };
      }
      
      console.log(`Successfully updated company: ${updatedCompany.name} (${companyId})`);
      console.log(`- Logo URL: ${updatedCompany.logo_url}`);
      console.log(`- Logo downloaded locally: ${localLogoUrl ? 'Yes' : 'No'}`);
      console.log(`- Short description: ${descriptionUpdated ? 'Updated' : 'Not updated (already had value)'}`);
      
      return { 
        success: true, 
        changes: Object.keys(updates).length,
        logoUpdated: true,
        logoDownloaded: !!localLogoUrl,
        descriptionUpdated: descriptionUpdated
      };
    } catch (dbError) {
      console.error(`Database error while updating company: ${dbError}`);
      throw dbError;
    }
  } catch (error) {
    console.error(`Error updating company ${companyId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Process Twitter enrichment for a user's company when they are approved
 */
async function enrichCompanyOnUserApproval(userId) {
  try {
    console.log(`Starting Twitter enrichment process for user ${userId}...`);
    
    // Get the user and their company
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      console.error(`User ${userId} not found`);
      return { success: false, error: 'User not found' };
    }
    
    if (!user.company_id) {
      console.warn(`User ${userId} has no associated company`);
      return { success: false, error: 'User has no company' };
    }
    
    // Get the company details
    const [company] = await db.select().from(companies).where(eq(companies.id, user.company_id));
    
    if (!company) {
      console.error(`Company ${user.company_id} not found for user ${userId}`);
      return { success: false, error: 'Company not found' };
    }
    
    // Check if the company has a Twitter handle
    if (!company.twitter_handle) {
      console.warn(`Company ${company.id} (${company.name}) has no Twitter handle`);
      return { success: false, error: 'Company has no Twitter handle' };
    }
    
    console.log(`Processing company ${company.id} (${company.name}) with Twitter handle @${company.twitter_handle}`);
    
    // Step 1: Fetch Twitter profile
    const twitterResult = await fetchTwitterProfile(company.twitter_handle);
    
    if (!twitterResult.success) {
      console.error(`Failed to fetch Twitter profile for @${company.twitter_handle}: ${twitterResult.error}`);
      return { success: false, error: twitterResult.error };
    }
    
    // Step 2: Store Twitter data
    const storeResult = await storeTwitterData(company.id, twitterResult.profile);
    
    if (!storeResult.success) {
      console.error(`Failed to store Twitter data: ${storeResult.error}`);
      return { success: false, error: storeResult.error };
    }
    
    // Step 3: Get Twitter data to update company using Drizzle's SQL method
    try {
      // Get the Twitter data using a raw SQL query with Drizzle
      const twitterDataQuery = `
        SELECT bio, profile_image_url FROM company_twitter_data WHERE company_id = $1
      `;
      
      const twitterDataResult = await db.execute(twitterDataQuery, [company.id]);
      
      if (!twitterDataResult || twitterDataResult.length === 0) {
        console.error(`Twitter data not found for company ${company.id}`);
        return { success: false, error: 'Twitter data not found' };
      }
      
      const twitterData = twitterDataResult[0];
      
      // Step 4: Update company with Twitter data
      const updateResult = await updateCompanyWithTwitterData(company.id, twitterData);
      
      if (!updateResult.success) {
        console.error(`Failed to update company with Twitter data: ${updateResult.error || updateResult.reason}`);
        return { success: false, error: updateResult.error || updateResult.reason };
      }
      
      console.log(`Successfully enriched company ${company.id} (${company.name}) with Twitter data`);
      return { 
        success: true, 
        message: `Successfully enriched company ${company.name} with Twitter data`,
        logoUpdated: updateResult.logoUpdated,
        descriptionUpdated: updateResult.descriptionUpdated
      };
    } catch (dbError) {
      console.error(`Database error getting Twitter data: ${dbError}`);
      throw dbError;
    }
  } catch (error) {
    console.error('Error during company Twitter enrichment:', error);
    return { success: false, error: error.message };
  }
}

export {
  enrichCompanyOnUserApproval
};