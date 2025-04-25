import { 
  users, companies, collaborations, collab_notifications, swipes, matches,
  notification_preferences, marketing_preferences, conference_preferences,
  company_twitter_data, user_referrals, referral_events, // Added referral tables
  type User, type InsertUser,
  type Collaboration, type InsertCollaboration, 
  type CollabApplication, type InsertCollabApplication,
  type CollabNotification, type InsertCollabNotification,
  type Swipe, type InsertSwipe,
  type Match, type InsertMatch,
  type NotificationPreferences, type MarketingPreferences, type ConferencePreferences,
  type CompanyTwitterData,
  type UserReferral, type InsertUserReferral, // Added referral types
  type ReferralEvent, type InsertReferralEvent
} from "@shared/schema";
import { z } from 'zod';
import { db } from "./db";
import { eq, and, or, inArray, isNull, not, desc, sql, ilike, lt } from "drizzle-orm";
import { notifyMatchCreated, notifyNewCollabRequest } from "./telegram";
import crypto from 'crypto';

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  setUserAdminStatus(id: string, isAdmin: boolean): Promise<User | undefined>;
  
  // Collaboration methods
  createCollaboration(collaboration: any): Promise<Collaboration>;
  getCollaboration(id: string): Promise<Collaboration | undefined>;
  getUserCollaborations(userId: string): Promise<Collaboration[]>;
  searchCollaborations(userId: string, filters: CollaborationFilters): Promise<Collaboration[]>;
  searchCollaborationsPaginated(userId: string, filters: CollaborationFilters): Promise<PaginatedCollaborations>;
  updateCollaborationStatus(id: string, status: string): Promise<Collaboration | undefined>;
  getActiveCollaborationsCount(): Promise<number>;
  
  // Collaboration applications
  applyToCollaboration(application: InsertCollabApplication): Promise<CollabApplication>;
  getCollaborationApplications(collaborationId: string): Promise<CollabApplication[]>;
  getUserApplications(userId: string): Promise<CollabApplication[]>;
  updateApplicationStatus(id: string, status: string): Promise<CollabApplication | undefined>;
  
  // Swipe methods
  createSwipe(swipe: InsertSwipe): Promise<Swipe>;
  getUserSwipes(userId: string): Promise<Swipe[]>;
  getCollaborationSwipes(collaborationId: string): Promise<Swipe[]>;
  getPotentialMatchesForHost(userId: string): Promise<any[]>; // Get users who swiped right on host's collaborations
  
  // Match methods
  createMatch(match: InsertMatch): Promise<Match>;
  getUserMatches(userId: string): Promise<Match[]>;
  getUserMatchesWithDetails(userId: string): Promise<any[]>; // Get enriched matches with additional data
  getCollaborationMatches(collaborationId: string): Promise<Match[]>;
  getMatchById(id: string): Promise<Match | undefined>;
  updateMatchStatus(id: string, status: string): Promise<Match | undefined>;
  
  // Notification methods
  createNotification(notification: InsertCollabNotification): Promise<CollabNotification>;
  getUserNotifications(userId: string): Promise<CollabNotification[]>;
  markNotificationAsRead(id: string): Promise<CollabNotification | undefined>;
  markNotificationAsSent(id: string): Promise<CollabNotification | undefined>;
  
  // Notification preferences
  getUserNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined>;
  updateUserNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences | undefined>;
  
  // Marketing preferences
  getUserMarketingPreferences(userId: string): Promise<MarketingPreferences | undefined>;
  updateUserMarketingPreferences(userId: string, preferences: Partial<MarketingPreferences>): Promise<MarketingPreferences | undefined>;
  
  // Conference preferences
  getUserConferencePreferences(userId: string): Promise<ConferencePreferences | undefined>;
  updateUserConferencePreferences(userId: string, preferences: Partial<ConferencePreferences>): Promise<ConferencePreferences | undefined>;
  
  // Referral methods
  getUserReferral(userId: string): Promise<UserReferral | undefined>;
  createUserReferral(referral: InsertUserReferral): Promise<UserReferral>;
  getReferralByCode(referralCode: string): Promise<UserReferral | undefined>;
  incrementReferralUsage(referralId: string): Promise<UserReferral | undefined>;
  createReferralEvent(event: InsertReferralEvent): Promise<ReferralEvent>;
  completeReferralEvent(referralEventId: string): Promise<ReferralEvent | undefined>;
  getUserReferralEvents(userId: string): Promise<ReferralEvent[]>;
}

export interface CollaborationFilters {
  collabTypes?: string[];
  companyTags?: string[];
  minCompanyFollowers?: string;
  minUserFollowers?: string;
  hasToken?: boolean;
  fundingStages?: string[];
  blockchainNetworks?: string[];
  excludeOwn?: boolean; // Controls whether to exclude collaborations created by the current user
  cursor?: string; // Used for pagination - ID of the last collaboration in previous batch
  limit?: number; // Number of collaborations to fetch per page
  excludeIds?: string[]; // Additional collaboration IDs to exclude (from POST body)
}

