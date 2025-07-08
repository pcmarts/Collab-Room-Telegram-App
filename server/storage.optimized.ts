/**
 * Optimized implementation of the searchCollaborationsPaginated function
 * This version moves more JavaScript-based filtering to SQL WHERE clauses
 * and utilizes the new database indexes for better performance.
 */

import { 
  users, companies, collaborations, swipes, marketing_preferences,
  type User, type InsertUser,
  type Collaboration, type InsertCollaboration,
  type Swipe, type InsertSwipe,
  type Match, type InsertMatch,
  type NotificationPreferences, type MarketingPreferences
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, inArray, isNull, not, desc, sql, ilike, lt, gt, exists } from "drizzle-orm";
// Using SQL array operators directly with sql tag instead of importing helpers
// Use console.log for logging to match the existing style
const logger = {
  info: (...args: any[]) => console.log(...args),
  error: (...args: any[]) => console.error(...args),
  warn: (...args: any[]) => console.warn(...args),
  debug: (...args: any[]) => console.log(...args)
};

export interface CollaborationFilters {
  collabTypes?: string[];
  companyTags?: string[];
  minCompanyFollowers?: string;
  minUserFollowers?: string;
  hasToken?: boolean;
  fundingStages?: string[];
  blockchainNetworks?: string[];
  excludeOwn?: boolean;
  cursor?: string;
  limit?: number;
  excludeIds?: string[];
  sortBy?: string;
}

