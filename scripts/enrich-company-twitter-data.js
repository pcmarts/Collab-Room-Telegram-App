/**
 * This script finds companies with Twitter handles but no Twitter data,
 * then calls the Twitter API to fetch their profiles and stores them
 * in the company_twitter_data table.
 * 
 * Run with:
 * npm run tsx scripts/enrich-company-twitter-data.js
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import { companies, company_twitter_data } from '../shared/schema.js';
import { eq, isNull, and, isNotNull } from 'drizzle-orm';
import { getTwitterProfile } from '../server/utils/twitter-api.js';

async function main() {
  console.log('Starting Company Twitter data enrichment...');
  
  if (!process.env.X_RAPIDAPI_KEY) {
    console.error('Error: X_RAPIDAPI_KEY environment variable is not set');
    process.exit(1);
  }

  // Create database connection
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  try {
    // 1. Find all companies with Twitter handles but no Twitter data
    const companiesNeedingTwitterData = await db
      .select({
        id: companies.id,
        name: companies.name,
        twitter_handle: companies.twitter_handle,
      })
      .from(companies)
      .leftJoin(
        company_twitter_data,
        eq(companies.id, company_twitter_data.company_id)
      )
      .where(
        and(
          isNotNull(companies.twitter_handle),
          isNull(company_twitter_data.id)
        )
      );

    console.log(`Found ${companiesNeedingTwitterData.length} companies needing Twitter data...`);

    // 2. For each company, fetch Twitter data and store it
    for (const company of companiesNeedingTwitterData) {
      try {
        if (!company.twitter_handle) {
          console.log(`Skipping company ${company.name} - no Twitter handle`);
          continue;
        }

        console.log(`Processing company: ${company.name}, Twitter: @${company.twitter_handle}`);
        
        // Clean the handle
        const handle = company.twitter_handle.replace(/^@/, '');
        
        // Fetch the Twitter profile
        const twitterProfile = await getTwitterProfile(handle);
        
        if (!twitterProfile) {
          console.log(`Could not fetch Twitter profile for ${company.name} (@${handle})`);
          continue;
        }
        
        // Insert into company_twitter_data
        console.log(`Inserting Twitter data for ${company.name} (@${handle})`);
        
        await db.insert(company_twitter_data).values({
          company_id: company.id,
          username: twitterProfile.username,
          name: twitterProfile.name,
          bio: twitterProfile.bio,
          followers_count: twitterProfile.followers,
          following_count: twitterProfile.following,
          tweet_count: twitterProfile.tweets,
          profile_image_url: twitterProfile.profileImageUrl,
          banner_image_url: twitterProfile.bannerImageUrl,
          is_verified: twitterProfile.verified,
          is_business_account: twitterProfile.isBusinessAccount,
          business_category: twitterProfile.businessCategory,
          location: twitterProfile.location,
          website_url: twitterProfile.url,
          twitter_created_at: twitterProfile.createdAt,
          last_fetched_at: new Date(),
          raw_data: twitterProfile.rawData || null,
        });
        
        console.log(`Successfully enriched ${company.name} with Twitter data`);

        // Update the company's twitter_followers field for compatibility
        if (twitterProfile.followers) {
          const followerCount = twitterProfile.followers;
          let followerRange = '0-1K';
          
          if (followerCount > 500000) {
            followerRange = '500K+';
          } else if (followerCount > 100000) {
            followerRange = '100K-500K';
          } else if (followerCount > 10000) {
            followerRange = '10K-100K';
          } else if (followerCount > 1000) {
            followerRange = '1K-10K';
          }
          
          await db.update(companies)
            .set({
              twitter_followers: followerRange
            })
            .where(eq(companies.id, company.id));
            
          console.log(`Updated ${company.name}'s follower range to ${followerRange}`);
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing company ${company.name}:`, error);
        // Continue with the next company
      }
    }

    console.log('Company Twitter data enrichment completed.');
  } catch (error) {
    console.error('Enrichment script failed:', error);
    throw error;
  } finally {
    // Close the connection
    await sql.end();
  }
}

main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});