export interface PaginatedCollaborations {
  items: Collaboration[];
  hasMore: boolean;
  nextCursor?: string;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegram_id, telegramId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async setUserAdminStatus(id: string, isAdmin: boolean): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ is_admin: isAdmin })
        .where(eq(users.id, id))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error("Error updating user admin status:", error);
      throw error;
    }
  }
  
  // Collaboration methods
  async createCollaboration(collaboration: any): Promise<Collaboration> {
    console.log("Creating collaboration with data:", collaboration);
    
    // Make a clean copy
    let collabData = { ...collaboration };
    
    // Validate creator_id is present
    if (!collabData.creator_id) {
      console.error("Missing creator_id in collaboration data");
      throw new Error("creator_id is required for collaboration creation");
    }
    
    // Handle specific_date - remove if not needed
    if (collabData.date_type === 'any_future_date') {
      console.log("Removing specific_date for any_future_date option");
      delete collabData.specific_date;
    } else if (collabData.date_type === 'specific_date' && collabData.specific_date) {
      // Ensure it's a string in YYYY-MM-DD format
      console.log("Formatting specific_date:", collabData.specific_date);
      // specific_date is already a string from our schema change
    }
    
    // Process the details object - ensure all details are preserved
    if (collabData.details) {
      console.log("Processing details object:", collabData.details);
      
      // Check if description is already set from client code
      if (collabData.description) {
        console.log("Description already set from client:", collabData.description);
      } else {
        // No longer extract short_description from details as we've migrated to root-level description
        console.log("No description provided, setting empty string as default");
        collabData.description = "";
      }
      
      // Process collaboration type-specific details
      if (collabData.collab_type === 'Co-Marketing on Twitter') {
        console.log("Processing Twitter co-marketing details:", collabData.details);
        
        // Ensure twittercomarketing_type is properly formatted as an array
        if (collabData.details.twittercomarketing_type) {
          if (!Array.isArray(collabData.details.twittercomarketing_type)) {
            collabData.details.twittercomarketing_type = [collabData.details.twittercomarketing_type];
            console.log("Converted twittercomarketing_type to array:", collabData.details.twittercomarketing_type);
          }
        }
      } else if (collabData.collab_type === 'Twitter Spaces Guest') {
        console.log("Processing Twitter Spaces Guest details:", collabData.details);
      }
    }
    
    // Ensure array fields are properly formatted
    const preparedData = {
      ...collabData,
      // Make sure each array field is properly formatted as an array of strings
      topics: Array.isArray(collabData.topics) 
        ? collabData.topics.map((topic: any) => String(topic))
        : (collabData.topics ? [String(collabData.topics)] : []),
      required_company_sectors: Array.isArray(collabData.required_company_sectors) 
        ? collabData.required_company_sectors.map((sector: any) => String(sector))
        : (collabData.required_company_sectors ? [String(collabData.required_company_sectors)] : []),
      required_funding_stages: Array.isArray(collabData.required_funding_stages) 
        ? collabData.required_funding_stages.map((stage: any) => String(stage))
        : (collabData.required_funding_stages ? [String(collabData.required_funding_stages)] : []),
      
      // Special handling based on collaboration type
      details: (() => {
        // Twitter co-marketing special handling
        if (collabData.collab_type === 'Co-Marketing on Twitter') {
          return {
            twittercomarketing_type: Array.isArray(collabData.details?.twittercomarketing_type)
              ? collabData.details.twittercomarketing_type
              : (collabData.details?.twittercomarketing_type ? [collabData.details.twittercomarketing_type] : ["Thread Collab"]),
            host_twitter_handle: collabData.details?.host_twitter_handle || "https://x.com/",
            host_follower_count: collabData.details?.host_follower_count || "0-1K"
            // No longer add short_description to details as we're using root-level description
          };
        }
        // Twitter Spaces Guest special handling
        else if (collabData.collab_type === 'Twitter Spaces Guest') {
          return {
            twitter_handle: collabData.details?.twitter_handle || "https://x.com/",
            host_follower_count: collabData.details?.host_follower_count || "0-1K"
            // No longer add short_description to details as we're using root-level description
          };
        }
        // Default to original details
        return collabData.details;
      })(),
      
      // Ensure description is set
      description: collabData.description || "",
      
      created_at: new Date(),
      updated_at: new Date()
    };
    
    console.log("Final prepared data:", preparedData);
    
    try {
      const [newCollaboration] = await db
        .insert(collaborations)
        .values(preparedData)
        .returning();
      return newCollaboration;
    } catch (error) {
      console.error("Database error inserting collaboration:", error);
      throw error;
    }
  }
  
  async getCollaboration(id: string): Promise<Collaboration | undefined> {
    const [collaboration] = await db
      .select()
      .from(collaborations)
      .where(eq(collaborations.id, id));
    return collaboration;
  }
  
  async getUserCollaborations(userId: string): Promise<Collaboration[]> {
    return db
      .select()
      .from(collaborations)
      .where(eq(collaborations.creator_id, userId))
      .orderBy(desc(collaborations.created_at));
  }
  
  /**
   * Get the total count of active collaborations in the database
   * This helps identify discrepancies between swipe counts and available collaborations
   */
  async getActiveCollaborationsCount(): Promise<number> {
    const result = await db
      .select({
        count: sql<number>`count(*)`
      })
      .from(collaborations)
      .where(eq(collaborations.status, 'active'));
    
    return result[0]?.count || 0;
  }
  
  async searchCollaborations(userId: string, filters: CollaborationFilters): Promise<Collaboration[]> {
    // Call the paginated version but return just the items
    const result = await this.searchCollaborationsPaginated(userId, filters);
    return result.items;
  }
  
  /**
   * Legacy implementation of search collaborations paginated - kept for reference and fallback
   */
  async searchCollaborationsPaginatedLegacy(userId: string, filters: CollaborationFilters): Promise<PaginatedCollaborations> {
    console.log('============ DEBUG: Search Collaborations Paginated (Join-Based Legacy) ============');
    console.log('Filters:', filters);
    console.log('User ID:', userId);
    
    // Set default limit if not provided
    const limit = filters.limit || 10;
    console.log(`Using limit: ${limit}`);
    
    // First get the user's marketing preferences to apply any filtering
    const marketingPrefs = await this.getUserMarketingPreferences(userId);
    
    // Get user's previous swipes to exclude already swiped collaborations
    const userSwipes = await this.getUserSwipes(userId);
    const swipedCollaborationIds = userSwipes.map(swipe => swipe.collaboration_id);
    
    console.log(`Found ${userSwipes.length} previous swipes by user ${userId}`);
    
    // Get user's own collaborations to ensure they're properly excluded
    const userCollaborations = await this.getUserCollaborations(userId);
    const userCollaborationIds = userCollaborations.map(collab => collab.id);
    
    console.log(`Found ${userCollaborations.length} collaborations created by user ${userId}`);
    
    // Create a combined array of IDs to exclude (both user's own and previously swiped)
    // Also include any additional excludeIds from the request (for discovery page)
    // Use simple concatenation and filtering to remove duplicates
    const allIds = [
      ...userCollaborationIds, 
      ...swipedCollaborationIds,
      ...(filters.excludeIds || []) // Add any additional excluded IDs from the request
    ];
    const excludeIds = allIds.filter((id, index) => allIds.indexOf(id) === index);
    console.log(`Total IDs to exclude: ${excludeIds.length} (${userCollaborationIds.length} own + ${swipedCollaborationIds.length} swiped + ${filters.excludeIds?.length || 0} additional)`);
    
    // Build the base query with joins to users and companies
    // The relationship is: collaborations.creator_id -> users.id -> companies.user_id
    let query = db
      .select({
        collaboration: collaborations,
        company: companies,
        user: users
      })
      .from(collaborations)
      .innerJoin(
        users,
        eq(collaborations.creator_id, users.id)
      )
      .innerJoin(
        companies,
        eq(users.id, companies.user_id)
      )
      .where(
        eq(collaborations.status, 'active')
      );
    
    // Log to verify the join structure
    console.log('Using join structure: collaborations -> users -> companies');
    
    // First, exclude any collaborations that were previously swiped
    if (excludeIds.length > 0) {
      console.log(`Excluding ${excludeIds.length} total collaborations from results`);
      // Ensure we're using the correct operator and correctly excluding IDs
      query = query.where(not(inArray(collaborations.id, excludeIds)));
      
      // Double check exclusion with explicit logging for debugging
      console.log('Excluded IDs for debugging:', excludeIds);
    }
    
    // Always exclude the user's own collaborations for Regular Collaboration Cards
    // This rule should be non-negotiable and is separate from the excludeIds logic
    console.log('Excluding user\'s own collaborations (creator_id filtering)');
    // Explicitly exclude regardless of the excludeIds array
    query = query.where(not(eq(collaborations.creator_id, userId)));
    
    // Apply filters based on marketing preferences if they exist and filters are enabled
    if (marketingPrefs) {
      console.log('Found marketing preferences - applying any enabled filters');
      
      // 1. Collaboration Types Filter (from collaborations table)
      if (marketingPrefs.discovery_filter_collab_types_enabled && 
          marketingPrefs.collabs_to_discover && 
          marketingPrefs.collabs_to_discover.length > 0) {
        
        console.log(`Filtering by collaboration types: ${marketingPrefs.collabs_to_discover.join(', ')}`);
        // Using inArray for single value field (not an array)
        // This implements OR logic between selected collaboration types
        query = query.where(inArray(collaborations.collab_type, marketingPrefs.collabs_to_discover));
      }
      
      // 2. Topics Filter (exclusion)
      if (marketingPrefs.discovery_filter_topics_enabled && 
          marketingPrefs.filtered_marketing_topics && 
          marketingPrefs.filtered_marketing_topics.length > 0) {
        
        console.log(`Excluding topics: ${marketingPrefs.filtered_marketing_topics.join(', ')}`);
        
        // Exclude collaborations that contain any of the filtered topics
        // This is complex because topics is an array field
        // We need to use SQL overlap operator && to check if any topics match the filtered ones
        query = query.where(
          sql`NOT (${collaborations.topics} && ${sql.array(marketingPrefs.filtered_marketing_topics, 'text')})`
        );
      }
      
      // 3. Company Followers Filter
      if (marketingPrefs.discovery_filter_company_followers_enabled && 
          marketingPrefs.company_twitter_followers) {
        
        console.log(`Filtering by company followers: ${marketingPrefs.company_twitter_followers}`);
        
        // Apply filter based on the minimum company followers preference
        query = query.where(eq(collaborations.company_twitter_followers, marketingPrefs.company_twitter_followers));
      }
      
      // 4. User Followers Filter
      if (marketingPrefs.discovery_filter_user_followers_enabled && 
          marketingPrefs.twitter_followers) {
        
        console.log(`Filtering by user followers: ${marketingPrefs.twitter_followers}`);
        
        // Apply filter based on the minimum user followers preference
        query = query.where(eq(collaborations.twitter_followers, marketingPrefs.twitter_followers));
      }
      
      // 5. Funding Stage Filter
      if (marketingPrefs.discovery_filter_funding_stages_enabled && 
          marketingPrefs.funding_stage) {
        
        console.log(`Filtering by funding stage: ${marketingPrefs.funding_stage}`);
        
        // Apply filter based on the funding stage preference
        query = query.where(eq(collaborations.funding_stage, marketingPrefs.funding_stage));
      }
      
      // 6. Token Status Filter
      if (marketingPrefs.discovery_filter_token_status_enabled) {
        console.log(`Filtering by token status: ${marketingPrefs.company_has_token}`);
        
        // Apply filter based on the token status preference
        query = query.where(eq(collaborations.company_has_token, marketingPrefs.company_has_token));
      }
      
      // 7. Company Sectors Filter
      if (marketingPrefs.discovery_filter_company_sectors_enabled && 
          marketingPrefs.company_tags && 
          marketingPrefs.company_tags.length > 0) {
        
        console.log(`Filtering by company sectors: ${marketingPrefs.company_tags.join(', ')}`);
        
        // Use SQL overlap operator to check if any tags match
        query = query.where(
          sql`${collaborations.company_tags} && ${sql.array(marketingPrefs.company_tags, 'text')}`
        );
      }
      
      // 8. Blockchain Networks Filter
      if (marketingPrefs.discovery_filter_blockchain_networks_enabled && 
          marketingPrefs.company_blockchain_networks && 
          marketingPrefs.company_blockchain_networks.length > 0) {
        
        console.log(`Filtering by blockchain networks: ${marketingPrefs.company_blockchain_networks.join(', ')}`);
        
        // Use SQL overlap operator to check if any networks match
        query = query.where(
          sql`${collaborations.company_blockchain_networks} && ${sql.array(marketingPrefs.company_blockchain_networks, 'text')}`
        );
      }
    }
    
    // Handle cursor-based pagination
    if (filters.cursor) {
      console.log(`Using cursor-based pagination with cursor: ${filters.cursor}`);
      
      // Get the collaboration with the cursor ID to determine its timestamp
      const [cursorCollab] = await db
        .select()
        .from(collaborations)
        .where(eq(collaborations.id, filters.cursor));
      
      if (cursorCollab) {
        console.log(`Found cursor collaboration with timestamp: ${cursorCollab.created_at}`);
        
        // Filter collaborations older than the cursor (for descending sort)
        query = query.where(lt(collaborations.created_at, cursorCollab.created_at));
      } else {
        console.log(`Warning: Cursor collaboration with ID ${filters.cursor} not found`);
      }
    }
    
    // Add ordering (always sort by most recent first)
    query = query.orderBy(desc(collaborations.created_at));
    
    // Add limit
    query = query.limit(limit + 1); // Fetch one extra to determine if there are more results
    
    // Execute the query
    const results = await query;
    console.log(`Found ${results.length} collaborations (including potential extra for pagination)`);
    
    // Extract just the collaboration objects from the joined results
    const collaborationResults = results.map(r => r.collaboration);
    
    // Determine if there are more results and extract the proper limit
    const hasMore = collaborationResults.length > limit;
    const items = hasMore ? collaborationResults.slice(0, limit) : collaborationResults;
    
    // Determine the next cursor (if there are more results)
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : undefined;
    
    console.log(`Returning ${items.length} collaborations, hasMore: ${hasMore}, nextCursor: ${nextCursor}`);
    
    return {
      items,
      hasMore,
      nextCursor
    };
  }
  
  /**
   * Optimized implementation of search collaborations paginated that combines multiple database calls
   * into a single operation with subqueries to improve performance
   */
  async searchCollaborationsPaginated(userId: string, filters: CollaborationFilters): Promise<PaginatedCollaborations> {
    console.log('============ DEBUG: Search Collaborations Paginated (Optimized) ============');
    console.log('Filters:', filters);
    console.log('User ID:', userId);
    
    // Performance tracking
    const startTime = Date.now();
    
    // Set default limit if not provided
    const limit = filters.limit || 10;
    console.log(`Using limit: ${limit}`);
    
    // ENHANCEMENT: First check if there are any active collaborations at all before filtering
    const totalCollabCount = await db.select({ count: sql`count(*)` })
      .from(collaborations)
      .where(eq(collaborations.status, 'active'));
    
    console.log(`Total active collaborations in database: ${totalCollabCount[0]?.count || 0}`);
    
    try {
      // Get the cursor collaboration's timestamp if cursor is provided
      let cursorTimestamp: Date | undefined;
      if (filters.cursor) {
        const [cursorCollab] = await db
          .select({
            created_at: collaborations.created_at
          })
          .from(collaborations)
          .where(eq(collaborations.id, filters.cursor));
        
        if (cursorCollab) {
          cursorTimestamp = cursorCollab.created_at;
          console.log(`Found cursor collaboration with timestamp: ${cursorTimestamp}`);
        } else {
          console.log(`Warning: Cursor collaboration with ID ${filters.cursor} not found`);
        }
      }
      
      // Prepare the base query with necessary joins
      let query = db
        .select({
          collaboration: collaborations,
          company: companies,
          user: users,
          marketingPrefs: marketing_preferences
        })
        .from(collaborations)
        .innerJoin(
          users,
          eq(collaborations.creator_id, users.id)
        )
        .innerJoin(
          companies,
          eq(users.id, companies.user_id)
        )
        // Left join with marketing preferences to include them in a single query
        .leftJoin(
          marketing_preferences,
          eq(marketing_preferences.user_id, userId)
        )
        .where(
          eq(collaborations.status, 'active')
        );
      
      // Log to verify the join structure
      console.log('Using optimized join structure with marketing preferences included');
      
      // Exclude user's own collaborations and previously swiped ones using SQL expressions
      // Also include any explicit exclusions from filters.excludeIds
      const excludeConditions = and(
        // Never show user's own collaborations
        not(eq(collaborations.creator_id, userId)),
        
        // Exclude previously swiped collaborations using NOT EXISTS
        sql`NOT EXISTS (
          SELECT 1 FROM ${swipes}
          WHERE ${swipes.collaboration_id} = ${collaborations.id}
          AND ${swipes.user_id} = ${userId}
        )`,
        
        // Exclude any explicitly provided IDs
        filters.excludeIds && filters.excludeIds.length > 0
          ? not(inArray(collaborations.id, filters.excludeIds))
          : undefined
      );
      
      query = query.where(excludeConditions);
      
      // Handle cursor-based pagination if cursor timestamp was found
      if (cursorTimestamp) {
        query = query.where(lt(collaborations.created_at, cursorTimestamp));
      }
      
      // Add ordering (always sort by most recent first)
      query = query.orderBy(desc(collaborations.created_at));
      
      // Add limit with an extra item to determine if there are more results
      query = query.limit(limit + 1);
      
      // Execute the query
      const results = await query;
      
      // Extract marketing preferences from the first result (all results have the same preferences)
      const marketingPrefs = results.length > 0 ? results[0].marketingPrefs : null;
      
      // Post-process the results to apply any marketing preference filters
      let filteredResults = [...results];
      
      if (marketingPrefs) {
        console.log('Found marketing preferences - applying any enabled filters');
        
        // Apply filters based on marketing preferences
        if (marketingPrefs.discovery_filter_enabled) {
          // 1. Collaboration Types Filter
          if (marketingPrefs.discovery_filter_collab_types_enabled && 
              marketingPrefs.collabs_to_discover && 
              marketingPrefs.collabs_to_discover.length > 0) {
            console.log(`Filtering by collaboration types: ${marketingPrefs.collabs_to_discover.join(', ')}`);
            filteredResults = filteredResults.filter(r => 
              marketingPrefs.collabs_to_discover!.includes(r.collaboration.collab_type)
            );
          }
          
          // 2. Topics Filter (exclusion)
          if (marketingPrefs.discovery_filter_topics_enabled && 
              marketingPrefs.filtered_marketing_topics && 
              marketingPrefs.filtered_marketing_topics.length > 0) {
            console.log(`Excluding topics: ${marketingPrefs.filtered_marketing_topics.join(', ')}`);
            filteredResults = filteredResults.filter(r => {
              // Check if any topics in the collaboration match any filtered topics
              // If there's an overlap, exclude the collaboration
              const collabTopics = r.collaboration.topics || [];
              const filteredTopics = marketingPrefs.filtered_marketing_topics || [];
              return !collabTopics.some(topic => filteredTopics.includes(topic));
            });
          }
          
          // Apply remaining filters - we're keeping these for completeness
          // but they could be moved to SQL for better performance if needed
          
          // 3. Company Followers Filter
          if (marketingPrefs.discovery_filter_company_followers_enabled && 
              marketingPrefs.company_twitter_followers) {
            console.log(`Filtering by company followers: ${marketingPrefs.company_twitter_followers}`);
            filteredResults = filteredResults.filter(r => 
              r.collaboration.company_twitter_followers === marketingPrefs.company_twitter_followers
            );
          }
          
          // 4. User Followers Filter
          if (marketingPrefs.discovery_filter_user_followers_enabled && 
              marketingPrefs.twitter_followers) {
            console.log(`Filtering by user followers: ${marketingPrefs.twitter_followers}`);
            filteredResults = filteredResults.filter(r => 
              r.collaboration.twitter_followers === marketingPrefs.twitter_followers
            );
          }
          
          // 5. Funding Stage Filter
          if (marketingPrefs.discovery_filter_funding_stages_enabled && 
              marketingPrefs.funding_stage) {
            console.log(`Filtering by funding stage: ${marketingPrefs.funding_stage}`);
            filteredResults = filteredResults.filter(r => 
              r.collaboration.funding_stage === marketingPrefs.funding_stage
            );
          }
          
          // 6. Token Status Filter
          if (marketingPrefs.discovery_filter_token_status_enabled) {
            console.log(`Filtering by token status: ${marketingPrefs.company_has_token}`);
            filteredResults = filteredResults.filter(r => 
              r.collaboration.company_has_token === marketingPrefs.company_has_token
            );
          }
          
          // 7. Company Sectors Filter
          if (marketingPrefs.discovery_filter_company_sectors_enabled && 
              marketingPrefs.company_tags && 
              marketingPrefs.company_tags.length > 0) {
            console.log(`Filtering by company sectors: ${marketingPrefs.company_tags.join(', ')}`);
            filteredResults = filteredResults.filter(r => {
              const collabTags = r.collaboration.company_tags || [];
              const prefTags = marketingPrefs.company_tags || [];
              // Check if there's any overlap between tags
              return collabTags.some(tag => prefTags.includes(tag));
            });
          }
          
          // 8. Blockchain Networks Filter
          if (marketingPrefs.discovery_filter_blockchain_networks_enabled && 
              marketingPrefs.company_blockchain_networks && 
              marketingPrefs.company_blockchain_networks.length > 0) {
            console.log(`Filtering by blockchain networks: ${marketingPrefs.company_blockchain_networks.join(', ')}`);
            filteredResults = filteredResults.filter(r => {
              const collabNetworks = r.collaboration.company_blockchain_networks || [];
              const prefNetworks = marketingPrefs.company_blockchain_networks || [];
              // Check if there's any overlap between networks
              return collabNetworks.some(network => prefNetworks.includes(network));
            });
          }
        }
      }
      
      // Extract collaboration objects with company data merged in
      const collaborationResults = filteredResults.map(r => {
        // Merge the company data into the collaboration object
        return {
          ...r.collaboration,
          // Include these important fields from company that the frontend expects
          creator_company_name: r.company.name,
          company_logo_url: r.company.logo_url,
          company_description: r.company.description,
          company_website: r.company.website,
          
          // Additional company fields to support the details dialog
          company_twitter: r.company.twitter_handle,
          company_twitter_followers: r.company.twitter_followers,
          company_linkedin: r.company.linkedin_url,
          company_short_description: r.company.short_description,
          company_has_token: r.company.has_token,
          company_token_ticker: r.company.token_ticker,
          company_blockchain_networks: r.company.blockchain_networks,
          company_tags: r.company.tags,
          
          // User information
          creator_first_name: r.user.first_name,
          creator_last_name: r.user.last_name,
          creator_role: r.user.role_title
        };
      });
      
      // Determine if there are more results and extract the proper limit
      const hasMore = collaborationResults.length > limit;
      const items = hasMore ? collaborationResults.slice(0, limit) : collaborationResults;
      
      // Determine the next cursor (if there are more results)
      const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : undefined;
      
      // Performance measurement
      const endTime = Date.now();
      console.log(`Query execution time: ${endTime - startTime}ms`);
      console.log(`Found ${results.length} initial results, ${filteredResults.length} after filtering`);
      console.log(`Returning ${items.length} collaborations, hasMore: ${hasMore}, nextCursor: ${nextCursor}`);
      
      return {
        items,
        hasMore,
        nextCursor
      };
    } catch (error) {
      console.error('Error in optimized searchCollaborationsPaginated:', error);
      
      // Fallback to legacy implementation if optimization fails
      console.log('Falling back to legacy implementation');
      return this.searchCollaborationsPaginatedLegacy(userId, filters);
    }
  }

  async updateCollaborationStatus(id: string, status: string): Promise<Collaboration | undefined> {
    try {
      const [updatedCollaboration] = await db
        .update(collaborations)
        .set({ 
          status,
          updated_at: new Date()
        })
        .where(eq(collaborations.id, id))
        .returning();
      return updatedCollaboration;
    } catch (error) {
      console.error("Error updating collaboration status:", error);
      throw error;
    }
  }
  
  // Collaboration applications (Legacy implementation - using swipes now)
  async applyToCollaboration(application: InsertCollabApplication): Promise<CollabApplication> {
    console.warn("Legacy applyToCollaboration called - this is now managed via swipes");
    
    // Create a swipe instead
    const swipeData: InsertSwipe = {
      user_id: application.applicant_id,
      collaboration_id: application.collaboration_id,
      direction: "right",
      details: application.details,
    };
    
    const swipe = await this.createSwipe(swipeData);
    
    // Create the legacy compatibility object
    return {
      id: swipe.id,
      collaboration_id: swipe.collaboration_id,
      applicant_id: swipe.user_id,
      status: "pending",
      details: swipe.details as any,
      created_at: swipe.created_at,
    };
  }
  
  async getCollaborationApplications(collaborationId: string): Promise<CollabApplication[]> {
    console.warn("Legacy getCollaborationApplications called - this is now managed via swipes");
    
    // Use swipes to provide backward compatibility
    const swipes = await this.getCollaborationSwipes(collaborationId);
    const rightSwipes = swipes.filter(swipe => swipe.direction === "right");
    
    return rightSwipes.map(swipe => ({
      id: swipe.id,
      collaboration_id: swipe.collaboration_id,
      applicant_id: swipe.user_id,
      status: "pending",
      details: swipe.details as any,
      created_at: swipe.created_at,
    }));
  }
  
  async getUserApplications(userId: string): Promise<CollabApplication[]> {
    console.warn("Legacy getUserApplications called - this is now managed via swipes");
    
    // Use swipes to provide backward compatibility
    const swipes = await this.getUserSwipes(userId);
    const rightSwipes = swipes.filter(swipe => swipe.direction === "right");
    
    return rightSwipes.map(swipe => ({
      id: swipe.id,
      collaboration_id: swipe.collaboration_id,
      applicant_id: swipe.user_id,
      status: "pending",
      details: swipe.details as any,
      created_at: swipe.created_at,
    }));
  }
  
  async updateApplicationStatus(id: string, status: string): Promise<CollabApplication | undefined> {
    console.warn("Legacy updateApplicationStatus called - this is now managed via matches");
    
    // This is a no-op since we're using the swiping system now
    return {
      id,
      collaboration_id: "",
      applicant_id: "",
      status,
      details: {},
      created_at: new Date(),
    };
  }
  
  // Swipe methods
  async createSwipe(swipe: InsertSwipe): Promise<Swipe> {
    console.log("Creating swipe:", swipe);
    
    const [newSwipe] = await db
      .insert(swipes)
      .values(swipe)
      .returning();
    
    // If this is a right swipe (application), check for a potential match
    if (swipe.direction === 'right') {
      console.log("Right swipe detected - checking for potential match");
      console.log(`DEBUG: User ${swipe.user_id} swiped right on collaboration ${swipe.collaboration_id}`);
      
      try {
        // Get the collaboration
        const [collaboration] = await db
          .select()
          .from(collaborations)
          .where(eq(collaborations.id, swipe.collaboration_id));
        
        if (collaboration) {
          console.log("Found collaboration by:", collaboration.creator_id);
          
          // Get host details for debugging
          const [host] = await db
            .select()
            .from(users)
            .where(eq(users.id, collaboration.creator_id));
            
          console.log(`DEBUG: Collab host: ${host ? host.id : 'unknown'} (telegram_id: ${host?.telegram_id || 'none'})`);
          
          // Get notification preferences for debugging
          const [preferences] = await db
            .select()
            .from(notification_preferences)
            .where(eq(notification_preferences.user_id, collaboration.creator_id));
            
          console.log(`DEBUG: Host notification preferences: ${preferences ? (preferences.notifications_enabled ? 'enabled' : 'disabled') : 'not set'}`);
          
          // Check if the collaboration creator has swiped right on any of this user's collaborations
          const creatorSwipes = await db
            .select()
            .from(swipes)
            .where(
              and(
                eq(swipes.user_id, collaboration.creator_id),
                eq(swipes.direction, 'right')
              )
            );
          
          console.log(`Found ${creatorSwipes.length} right swipes by collaboration creator`);
          
          // Get user's collaborations
          const userCollaborations = await db
            .select()
            .from(collaborations)
            .where(eq(collaborations.creator_id, swipe.user_id));
          
          console.log(`Found ${userCollaborations.length} collaborations by swiper`);
          
          // Check if any of the creator's right swipes are on the user's collaborations
          const userCollabIds = userCollaborations.map(collab => collab.id);
          const matchingSwipes = creatorSwipes.filter(s => userCollabIds.includes(s.collaboration_id));
          
          if (matchingSwipes.length > 0) {
            console.log("Found potential match! Creator swiped right on user's collaboration");
            
            // Take the first matching swipe (simplest case)
            const matchingSwipe = matchingSwipes[0];
            
            // Create a match record
            const matchData: InsertMatch = {
              collaboration_id: matchingSwipe.collaboration_id,
              host_id: swipe.user_id, // The user is the host of their own collaboration
              requester_id: collaboration.creator_id, // The creator requested to collaborate
              status: 'active',
              note: matchingSwipe.note,
            };
            
            console.log("Creating match:", matchData);
            
            try {
              const match = await this.createMatch(matchData);
              console.log("Match created:", match.id);
              
              // Also create a match for this swipe
              const reverseMatchData: InsertMatch = {
                collaboration_id: swipe.collaboration_id,
                host_id: collaboration.creator_id, // The creator is the host of their own collaboration
                requester_id: swipe.user_id, // The user requested to collaborate
                status: 'active',
                note: swipe.note,
              };
              
              console.log("Creating reverse match:", reverseMatchData);
              const reverseMatch = await this.createMatch(reverseMatchData);
              console.log("Reverse match created:", reverseMatch.id);
              
              // Notify both users
              try {
                // Pass the correct parameters in the right order: hostUserId, requesterUserId, collaborationId, matchId
                await notifyMatchCreated(
                  match.host_id,          // Host user ID
                  match.requester_id,     // Requester user ID
                  match.collaboration_id, // Collaboration ID
                  match.id                // Match ID
                );
                console.log("Match notification sent");
              } catch (notifyError) {
                console.error("Error sending match notification:", notifyError);
              }
            } catch (matchError) {
              console.error("Error creating match:", matchError);
            }
          } else {
            console.log("No match found yet");
            
            // Notify collaboration creator of new right swipe
            try {
              // Pass the correct parameters in the right order: hostUserId, requesterUserId, collaborationId
              await notifyNewCollabRequest(
                collaboration.creator_id, // Host user ID (collaboration creator)
                newSwipe.user_id,        // Requester user ID (who swiped right)
                collaboration.id         // Collaboration ID
              );
              console.log("Collaboration request notification sent");
            } catch (notifyError) {
              console.error("Error sending collaboration request notification:", notifyError);
            }
          }
        }
      } catch (error) {
        console.error("Error checking for matches:", error);
      }
    }
    
    return newSwipe;
  }
  
  async getUserSwipes(userId: string): Promise<Swipe[]> {
    return db
      .select()
      .from(swipes)
      .where(eq(swipes.user_id, userId))
      .orderBy(desc(swipes.created_at));
  }
  
  async getCollaborationSwipes(collaborationId: string): Promise<Swipe[]> {
    return db
      .select()
      .from(swipes)
      .where(eq(swipes.collaboration_id, collaborationId))
      .orderBy(desc(swipes.created_at));
  }
  
  async getPotentialMatchesForHost(userId: string): Promise<any[]> {
    console.log("Finding potential matches for host:", userId);
    
    // 1. Get host's collaborations
    const hostCollaborations = await this.getUserCollaborations(userId);
    
    // 2. Get all right swipes on the host's collaborations
    const collabIds = hostCollaborations.map(collab => collab.id);
    
    if (collabIds.length === 0) {
      console.log("Host has no collaborations to match");
      return [];
    }
    
    // Find all right swipes on host's collaborations
    const rightSwipes = await db
      .select({
        swipe: swipes,
        user: users,
        company: companies,
      })
      .from(swipes)
      .innerJoin(users, eq(swipes.user_id, users.id))
      .innerJoin(companies, eq(users.id, companies.user_id))
      .where(
        and(
          inArray(swipes.collaboration_id, collabIds),
          eq(swipes.direction, 'right')
        )
      )
      .orderBy(desc(swipes.created_at));
    
    console.log(`Found ${rightSwipes.length} right swipes on host's collaborations`);
    
    // Transform results to include user and company info
    const enrichedSwipes = rightSwipes.map(result => ({
      ...result.swipe,
      user: result.user,
      company: result.company,
    }));
    
    return enrichedSwipes;
  }
  
  // Match methods
  async createMatch(match: InsertMatch): Promise<Match> {
    const [newMatch] = await db
      .insert(matches)
      .values({
        ...match,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();
    return newMatch;
  }
  
  async getUserMatches(userId: string): Promise<Match[]> {
    return db
      .select()
      .from(matches)
      .where(
        or(
          eq(matches.host_id, userId),
          eq(matches.requester_id, userId)
        )
      )
      .orderBy(desc(matches.created_at));
  }
  
  async getUserMatchesWithDetails(userId: string): Promise<any[]> {
    // This is an enriched version of getUserMatches that returns more details
    // for each match including collaboration and user information
    console.log(`Getting detailed matches for user ${userId}`);
    
    const result = await db
      .select({
        match_id: matches.id,
        match_date: matches.created_at,
        match_status: matches.status,
        match_note: matches.note,
        collaboration_id: collaborations.id,
        collaboration_title: collaborations.title,
        collaboration_description: collaborations.description,
        collaboration_type: collaborations.collab_type,
        host_id: matches.host_id,
        host_name: users.name,
        requester_id: matches.requester_id,
        company_name: companies.name,
        company_logo: companies.logo_url
      })
      .from(matches)
      .innerJoin(collaborations, eq(matches.collaboration_id, collaborations.id))
      .innerJoin(users, eq(collaborations.creator_id, users.id))
      .innerJoin(companies, eq(users.id, companies.user_id))
      .where(
        or(
          eq(matches.host_id, userId),
          eq(matches.requester_id, userId)
        )
      )
      .orderBy(desc(matches.created_at));
      
    console.log(`Found ${result.length} detailed matches for user ${userId}`);
    return result;
  }
  
  async getCollaborationMatches(collaborationId: string): Promise<Match[]> {
    return db
      .select()
      .from(matches)
      .where(eq(matches.collaboration_id, collaborationId))
      .orderBy(desc(matches.created_at));
  }
  
  async getMatchById(id: string): Promise<Match | undefined> {
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, id));
    return match;
  }
  
  async updateMatchStatus(id: string, status: string): Promise<Match | undefined> {
    try {
      const [updatedMatch] = await db
        .update(matches)
        .set({ 
          status,
          updated_at: new Date()
        })
        .where(eq(matches.id, id))
        .returning();
      return updatedMatch;
    } catch (error) {
      console.error("Error updating match status:", error);
      throw error;
    }
  }
  
  // Notification methods
  async createNotification(notification: InsertCollabNotification): Promise<CollabNotification> {
    const [newNotification] = await db
      .insert(collab_notifications)
      .values(notification)
      .returning();
    return newNotification;
  }
  
  async getUserNotifications(userId: string): Promise<CollabNotification[]> {
    return db
      .select()
      .from(collab_notifications)
      .where(eq(collab_notifications.user_id, userId))
      .orderBy(desc(collab_notifications.created_at));
  }
  
  async markNotificationAsRead(id: string): Promise<CollabNotification | undefined> {
    try {
      const [updatedNotification] = await db
        .update(collab_notifications)
        .set({ is_read: true })
        .where(eq(collab_notifications.id, id))
        .returning();
      return updatedNotification;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }
  
  async markNotificationAsSent(id: string): Promise<CollabNotification | undefined> {
    try {
      const [updatedNotification] = await db
        .update(collab_notifications)
        .set({ is_sent: true })
        .where(eq(collab_notifications.id, id))
        .returning();
      return updatedNotification;
    } catch (error) {
      console.error("Error marking notification as sent:", error);
      throw error;
    }
  }
  
  // Notification preferences
  async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(notification_preferences)
      .where(eq(notification_preferences.user_id, userId));
    return prefs;
  }
  
  async updateUserNotificationPreferences(userId: string, prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences | undefined> {
    const existingPrefs = await this.getUserNotificationPreferences(userId);
    
    if (existingPrefs) {
      // Update existing preferences
      const [updatedPrefs] = await db
        .update(notification_preferences)
        .set({
          ...prefs,
          updated_at: new Date()
        })
        .where(eq(notification_preferences.id, existingPrefs.id))
        .returning();
      return updatedPrefs;
    } else {
      // Create new preferences
      const [newPrefs] = await db
        .insert(notification_preferences)
        .values({
          user_id: userId,
          notifications_enabled: prefs.notifications_enabled !== undefined ? prefs.notifications_enabled : true,
          notification_frequency: prefs.notification_frequency || "Daily",
          updated_at: new Date()
        })
        .returning();
      return newPrefs;
    }
  }
  
  // Marketing preferences
  async getUserMarketingPreferences(userId: string): Promise<MarketingPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(marketing_preferences)
      .where(eq(marketing_preferences.user_id, userId));
    return prefs;
  }
  
  async updateUserMarketingPreferences(userId: string, prefs: Partial<MarketingPreferences>): Promise<MarketingPreferences | undefined> {
    const existingPrefs = await this.getUserMarketingPreferences(userId);
    
    // Handle array fields
    const processedPrefs = {
      ...prefs,
      // Make sure array fields are properly initialized
      collabs_to_discover: Array.isArray(prefs.collabs_to_discover) ? prefs.collabs_to_discover : [],
      collabs_to_host: Array.isArray(prefs.collabs_to_host) ? prefs.collabs_to_host : [],
      twitter_collabs: Array.isArray(prefs.twitter_collabs) ? prefs.twitter_collabs : [],
      filtered_marketing_topics: Array.isArray(prefs.filtered_marketing_topics) ? prefs.filtered_marketing_topics : [],
      company_blockchain_networks: Array.isArray(prefs.company_blockchain_networks) ? prefs.company_blockchain_networks : [],
      company_tags: Array.isArray(prefs.company_tags) ? prefs.company_tags : []
    };
    
    console.log("STORAGE: Saving marketing preferences with arrays:", {
      collabs_to_discover: processedPrefs.collabs_to_discover,
      collabs_to_host: processedPrefs.collabs_to_host,
      twitter_collabs: processedPrefs.twitter_collabs,
      filtered_marketing_topics: processedPrefs.filtered_marketing_topics,
      company_blockchain_networks: processedPrefs.company_blockchain_networks,
      company_tags: processedPrefs.company_tags
    });
    
    if (existingPrefs) {
      // Update existing preferences
      const [updatedPrefs] = await db
        .update(marketing_preferences)
        .set({
          ...processedPrefs,
          // Ensure defaults for boolean fields
          discovery_filter_enabled: prefs.discovery_filter_enabled || false,
          discovery_filter_collab_types_enabled: prefs.discovery_filter_collab_types_enabled || false,
          discovery_filter_topics_enabled: prefs.discovery_filter_topics_enabled || false,
          discovery_filter_company_followers_enabled: prefs.discovery_filter_company_followers_enabled || false,
          discovery_filter_user_followers_enabled: prefs.discovery_filter_user_followers_enabled || false,
          discovery_filter_funding_stages_enabled: prefs.discovery_filter_funding_stages_enabled || false,
          discovery_filter_token_status_enabled: prefs.discovery_filter_token_status_enabled || false,
          discovery_filter_company_sectors_enabled: prefs.discovery_filter_company_sectors_enabled || false,
          discovery_filter_blockchain_networks_enabled: prefs.discovery_filter_blockchain_networks_enabled || false,
        })
        .where(eq(marketing_preferences.id, existingPrefs.id))
        .returning();
      return updatedPrefs;
    } else {
      // Create new preferences
      const [newPrefs] = await db
        .insert(marketing_preferences)
        .values({
          user_id: userId,
          collabs_to_discover: processedPrefs.collabs_to_discover,
          collabs_to_host: processedPrefs.collabs_to_host,
          twitter_collabs: processedPrefs.twitter_collabs,
          filtered_marketing_topics: processedPrefs.filtered_marketing_topics,
          // Ensure defaults for boolean fields
          discovery_filter_enabled: prefs.discovery_filter_enabled || false,
          discovery_filter_collab_types_enabled: prefs.discovery_filter_collab_types_enabled || false,
          discovery_filter_topics_enabled: prefs.discovery_filter_topics_enabled || false,
          discovery_filter_company_followers_enabled: prefs.discovery_filter_company_followers_enabled || false,
          discovery_filter_user_followers_enabled: prefs.discovery_filter_user_followers_enabled || false,
          discovery_filter_funding_stages_enabled: prefs.discovery_filter_funding_stages_enabled || false,
          discovery_filter_token_status_enabled: prefs.discovery_filter_token_status_enabled || false,
          discovery_filter_company_sectors_enabled: prefs.discovery_filter_company_sectors_enabled || false,
          discovery_filter_blockchain_networks_enabled: prefs.discovery_filter_blockchain_networks_enabled || false,
        })
        .returning();
      return newPrefs;
    }
  }
  
  // Conference preferences
  async getUserConferencePreferences(userId: string): Promise<ConferencePreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(conference_preferences)
      .where(eq(conference_preferences.user_id, userId));
    return prefs;
  }
  
  async updateUserConferencePreferences(userId: string, prefs: Partial<ConferencePreferences>): Promise<ConferencePreferences | undefined> {
    const existingPrefs = await this.getUserConferencePreferences(userId);
    
    // Ensure all array fields are properly initialized and validated
    const safePrefs = {
      ...prefs,
      coffee_match_company_sectors: Array.isArray(prefs.coffee_match_company_sectors) ? prefs.coffee_match_company_sectors : [],
      coffee_match_funding_stages: Array.isArray(prefs.coffee_match_funding_stages) ? prefs.coffee_match_funding_stages : [],
      filtered_conference_sectors: Array.isArray(prefs.filtered_conference_sectors) ? prefs.filtered_conference_sectors : []
    };
    
    console.log("STORAGE: Saving conference preferences with arrays:", {
      coffee_match_company_sectors: safePrefs.coffee_match_company_sectors,
      coffee_match_funding_stages: safePrefs.coffee_match_funding_stages,
      filtered_conference_sectors: safePrefs.filtered_conference_sectors
    });
    
    if (existingPrefs) {
      // Update existing preferences
      const [updatedPrefs] = await db
        .update(conference_preferences)
        .set(safePrefs)
        .where(eq(conference_preferences.id, existingPrefs.id))
        .returning();
      return updatedPrefs;
    } else {
      // Create new preferences
      const [newPrefs] = await db
        .insert(conference_preferences)
        .values({
          user_id: userId,
          coffee_match_enabled: prefs.coffee_match_enabled || false,
          coffee_match_company_sectors: safePrefs.coffee_match_company_sectors,
          coffee_match_company_followers: prefs.coffee_match_company_followers || null,
          coffee_match_user_followers: prefs.coffee_match_user_followers || null,
          coffee_match_funding_stages: safePrefs.coffee_match_funding_stages,
          coffee_match_token_status: prefs.coffee_match_token_status || false,
          filtered_conference_sectors: safePrefs.filtered_conference_sectors, 
          coffee_match_filter_company_sectors_enabled: prefs.coffee_match_filter_company_sectors_enabled || false,
          coffee_match_filter_company_followers_enabled: prefs.coffee_match_filter_company_followers_enabled || false,
          coffee_match_filter_user_followers_enabled: prefs.coffee_match_filter_user_followers_enabled || false,
          coffee_match_filter_funding_stages_enabled: prefs.coffee_match_filter_funding_stages_enabled || false,
          coffee_match_filter_token_status_enabled: prefs.coffee_match_filter_token_status_enabled || false
        })
        .returning();
      return newPrefs;
    }
  }
  
  // Referral methods
  async getUserReferral(userId: string): Promise<UserReferral | undefined> {
    const [referral] = await db
      .select()
      .from(user_referrals)
      .where(eq(user_referrals.user_id, userId));
    return referral;
  }

  async createUserReferral(referral: InsertUserReferral): Promise<UserReferral> {
    const [newReferral] = await db
      .insert(user_referrals)
      .values(referral)
      .returning();
    return newReferral;
  }

  async getReferralByCode(referralCode: string): Promise<UserReferral | undefined> {
    const [referral] = await db
      .select()
      .from(user_referrals)
      .where(eq(user_referrals.referral_code, referralCode));
    return referral;
  }

  async incrementReferralUsage(referralId: string): Promise<UserReferral | undefined> {
    try {
      const [referral] = await db
        .select()
        .from(user_referrals)
        .where(eq(user_referrals.id, referralId));

      if (!referral) {
        console.error(`Referral with ID ${referralId} not found`);
        return undefined;
      }

      const [updatedReferral] = await db
        .update(user_referrals)
        .set({ 
          total_used: referral.total_used + 1,
          updated_at: new Date()
        })
        .where(eq(user_referrals.id, referralId))
        .returning();

      return updatedReferral;
    } catch (error) {
      console.error("Error incrementing referral usage:", error);
      throw error;
    }
  }

  async createReferralEvent(event: InsertReferralEvent): Promise<ReferralEvent> {
    const [newEvent] = await db
      .insert(referral_events)
      .values(event)
      .returning();
    return newEvent;
  }

  async completeReferralEvent(referralEventId: string): Promise<ReferralEvent | undefined> {
    try {
      const [updatedEvent] = await db
        .update(referral_events)
        .set({ 
          status: 'completed',
          completed_at: new Date()
        })
        .where(eq(referral_events.id, referralEventId))
        .returning();
      return updatedEvent;
    } catch (error) {
      console.error("Error completing referral event:", error);
      throw error;
    }
  }

  async getUserReferralEvents(userId: string): Promise<ReferralEvent[]> {
    return db
      .select()
      .from(referral_events)
      .where(eq(referral_events.referrer_id, userId))
      .orderBy(desc(referral_events.created_at));
  }

  // Additional referral methods required by the API routes
  
  async updateUserReferralCode(userId: string, referralCode: string): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ referral_code: referralCode })
        .where(eq(users.id, userId))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error("Error updating user referral code:", error);
      throw error;
    }
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.referral_code, code));
      return user;
    } catch (error) {
      console.error("Error getting user by referral code:", error);
      throw error;
    }
  }

  async getReferredUsers(referrerId: string): Promise<any[]> {
    try {
      // Find users who were referred by this user
      const referredUsers = await db
        .select({
          id: users.id,
          first_name: users.first_name,
          last_name: users.last_name,
          handle: users.handle,
          created_at: users.created_at
        })
        .from(users)
        .where(eq(users.referred_by, referrerId));
        
      return referredUsers;
    } catch (error) {
      console.error("Error getting referred users:", error);
      throw error;
    }
  }

  async applyReferral(userId: string, referrerId: string): Promise<void> {
    try {
      // Start a transaction to ensure data consistency
      await db.transaction(async (tx) => {
        // 1. Update the user with the referrer ID
        await tx
          .update(users)
          .set({ 
            referred_by: referrerId,
            // Auto-approve referred users
            is_approved: true,
            approved_at: new Date()
          })
          .where(eq(users.id, userId));
          
        // 2. Create a referral event to track this referral
        await tx
          .insert(referral_events)
          .values({
            referrer_id: referrerId,
            referred_user_id: userId,
            status: 'pending',
            created_at: new Date()
          });
          
        // 3. Check if referrer has a referral record, create if not
        const [referrerRecord] = await tx
          .select()
          .from(user_referrals)
          .where(eq(user_referrals.user_id, referrerId));
          
        if (!referrerRecord) {
          // Get referrer's Telegram ID for the referral code
          const [referrer] = await tx
            .select()
            .from(users)
            .where(eq(users.id, referrerId));
            
          if (referrer) {
            // Create Telegram-specific referral code (r_TELEGRAM_ID_RANDOM)
            const randomSuffix = crypto.randomBytes(4).toString('hex');
            const referralCode = `r_${referrer.telegram_id}_${randomSuffix}`;
            
            // Create user_referral record
            await tx
              .insert(user_referrals)
              .values({
                user_id: referrerId,
                referral_code: referralCode,
                total_available: 3, // Default limit
                total_used: 1, // This is the first use
                created_at: new Date(),
                updated_at: new Date()
              });
              
            // Update user's referral code
            await tx
              .update(users)
              .set({ referral_code: referralCode })
              .where(eq(users.id, referrerId));
          }
        } else {
          // Increment the usage count
          await tx
            .update(user_referrals)
            .set({ 
              total_used: referrerRecord.total_used + 1,
              updated_at: new Date()
            })
            .where(eq(user_referrals.id, referrerRecord.id));
        }
      });
    } catch (error) {
      console.error("Error applying referral:", error);
      throw error;
    }
  }

  async getReferralEvents(): Promise<ReferralEvent[]> {
    try {
      return db
        .select()
        .from(referral_events)
        .orderBy(desc(referral_events.created_at));
    } catch (error) {
      console.error("Error getting all referral events:", error);
      throw error;
    }
  }

  async logReferralActivity(data: {
    userId: string;
    eventType: 'generate' | 'share' | 'copy' | 'view';
    details?: Record<string, any>;
  }): Promise<void> {
    try {
      // Create a separate table entry in the database for analytics
      console.log(`Logging referral activity of type ${data.eventType} for user ${data.userId}`);
      
      // For now, we'll just log to console since we don't have a dedicated analytics table
      // In the future, this should be stored in a separate analytics table
      console.log(JSON.stringify({
        user_id: data.userId,
        event_type: data.eventType,
        timestamp: new Date().toISOString(),
        details: data.details
      }));
    } catch (error) {
      console.error("Error logging referral activity:", error);
      // Don't throw error - we don't want analytics to break the app
      console.error(error);
    }
  }
}

export const storage = new DatabaseStorage();