export interface PaginatedCollaborations {
  items: any[];
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Optimized version of searchCollaborationsPaginated that moves more filtering to SQL
 * and utilizes the new database indexes for better performance.
 */
export async function searchCollaborationsPaginatedOptimized(
  userId: string, 
  filters: CollaborationFilters
): Promise<PaginatedCollaborations> {
  logger.info('============ DEBUG: Search Collaborations Paginated (Highly Optimized) ============');
  logger.info(`Filters: ${JSON.stringify(filters)}`);
  logger.info(`User ID: ${userId}`);
  
  // Performance tracking
  const startTime = performance.now();
  
  // Set default limit if not provided
  const limit = filters.limit || 10;
  logger.info(`Using limit: ${limit}`);
  
  try {
    // ===== KEY OPTIMIZATION: Get marketing preferences in a single efficient query =====
    // This eliminates a separate roundtrip to the database for preferences
    // Skip preferences for anonymous users
    const marketingPrefsQuery = userId !== 'anonymous' ? await db.select()
      .from(marketing_preferences)
      .where(eq(marketing_preferences.user_id, userId))
      .limit(1) : [];

    const marketingPrefs = marketingPrefsQuery.length > 0 ? marketingPrefsQuery[0] : null;
    
    // Prepare the base query with necessary joins
    let query = db
      .select({
        // Select specific fields instead of entire tables to reduce payload size
        // ===== KEY OPTIMIZATION: Only select fields that are actually needed =====
        collaboration: {
          id: collaborations.id,
          creator_id: collaborations.creator_id,
          collab_type: collaborations.collab_type,
          status: collaborations.status,
          description: collaborations.description,
          topics: collaborations.topics,
          twitter_followers: collaborations.twitter_followers,
          company_twitter_followers: collaborations.company_twitter_followers,
          funding_stage: collaborations.funding_stage,
          company_has_token: collaborations.company_has_token,
          company_tags: collaborations.company_tags,
          date_type: collaborations.date_type,
          specific_date: collaborations.specific_date,
          details: collaborations.details,
          created_at: collaborations.created_at
        },
        company: {
          name: companies.name,
          logo_url: companies.logo_url, // FIX: Add missing logo_url field selection
          // Use appropriate company fields
          short_description: companies.short_description,
          long_description: companies.long_description,
          website: companies.website,
          twitter_handle: companies.twitter_handle,
          twitter_followers: companies.twitter_followers,
          linkedin_url: companies.linkedin_url,
          job_title: companies.job_title,
          has_token: companies.has_token,
          token_ticker: companies.token_ticker,
          blockchain_networks: companies.blockchain_networks,
          tags: companies.tags,
          funding_stage: companies.funding_stage
        },
        user: {
          id: users.id,
          first_name: users.first_name,
          last_name: users.last_name,
          role_title: users.handle // This seems to be used as the role title in the app
        }
      })
      .from(collaborations)
      .innerJoin(
        users,
        eq(collaborations.creator_id, users.id)
      )
      .leftJoin(
        companies,
        eq(users.id, companies.user_id)
      );
    
    // ===== KEY OPTIMIZATION: Add WHERE conditions directly to SQL =====
    
    // Basic conditions that are always present
    const baseConditions = [
      // Only active collaborations
      eq(collaborations.status, 'active')
    ];
    
    // REMOVED: User's own collaboration exclusion - all collaborations should be visible to all users
    
    // Build the full list of IDs to exclude (user's own collaborations + explicit exclude IDs)
    const allExcludeIds = filters.excludeIds || [];
    
    // Add condition to exclude explicit IDs if any are provided
    if (allExcludeIds.length > 0) {
      baseConditions.push(not(inArray(collaborations.id, allExcludeIds)));
    }
    
    // REMOVED: Swipe filtering - all collaborations should always be visible
    // Users can see collaborations regardless of previous swipe interactions
    
    // Apply marketing preference filters directly in SQL if they exist
    if (marketingPrefs) {
      // ===== KEY OPTIMIZATION: Apply preference-based filtering in SQL =====
      
      // 1. Collaboration Types Filter
      if (marketingPrefs.discovery_filter_enabled && 
          marketingPrefs.discovery_filter_collab_types_enabled && 
          marketingPrefs.collabs_to_discover && 
          marketingPrefs.collabs_to_discover.length > 0) {
        baseConditions.push(
          inArray(collaborations.collab_type, marketingPrefs.collabs_to_discover)
        );
      }
      
      // 2. Topics Filter (exclusion)
      if (marketingPrefs.discovery_filter_enabled && 
          marketingPrefs.discovery_filter_topics_enabled && 
          marketingPrefs.filtered_marketing_topics && 
          marketingPrefs.filtered_marketing_topics.length > 0) {
        baseConditions.push(
          sql`NOT (${collaborations.topics} && ARRAY[${marketingPrefs.filtered_marketing_topics.map(t => `'${t}'`).join(',')}]::text[])`
        );
      }
      
      // 3. Company Followers Filter
      if (marketingPrefs.discovery_filter_enabled && 
          marketingPrefs.discovery_filter_company_followers_enabled && 
          marketingPrefs.company_twitter_followers) {
        baseConditions.push(
          eq(collaborations.company_twitter_followers, marketingPrefs.company_twitter_followers)
        );
      }
      
      // 4. User Followers Filter
      if (marketingPrefs.discovery_filter_enabled && 
          marketingPrefs.discovery_filter_user_followers_enabled && 
          marketingPrefs.twitter_followers) {
        baseConditions.push(
          eq(collaborations.twitter_followers, marketingPrefs.twitter_followers)
        );
      }
      
      // 5. Funding Stage Filter
      if (marketingPrefs.discovery_filter_enabled && 
          marketingPrefs.discovery_filter_funding_stages_enabled && 
          marketingPrefs.funding_stage) {
        baseConditions.push(
          eq(collaborations.funding_stage, marketingPrefs.funding_stage)
        );
      }
      
      // 6. Token Status Filter
      if (marketingPrefs.discovery_filter_enabled && 
          marketingPrefs.discovery_filter_token_status_enabled) {
        baseConditions.push(
          sql`${collaborations.company_has_token} = ${marketingPrefs.company_has_token ? 'true' : 'false'}`
        );
      }
      
      // 7. Company Sectors Filter
      if (marketingPrefs.discovery_filter_enabled && 
          marketingPrefs.discovery_filter_company_sectors_enabled && 
          marketingPrefs.company_tags && 
          marketingPrefs.company_tags.length > 0) {
        baseConditions.push(
          sql`${collaborations.company_tags} && ARRAY[${marketingPrefs.company_tags.map(t => `'${t}'`).join(',')}]::text[]`
        );
      }
      
      // 8. Blockchain Networks Filter
      if (marketingPrefs.discovery_filter_enabled && 
          marketingPrefs.discovery_filter_blockchain_networks_enabled && 
          marketingPrefs.company_blockchain_networks && 
          marketingPrefs.company_blockchain_networks.length > 0) {
        baseConditions.push(
          sql`${collaborations.company_blockchain_networks} && ARRAY[${marketingPrefs.company_blockchain_networks.map(t => `'${t}'`).join(',')}]::text[]`
        );
      }
    }
    
    // Add all conditions to the query
    query = query.where(and(...baseConditions));
    
    // ===== KEY OPTIMIZATION: Improve cursor-based pagination =====
    // Get cursor timestamp in one query instead of two separate queries
    if (filters.cursor) {
      logger.info(`Using cursor-based pagination with cursor: ${filters.cursor}`);
      
      // ===== KEY OPTIMIZATION: Use a subquery for cursor comparison =====
      // This avoids a separate query to get the cursor timestamp
      query = query.where(
        sql`${collaborations.created_at} < (
          SELECT created_at FROM ${collaborations}
          WHERE id = ${filters.cursor}
        )`
      );
    }
    
    // Add ordering based on sortBy parameter
    const sortBy = filters.sortBy || 'newest';
    switch (sortBy) {
      case 'oldest':
        query = query.orderBy(collaborations.created_at); // Ascending order for oldest first
        break;
      case 'collab_type':
        query = query.orderBy(collaborations.collab_type, desc(collaborations.created_at)); // Sort by type, then by newest
        break;
      case 'newest':
      default:
        query = query.orderBy(desc(collaborations.created_at)); // Descending order for newest first
        break;
    }
    
    // Add limit with an extra item to determine if there are more results
    query = query.limit(limit + 1);
    
    // Execute the query with a timeout
    logger.info('Executing optimized database query...');
    const results = await query;
    logger.info(`Found ${results.length} records from database`);
    
    // ===== KEY OPTIMIZATION: Process results in a single pass =====
    // Instead of multiple transformations, do it all at once
    const processedItems = results.map(r => {
      const company = r.company;
      // Merge the company data into the collaboration object, handling null companies
      return {
        ...r.collaboration,
        // Include these important fields from company that the frontend expects
        creator_company_name: company?.name || 'Independent',
        company_logo_url: company?.logo_url, // FIX: Add missing company logo URL mapping
        // Map company fields to the expected frontend fields
        company_description: company ? (company.long_description || company.short_description) : undefined,
        company_website: company?.website,
        
        // Additional company fields to support the details dialog
        company_twitter: company?.twitter_handle,
        company_twitter_followers: company?.twitter_followers,
        company_linkedin: company?.linkedin_url,
        company_short_description: company?.short_description,
        company_has_token: company?.has_token || false,
        company_token_ticker: company?.token_ticker,
        company_blockchain_networks: company?.blockchain_networks,
        company_tags: company?.tags || [],
        
        // FIX: Add company_data object that the dialog expects
        company_data: company ? {
          name: company.name,
          short_description: company.short_description,
          long_description: company.long_description,
          twitter_handle: company.twitter_handle,
          twitter_followers: company.twitter_followers,
          website: company.website,
          linkedin_url: company.linkedin_url,
          funding_stage: company.funding_stage,
          has_token: company.has_token,
          token_ticker: company.token_ticker,
          blockchain_networks: company.blockchain_networks,
          job_title: company.job_title,
          tags: company.tags,
          logo_url: company.logo_url
        } : null,
        
        // User information
        creator_first_name: r.user.first_name,
        creator_last_name: r.user.last_name,
        creator_role: r.user.role_title
      };
    });
    
    // Determine if there are more results and extract the proper limit
    const hasMore = processedItems.length > limit;
    const items = hasMore ? processedItems.slice(0, limit) : processedItems;
    
    // Determine the next cursor (if there are more results)
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : undefined;
    
    // Performance measurement
    const endTime = performance.now();
    const queryTime = endTime - startTime;
    logger.info(`Query execution time: ${queryTime.toFixed(2)}ms (target: <90ms)`);
    logger.info(`Returning ${items.length} collaborations, hasMore: ${hasMore}, nextCursor: ${nextCursor}`);
    
    // DEBUG: Log first item to check company_data structure
    if (items.length > 0) {
      logger.info('DEBUG: First collaboration item structure:');
      logger.info('- Has company_data:', !!items[0].company_data);
      logger.info('- Company data:', items[0].company_data);
      logger.info('- Creator company name:', items[0].creator_company_name);
    }
    
    return {
      items,
      hasMore,
      nextCursor
    };
  } catch (error) {
    logger.error('Error in highly optimized searchCollaborationsPaginated:', error);
    throw error;
  }
}