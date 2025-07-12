import { 
  users, companies, collaborations, collab_notifications, swipes, matches, requests,
  notification_preferences, marketing_preferences, conference_preferences,
  company_twitter_data, user_referrals, referral_events, // Added referral tables
  type User, type InsertUser,
  type Collaboration, type InsertCollaboration, 
  type CollabApplication, type InsertCollabApplication,
  type CollabNotification, type InsertCollabNotification,
  type Swipe, type InsertSwipe,
  type Match, type InsertMatch,
  type Request, type InsertRequest,
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
import { searchCollaborationsPaginatedOptimized } from './storage.optimized';

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
  createCollabApplication(collaborationId: string, applicantId: string, message: string): Promise<CollabApplication>;
  applyToCollaboration(application: InsertCollabApplication): Promise<CollabApplication>;
  getCollaborationApplications(collaborationId: string): Promise<CollabApplication[]>;
  getUserApplications(userId: string): Promise<CollabApplication[]>;
  updateApplicationStatus(id: string, status: string): Promise<CollabApplication | undefined>;
  
  // Swipe methods
  createSwipe(swipe: InsertSwipe): Promise<Swipe>;
  getUserSwipes(userId: string): Promise<Swipe[]>;
  getCollaborationSwipes(collaborationId: string): Promise<Swipe[]>;
  getPotentialMatchesForHost(userId: string): Promise<any[]>; // Get users who swiped right on host's collaborations
  deleteLeftSwipes(userId: string): Promise<number>; // Delete left swipes for a user and return count of deleted swipes
  
  // Match methods
  createMatch(match: InsertMatch): Promise<Match>;
  getUserMatches(userId: string): Promise<Match[]>;
  getUserMatchesWithDetails(userId: string): Promise<any[]>; // Get enriched matches with additional data
  getCollaborationMatches(collaborationId: string): Promise<Match[]>;
  getMatchById(id: string): Promise<Match | undefined>;
  updateMatchStatus(id: string, status: string): Promise<Match | undefined>;
  
  // Request methods (new unified table)
  createRequest(request: InsertRequest): Promise<Request>;
  getUserRequestsAsHost(userId: string): Promise<Request[]>;
  getUserRequestsAsRequester(userId: string): Promise<Request[]>;
  getCollaborationRequests(userId: string, options: { cursor?: string; limit?: number; filter?: string }): Promise<any>;
  getCollaborationRequestsSummary(userId: string): Promise<{ pendingCount: number; totalCount: number }>;
  getRequestById(id: string): Promise<Request | undefined>;
  updateRequestStatus(id: string, status: string): Promise<Request | undefined>;
  getPendingRequestsForHost(userId: string, filter: 'all' | 'hidden'): Promise<any[]>;
  acceptCollaborationRequest(userId: string, requestId: string): Promise<{ success: boolean; error?: string; match?: any }>;
  hideCollaborationRequest(userId: string, requestId: string): Promise<{ success: boolean; error?: string }>;
  
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
    
    // Get user's previous left swipes to exclude already rejected collaborations
    const userSwipes = await this.getUserSwipes(userId);
    // Only exclude left swipes (not right swipes that haven't matched yet)
    const leftSwipedCollaborationIds = userSwipes
      .filter(swipe => swipe.direction === 'left')
      .map(swipe => swipe.collaboration_id);
    
    console.log(`Found ${userSwipes.length} previous swipes by user ${userId}, of which ${leftSwipedCollaborationIds.length} are left swipes`);
    
    // Get user's own collaborations to ensure they're properly excluded
    const userCollaborations = await this.getUserCollaborations(userId);
    const userCollaborationIds = userCollaborations.map(collab => collab.id);
    
    console.log(`Found ${userCollaborations.length} collaborations created by user ${userId}`);
    console.log(`User collaboration IDs: ${userCollaborationIds.join(', ')}`);
    
    // Create a combined array of IDs to exclude (both user's own and previously swiped left)
    // Also include any additional excludeIds from the request (for discovery page)
    // Use simple concatenation and filtering to remove duplicates
    const allIds = [
      ...userCollaborationIds, 
      ...leftSwipedCollaborationIds,
      ...(filters.excludeIds || []) // Add any additional excluded IDs from the request
    ];
    const excludeIds = allIds.filter((id, index) => allIds.indexOf(id) === index);
    console.log(`Total IDs to exclude: ${excludeIds.length} (${userCollaborationIds.length} own + ${leftSwipedCollaborationIds.length} left swiped + ${filters.excludeIds?.length || 0} additional)`);
    
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
    
    // FINAL SAFETY CHECK - ensure no user's own collaborations remain in the results
    // This should never happen with both SQL filtering and explicit ID exclusions, but we add this as a defensive measure
    if (userCollaborationIds.length > 0) {
      const finalItems = items.filter(item => !userCollaborationIds.includes(item.id));
      
      // If we filtered out any items, log a warning - this indicates a bug
      if (finalItems.length < items.length) {
        console.warn(`CRITICAL BUG: Found ${items.length - finalItems.length} of user's own collaborations in LEGACY implementation that weren't filtered out earlier!`);
        console.warn(`User's own collaboration IDs: ${userCollaborationIds.join(', ')}`);
        console.warn(`IDs that slipped through: ${items.filter(item => userCollaborationIds.includes(item.id)).map(item => item.id).join(', ')}`);
        
        // Replace the items
        items.length = 0;
        items.push(...finalItems);
      }
    }
    
    // Log the user's collaboration IDs for debugging
    console.log(`User collaboration IDs for reference: ${userCollaborationIds.join(', ')}`);
    
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
   * into a single operation with subqueries to improve performance.
   * 
   * Updated to use the highly optimized implementation that leverages custom database indexes
   * to significantly improve query performance for discovery cards.
   */
  async searchCollaborationsPaginated(userId: string, filters: CollaborationFilters): Promise<PaginatedCollaborations> {
    console.log('============ DEBUG: Search Collaborations Paginated (Super Optimized) ============');
    
    // Check if an environment flag is set to toggle between implementations
    // Default to using the highly optimized version
    const useHighlyOptimized = process.env.USE_OPTIMIZED_DISCOVERY !== 'false';
    
    if (useHighlyOptimized) {
      console.log('Using HIGHLY optimized implementation with advanced database indexing');
      try {
        return await searchCollaborationsPaginatedOptimized(userId, filters);
      } catch (error) {
        console.error('Error in highly optimized implementation, falling back to previous version:', error);
        // Fall through to previous implementation
      }
    }
    
    console.log('Using standard optimized implementation');
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
      
      // Retrieve user's own collaborations to DOUBLE-CHECK they are excluded
      const userCollaborations = await this.getUserCollaborations(userId);
      const userCollaborationIds = userCollaborations.map(collab => collab.id);
      console.log(`Found ${userCollaborations.length} collaborations created by user ${userId}`);
      console.log(`User collaboration IDs: ${userCollaborationIds.join(', ')}`);
      
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
      
      // Build the full list of IDs to exclude (user's own collaborations + explicit exclude IDs)
      const allExcludeIds = [
        ...userCollaborationIds,  // Always exclude user's own collaborations
        ...(filters.excludeIds || []) // Add any explicitly provided IDs
      ];
      
      // UPDATED: Show ALL collaborations to ALL users
      // Only exclude based on explicit filters, not user ownership or swipe history
      const excludeConditions = and(
        // Only exclude explicitly provided IDs (if any)
        (filters.excludeIds && filters.excludeIds.length > 0) 
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
      
      // FINAL SAFETY CHECK - ensure no user's own collaborations remain in the results
      // This should never happen, but we add this as a defensive measure
      if (userCollaborationIds.length > 0) {
        const finalItems = items.filter(item => !userCollaborationIds.includes(item.id));
        
        // If we filtered out any items, log a warning - this indicates a bug
        if (finalItems.length < items.length) {
          console.warn(`CRITICAL BUG: Found ${items.length - finalItems.length} of user's own collaborations that weren't filtered out earlier!`);
          console.warn(`User's own collaboration IDs: ${userCollaborationIds.join(', ')}`);
          console.warn(`IDs that slipped through: ${items.filter(item => userCollaborationIds.includes(item.id)).map(item => item.id).join(', ')}`);
          
          // Replace the items
          items.length = 0;
          items.push(...finalItems);
        }
      }
      
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
  
  async createCollabApplication(collaborationId: string, applicantId: string, message: string): Promise<CollabApplication> {
    console.log("Creating collaboration application using new requests table");
    
    // Get the collaboration to find the host
    const collaboration = await this.getCollaboration(collaborationId);
    if (!collaboration) {
      throw new Error('Collaboration not found');
    }
    
    // Create a request instead with the message saved as note
    const requestData: InsertRequest = {
      collaboration_id: collaborationId,
      requester_id: applicantId,
      host_id: collaboration.creator_id,
      status: 'pending',
      note: message,
    };
    
    const request = await this.createRequest(requestData);
    
    // Create the legacy compatibility object
    return {
      id: request.id,
      collaboration_id: request.collaboration_id,
      applicant_id: request.requester_id,
      status: request.status,
      details: { message }, // Keep backward compatibility by putting message in details
      created_at: request.created_at,
    };
  }

  // Collaboration applications (Legacy implementation - using swipes now)
  async applyToCollaboration(application: InsertCollabApplication): Promise<CollabApplication> {
    console.log("Creating collaboration application using new requests table");
    
    // Get the collaboration to find the host
    const collaboration = await this.getCollaboration(application.collaboration_id);
    if (!collaboration) {
      throw new Error('Collaboration not found');
    }
    
    // Create a request instead
    const requestData: InsertRequest = {
      collaboration_id: application.collaboration_id,
      requester_id: application.applicant_id,
      host_id: collaboration.creator_id,
      status: 'pending',
      note: application.details?.message || null,
    };
    
    const request = await this.createRequest(requestData);
    
    // Create the legacy compatibility object
    return {
      id: request.id,
      collaboration_id: request.collaboration_id,
      applicant_id: request.requester_id,
      status: request.status,
      details: application.details,
      created_at: request.created_at,
    };
  }
  
  async getCollaborationApplications(collaborationId: string): Promise<CollabApplication[]> {
    console.log("Getting collaboration applications using new requests table");
    
    // Get pending requests for this collaboration
    const requests = await this.getCollaborationRequests(collaborationId);
    const pendingRequests = requests.filter(req => req.status === "pending");
    
    return pendingRequests.map(request => ({
      id: request.id,
      collaboration_id: request.collaboration_id,
      applicant_id: request.requester_id,
      status: request.status,
      details: { message: request.note },
      created_at: request.created_at,
    }));
  }
  
  async getUserApplications(userId: string): Promise<CollabApplication[]> {
    console.log("Getting user applications using new requests table");
    
    // Get requests where user is the requester
    const requests = await this.getUserRequestsAsRequester(userId);
    
    return requests.map(request => ({
      id: request.id,
      collaboration_id: request.collaboration_id,
      applicant_id: request.requester_id,
      status: request.status,
      details: { message: request.note },
      created_at: request.created_at,
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
  
  // Swipe methods (legacy - now using requests table)
  async createSwipe(swipe: InsertSwipe): Promise<Swipe> {
    console.log("Creating swipe using requests table");
    
    // Only process right swipes (collaboration requests)
    // Left swipes are no longer stored
    if (swipe.direction === 'left') {
      // Return a dummy swipe object for left swipes
      return {
        id: crypto.randomUUID(),
        user_id: swipe.user_id,
        collaboration_id: swipe.collaboration_id,
        direction: 'left',
        note: null,
        details: null,
        created_at: new Date(),
      };
    }
    
    // Get the collaboration to find the host
    const collaboration = await this.getCollaboration(swipe.collaboration_id);
    if (!collaboration) {
      throw new Error('Collaboration not found');
    }
    
    // Check if a request already exists
    const existingRequest = await db
      .select()
      .from(requests)
      .where(
        and(
          eq(requests.collaboration_id, swipe.collaboration_id),
          eq(requests.requester_id, swipe.user_id)
        )
      );
    
    if (existingRequest.length > 0) {
      // Return the existing request as a swipe
      const request = existingRequest[0];
      return {
        id: request.id,
        user_id: request.requester_id,
        collaboration_id: request.collaboration_id,
        direction: 'right',
        note: request.note,
        details: swipe.details,
        created_at: request.created_at,
      };
    }
    
    // Create a new request
    const requestData: InsertRequest = {
      collaboration_id: swipe.collaboration_id,
      requester_id: swipe.user_id,
      host_id: collaboration.creator_id,
      status: 'pending',
      note: swipe.note || swipe.details?.message || null,
    };
    
    const request = await this.createRequest(requestData);
    
    // Notify the host about the new request
    try {
      await notifyNewCollabRequest(
        collaboration.creator_id,
        swipe.user_id,
        collaboration.id
      );
      console.log("Collaboration request notification sent");
    } catch (notifyError) {
      console.error("Error sending collaboration request notification:", notifyError);
    }
    
    // Return as a swipe for legacy compatibility
    return {
      id: request.id,
      user_id: request.requester_id,
      collaboration_id: request.collaboration_id,
      direction: 'right',
      note: request.note,
      details: swipe.details,
      created_at: request.created_at,
    };
  }
  
  async getUserSwipes(userId: string): Promise<Swipe[]> {
    console.log("Getting user swipes using requests table");
    
    // Get requests where user is the requester
    const userRequests = await this.getUserRequestsAsRequester(userId);
    
    // Convert requests to swipes for legacy compatibility
    return userRequests.map(request => ({
      id: request.id,
      user_id: request.requester_id,
      collaboration_id: request.collaboration_id,
      direction: 'right' as const,
      note: request.note,
      details: null,
      created_at: request.created_at,
    }));
  }
  
  async getCollaborationSwipes(collaborationId: string): Promise<Swipe[]> {
    console.log("Getting collaboration swipes using requests table");
    
    // Get requests for this collaboration
    const collabRequests = await this.getCollaborationRequests(collaborationId);
    
    // Convert requests to swipes for legacy compatibility
    return collabRequests.map(request => ({
      id: request.id,
      user_id: request.requester_id,
      collaboration_id: request.collaboration_id,
      direction: 'right' as const,
      note: request.note,
      details: null,
      created_at: request.created_at,
    }));
  }
  
  /**
   * Delete all left swipes for a user and return the count of deleted records
   * This allows users to "reset" and see collaborations they previously passed on
   */
  async deleteLeftSwipes(userId: string): Promise<number> {
    console.log(`deleteLeftSwipes called - left swipes are no longer stored`);
    
    // No-op: Left swipes are no longer stored in the requests table
    // We only store right swipes (collaboration requests)
    return 0;
  }
  
  async getPotentialMatchesForHost(userId: string): Promise<any[]> {
    console.log("Finding potential matches for host:", userId);
    
    // 1. Get host's collaborations
    const hostCollaborations = await this.getUserCollaborations(userId);
    console.log(`Found ${hostCollaborations.length} collaborations created by host ${userId}`);
    
    // 2. Get all pending requests on the host's collaborations
    const collabIds = hostCollaborations.map(collab => collab.id);
    console.log(`Collaboration IDs for host ${userId}:`, collabIds);
    
    if (collabIds.length === 0) {
      console.log("Host has no collaborations to match");
      return [];
    }
    
    // Get all collaborations that the user has already made requests on
    // This ensures we never show potential matches for collaborations the user has already interacted with
    const userRequests = await db
      .select({ collaboration_id: requests.collaboration_id })
      .from(requests)
      .where(eq(requests.requester_id, userId));
    
    const alreadyRequestedCollabIds = userRequests.map(r => r.collaboration_id);
    console.log(`Found ${alreadyRequestedCollabIds.length} collaborations already requested by user ${userId}`);
    
    // 3. Get existing accepted requests for the host's collaborations
    // We'll use this to exclude users who have already matched with the host
    // Get accepted requests in both directions (host->requester and requester->host)
    const existingMatches = await db
      .select({
        collaboration_id: requests.collaboration_id,
        requester_id: requests.requester_id,
        host_id: requests.host_id,
      })
      .from(requests)
      .where(
        and(
          or(
            // Requests where the user's collaboration was matched with
            inArray(requests.collaboration_id, collabIds),
            // Also requests where the user was a requester
            eq(requests.requester_id, userId)
          ),
          eq(requests.status, 'accepted')
        )
      );
    
    console.log(`Found ${existingMatches.length} existing accepted requests for host collaborations`);
    
    // Create a Set of user IDs who have already matched with the host
    // in the format "userId_collaborationId" to ensure uniqueness by collaboration
    // Include BOTH host-requester pairs and requester-host pairs for bidirectional checking
    const matchedUserCollabPairs = new Set();
    
    existingMatches.forEach(match => {
      // Add the requester-collaboration pair
      matchedUserCollabPairs.add(`${match.requester_id}_${match.collaboration_id}`);
      
      // Also add the host-collaboration pair
      matchedUserCollabPairs.add(`${match.host_id}_${match.collaboration_id}`);
    });
    
    console.log(`Excluding ${matchedUserCollabPairs.size} user-collaboration pairs that already have matches`);
    
    // Find all pending requests on host's collaborations
    // IMPORTANT: 
    // 1. Exclude the host's own requests (which would create a false "potential match")
    // 2. Exclude collaborations the user has already requested
    const pendingRequests = await db
      .select({
        request: requests,
        user: users,
        company: companies,
      })
      .from(requests)
      .innerJoin(users, eq(requests.requester_id, users.id))
      .innerJoin(companies, eq(users.id, companies.user_id))
      .where(
        and(
          inArray(requests.collaboration_id, collabIds),
          eq(requests.status, 'pending'),
          // CRITICAL FIX: Exclude requests made by the host themselves
          // This prevents users from seeing their own requests as potential matches
          not(eq(requests.requester_id, userId)),
          
          // ROBUST FILTERING: Exclude any collaborations the user has already requested
          alreadyRequestedCollabIds.length > 0
            ? not(inArray(requests.collaboration_id, alreadyRequestedCollabIds))
            : undefined
        )
      )
      .orderBy(desc(requests.created_at));
    
    console.log(`Found ${pendingRequests.length} pending requests on host's collaborations`);
    
    // Add debugging for each potential match
    if (pendingRequests.length > 0) {
      console.log("Pending requests detail:");
      pendingRequests.forEach((req, index) => {
        console.log(`[${index + 1}] Request ID: ${req.request.id}`);
        console.log(`    Collaboration ID: ${req.request.collaboration_id}`);
        console.log(`    User: ${req.user.first_name} ${req.user.last_name || ''} (${req.user.id})`);
        console.log(`    Company: ${req.company.name}`);
      });
    }
    
    // Look for specific users like Jim
    const jimRequest = pendingRequests.find(req => 
      req.user.first_name.toLowerCase() === 'jim' || 
      req.user.first_name.toLowerCase().includes('jim')
    );
    
    if (jimRequest) {
      console.log("Found Jim's potential match:", {
        requestId: jimRequest.request.id,
        userId: jimRequest.user.id,
        firstName: jimRequest.user.first_name,
        lastName: jimRequest.user.last_name,
        company: jimRequest.company.name
      });
    } else {
      console.log("No request from Jim found");
    }
    
    // Get collaboration details for each request
    const enrichedRequests = [];
    
    for (const result of pendingRequests) {
      try {
        // Fetch the full collaboration data for this request
        const collaborationId = result.request.collaboration_id;
        const collaboration = await this.getCollaboration(collaborationId);
        
        // Check if this user-collaboration pair already has a match in EITHER direction
        const userCollabPair = `${result.user.id}_${collaborationId}`;
        const reverseUserCollabPair = `${userId}_${collaborationId}`;
        if (matchedUserCollabPairs.has(userCollabPair) || matchedUserCollabPairs.has(reverseUserCollabPair)) {
          console.log(`Skipping already matched user-collaboration pair: ${userCollabPair} or ${reverseUserCollabPair}`);
          continue; // Skip this request as it already has a match
        }
        
        // Create the enriched object with full collaboration data
        const enriched = {
          ...result.request,
          user: result.user,
          company: result.company,
          
          // Add the complete collaboration as a nested object
          collaboration: collaboration,
          
          // Add flattened fields for easier client-side access
          user_id: result.user.id,
          first_name: result.user.first_name,
          last_name: result.user.last_name,
          company_name: result.company.name, 
          company_description: result.company.short_description || '',
          job_title: result.user.job_title,
          
          // Include collaboration data directly on the object for legacy code
          collab_type: collaboration?.collab_type || "Collaboration",
          title: collaboration?.title || "",
          description: collaboration?.description || "",
          topics: collaboration?.topics || [],
          details: collaboration?.details || {},
          
          // Create potentialMatchData field directly with ALL required fields
          potentialMatchData: {
            user_id: result.user.id,
            first_name: result.user.first_name,
            last_name: result.user.last_name,
            company_name: result.company.name,
            company_description: result.company.short_description || '',
            company_website: result.company.website,
            company_twitter: result.company.twitter_handle || '',
            company_linkedin: result.company.linkedin_url || '',
            job_title: result.user.job_title,
            twitter_followers: result.user.twitter_followers,
            company_twitter_followers: result.company.twitter_followers,
            request_created_at: result.request.created_at?.toISOString() || new Date().toISOString(),
            collaboration_id: result.request.collaboration_id,
            note: result.request.note || ''
          }
        };
        
        enrichedRequests.push(enriched);
      } catch (error) {
        console.error(`Error fetching collaboration ${result.request.collaboration_id}:`, error);
        // Skip this request if we couldn't get the collaboration data
      }
    }
    
    console.log(`Returning ${enrichedRequests.length} potential matches with enhanced data structure`);
    
    if (enrichedRequests.length > 0) {
      // Log the first entry as a sample of the data structure
      console.log("Sample potential match data structure:", JSON.stringify(enrichedRequests[0], null, 2));
    }
    
    return enrichedRequests;
  }
  
  // Collaboration requests methods (legacy version still using swipes/matches)
  async getCollaborationRequestsSummary(userId: string): Promise<{
    recentRequests: any[];
    totalPendingCount: number;
  }> {
    console.log('Getting collaboration requests summary for user:', userId);
    
    // Get user's collaborations
    const userCollaborations = await this.getUserCollaborations(userId);
    const collabIds = userCollaborations.map(collab => collab.id);
    
    if (collabIds.length === 0) {
      return { recentRequests: [], totalPendingCount: 0 };
    }
    
    // Get all pending requests for user's collaborations
    const allRequests = await db
      .select({
        request: requests,
        user: users,
        company: companies,
        collaboration: collaborations,
      })
      .from(requests)
      .innerJoin(users, eq(requests.requester_id, users.id))
      .innerJoin(companies, eq(users.id, companies.user_id))
      .innerJoin(collaborations, eq(requests.collaboration_id, collaborations.id))
      .where(
        and(
          inArray(requests.collaboration_id, collabIds),
          eq(requests.status, 'pending'),
          not(eq(requests.requester_id, userId)) // Exclude host's own requests
        )
      )
      .orderBy(desc(requests.created_at));
    
    // Get recent 4 requests
    const recentRequests = allRequests.slice(0, 4).map(req => ({
      id: req.request.id,
      collaboration_id: req.request.collaboration_id,
      collaboration_type: req.collaboration.collab_type,
      collaboration_title: req.collaboration.title || req.collaboration.collab_type,
      requester: {
        id: req.user.id,
        first_name: req.user.first_name,
        last_name: req.user.last_name,
        avatar_url: null, // Can be enhanced later
      },
      company: {
        name: req.company.name,
        twitter_handle: req.company.twitter_handle,
        logo_url: req.company.logo_url, // FIX: Add missing logo_url field
      },
      note: req.request.note,
      created_at: req.request.created_at,
    }));
    
    return {
      recentRequests,
      totalPendingCount: allRequests.length,
    };
  }

  async getCollaborationRequests(userId: string, options: {
    cursor?: string;
    limit?: number;
    filter?: string;
  }): Promise<{
    items: any[];
    hasMore: boolean;
    nextCursor?: string;
  }> {
    console.log('Getting collaboration requests for user:', userId, 'with options:', options);
    
    const limit = options.limit || 20;
    
    // Get user's collaborations
    const userCollaborations = await this.getUserCollaborations(userId);
    const collabIds = userCollaborations.map(collab => collab.id);
    
    if (collabIds.length === 0) {
      return { items: [], hasMore: false };
    }
    
    // Build base query (including Twitter data)
    let query = db
      .select({
        request: requests,
        user: users,
        company: companies,
        collaboration: collaborations,
        twitter_data: company_twitter_data,
      })
      .from(requests)
      .innerJoin(users, eq(requests.requester_id, users.id))
      .innerJoin(companies, eq(users.id, companies.user_id))
      .leftJoin(company_twitter_data, eq(companies.id, company_twitter_data.company_id))
      .innerJoin(collaborations, eq(requests.collaboration_id, collaborations.id))
      .where(
        and(
          inArray(requests.collaboration_id, collabIds),
          not(eq(requests.requester_id, userId)) // Exclude host's own requests
        )
      );
    
    // Apply filtering based on options.filter
    if (options.filter === 'hidden') {
      // Show only hidden requests
      query = query.where(eq(requests.status, 'hidden'));
    } else {
      // Show only pending requests (default "all" behavior)
      query = query.where(eq(requests.status, 'pending'));
    }
    
    // Handle cursor pagination
    if (options.cursor) {
      const [cursorRequest] = await db
        .select({ created_at: requests.created_at })
        .from(requests)
        .where(eq(requests.id, options.cursor));
      
      if (cursorRequest) {
        query = query.where(lt(requests.created_at, cursorRequest.created_at));
      }
    }
    
    // Apply ordering and limit
    query = query.orderBy(desc(requests.created_at)).limit(limit + 1);
    
    const results = await query;
    
    // Determine pagination
    const hasMore = results.length > limit;
    const items = hasMore ? results.slice(0, limit) : results;
    
    // Group by collaboration
    const groupedRequests = new Map();
    items.forEach(req => {
      const collabId = req.request.collaboration_id;
      if (!groupedRequests.has(collabId)) {
        groupedRequests.set(collabId, {
          collaboration: {
            id: req.collaboration.id,
            title: req.collaboration.title || req.collaboration.collab_type,
            type: req.collaboration.collab_type,
            description: req.collaboration.description,
            topics: req.collaboration.topics,
            created_at: req.collaboration.created_at,
          },
          requests: []
        });
      }
      
      groupedRequests.get(collabId).requests.push({
        id: req.request.id,
        requester: {
          id: req.user.id,
          first_name: req.user.first_name,
          last_name: req.user.last_name,
          twitter_url: req.user.twitter_url,
          avatar_url: null,
        },
        company: {
          name: req.company.name,
          twitter_handle: req.company.twitter_handle,
          job_title: req.company.job_title,
          website: req.company.website,
          logo_url: req.company.logo_url,
          short_description: req.company.short_description,
          long_description: req.company.long_description,
          linkedin_url: req.company.linkedin_url,
          funding_stage: req.company.funding_stage,
          has_token: req.company.has_token,
          token_ticker: req.company.token_ticker,
          blockchain_networks: req.company.blockchain_networks,
          twitter_followers: req.company.twitter_followers,
          tags: req.company.tags,
          created_at: req.company.created_at,
          twitter_data: req.twitter_data ? {
            username: req.twitter_data.username,
            name: req.twitter_data.name,
            bio: req.twitter_data.bio,
            followers_count: req.twitter_data.followers_count,
            following_count: req.twitter_data.following_count,
            tweet_count: req.twitter_data.tweet_count,
            profile_image_url: req.twitter_data.profile_image_url,
            banner_image_url: req.twitter_data.banner_image_url,
            is_verified: req.twitter_data.is_verified,
            is_business_account: req.twitter_data.is_business_account,
            business_category: req.twitter_data.business_category,
            location: req.twitter_data.location,
            website_url: req.twitter_data.website_url,
            twitter_created_at: req.twitter_data.twitter_created_at,
            last_fetched_at: req.twitter_data.last_fetched_at,
          } : null,
        },
        note: req.request.note,
        created_at: req.request.created_at,
      });
    });
    
    const groupedItems = Array.from(groupedRequests.values());
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].request.id : undefined;
    
    return {
      items: groupedItems,
      hasMore,
      nextCursor,
    };
  }

  async acceptCollaborationRequest(userId: string, requestId: string): Promise<{
    success: boolean;
    match?: any;
    error?: string;
  }> {
    console.log('Accepting collaboration request:', requestId, 'by user:', userId);
    
    try {
      const request = await this.getRequestById(requestId);
      if (!request) {
        return { success: false, error: 'Request not found' };
      }
      
      // Verify the user is the host of this request
      if (request.host_id !== userId) {
        return { success: false, error: 'Unauthorized' };
      }
      
      // Update request status to accepted
      await this.updateRequestStatus(requestId, 'accepted');
      
      // Send notification via Telegram
      await notifyMatchCreated(request.host_id, request.requester_id, request.collaboration_id);
      
      return { success: true, match: request };
    } catch (error) {
      console.error('Error accepting collaboration request:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  async hideCollaborationRequest(userId: string, requestId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    console.log('Hiding collaboration request:', requestId, 'by user:', userId);
    
    try {
      const request = await this.getRequestById(requestId);
      if (!request) {
        return { success: false, error: 'Request not found' };
      }
      
      // Verify the user is the host of this request
      if (request.host_id !== userId) {
        return { success: false, error: 'Unauthorized' };
      }
      
      // Update request status to hidden
      await this.updateRequestStatus(requestId, 'hidden');
      
      return { success: true };
    } catch (error) {
      console.error('Error hiding collaboration request:', error);
      return { success: false, error: 'Internal server error' };
    }
  }
  
  // Match methods (legacy - now using requests table)
  async createMatch(match: InsertMatch): Promise<Match> {
    console.log("createMatch called - this is now handled by accepting requests");
    
    // Create a fake match object for legacy compatibility
    // In reality, matches are now just accepted requests
    return {
      id: crypto.randomUUID(),
      collaboration_id: match.collaboration_id,
      host_id: match.host_id,
      requester_id: match.requester_id,
      status: match.status || 'active',
      note: match.note,
      host_accepted: match.host_accepted ?? true,
      requester_accepted: match.requester_accepted ?? false,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }
  
  async getUserMatches(userId: string): Promise<Match[]> {
    console.log(`🧩 getUserMatches - Finding accepted requests for user ${userId}`);
    
    try {
      // Get accepted requests where user is either host or requester
      const acceptedRequests = await db
        .select()
        .from(requests)
        .where(
          and(
            or(
              eq(requests.host_id, userId),
              eq(requests.requester_id, userId)
            ),
            eq(requests.status, 'accepted')
          )
        )
        .orderBy(desc(requests.created_at));
      
      console.log(`🧩 getUserMatches - Found ${acceptedRequests.length} accepted requests`);
      
      // Convert requests to matches for legacy compatibility
      const matches = acceptedRequests.map(req => ({
        id: req.id,
        collaboration_id: req.collaboration_id,
        host_id: req.host_id,
        requester_id: req.requester_id,
        status: 'active' as const,
        note: req.note,
        host_accepted: true,
        requester_accepted: true,
        created_at: req.created_at,
        updated_at: req.created_at,
      }));
      
      if (matches.length > 0) {
        console.log(`🧩 getUserMatches - First match sample:`, JSON.stringify(matches[0], null, 2));
      } else {
        console.log(`🧩 getUserMatches - No matches found in database`);
      }
      
      return matches;
    } catch (error) {
      console.error(`🧩 getUserMatches - Error fetching matches:`, error);
      throw error;
    }
  }
  
  async getUserMatchesWithDetails(userId: string): Promise<any[]> {
    // This is an enriched version of getUserMatches that returns more details
    // for each match including collaboration and user information
    console.log(`🔍 getUserMatchesWithDetails - Getting enriched matches for user ${userId}`);
    
    try {
      // First, directly check if there are accepted requests in the DB for this user
      try {
        const activeMatchesCount = await db.execute(sql`
          SELECT COUNT(*) as count
          FROM requests r
          WHERE (r.host_id = ${userId} OR r.requester_id = ${userId})
          AND r.status = 'accepted'
        `);
        
        const count = activeMatchesCount.rows?.[0]?.count || '0';
        console.log(`🔍 getUserMatchesWithDetails - Found ${count} accepted requests in database for user ${userId}`);
      } catch (countError) {
        console.error(`🔍 getUserMatchesWithDetails - Error counting accepted requests:`, countError);
      }
      
      // Get the basic request data (accepted requests are "matches")
      // The note comes from the requester when they made the request
      // Only return accepted requests (these are the actual matches)
      const matchesResult = await db.execute(sql`
        SELECT 
          r.id as match_id,
          r.created_at as match_date,
          r.status as match_status,
          r.note as swipe_note,
          r.collaboration_id,
          r.host_id,
          r.requester_id
        FROM requests r
        WHERE (r.host_id = ${userId} OR r.requester_id = ${userId})
        AND r.status = 'accepted'
        ORDER BY r.created_at DESC
      `);
      
      // SQL queries return a QueryResult object that has rows property
      const matchesRows = matchesResult.rows || [];
      console.log(`🔍 getUserMatchesWithDetails - Found ${matchesRows.length} basic matches for user ${userId} from raw SQL query`);
      
      // Debug: print the first match details if available
      if (matchesRows.length > 0) {
        console.log(`🔍 getUserMatchesWithDetails - First match: ${JSON.stringify(matchesRows[0], null, 2)}`);
        
        // Print status distribution for debugging
        const statusCounts: Record<string, number> = {};
        matchesRows.forEach((match: any) => {
          statusCounts[match.match_status || 'unknown'] = (statusCounts[match.match_status || 'unknown'] || 0) + 1;
        });
        console.log(`🔍 getUserMatchesWithDetails - Match status distribution:`, statusCounts);
      }
      
      // Use the rows property from the SQL result
      const matchesArray = matchesRows;
      
      if (matchesArray.length === 0) {
        console.log('No matches found for this user');
        return [];
      }
      
      // Now, enrich the data with collaboration details
      const enrichedResults = await Promise.all(matchesArray.map(async (match) => {
        try {
          // Get collaboration details
          const collaborationResult = await db.execute(sql`
            SELECT 
              c.collab_type,
              c.description,
              c.creator_id,
              c.details
            FROM collaborations c
            WHERE c.id = ${match.collaboration_id}
          `);
          
          if (!collaborationResult || !collaborationResult.rows || !collaborationResult.rows.length) {
            console.log(`No collaboration found for match ${match.match_id}`);
            return null;
          }
          
          const collaborationData = collaborationResult.rows[0];
          
          // Determine who is the "other user" based on who the current user is
          const isUserHost = match.host_id === userId;
          const otherUserId = isUserHost ? match.requester_id : match.host_id;
          
          // Get other user details
          const otherUserResult = await db.execute(sql`
            SELECT 
              u.first_name,
              u.last_name,
              u.handle,
              u.twitter_url,
              u.twitter_followers,
              u.linkedin_url
            FROM users u
            WHERE u.id = ${otherUserId}
          `);
          
          if (!otherUserResult || !otherUserResult.rows || !otherUserResult.rows.length) {
            console.log(`No other user found for match ${match.match_id}`);
            return null;
          }
          
          const otherUserData = otherUserResult.rows[0];
          
          // Get company data for the other user
          const companyResult = await db.execute(sql`
            SELECT 
              c.name,
              c.short_description,
              c.website,
              c.twitter_handle,
              c.twitter_followers,
              c.linkedin_url,
              c.funding_stage,
              c.has_token,
              c.token_ticker,
              c.blockchain_networks,
              c.tags,
              c.job_title,
              c.logo_url
            FROM companies c
            WHERE c.user_id = ${otherUserId}
          `);
          
          let companyData = null;
          if (companyResult && companyResult.rows && companyResult.rows.length > 0) {
            companyData = companyResult.rows[0];
          } else {
            console.log(`No company found for other user ${otherUserId} in match ${match.match_id}`);
          }
          
          // Format the details to match what the frontend expects
          return {
            match_id: match.match_id,
            match_date: match.match_date,
            match_status: match.match_status,
            swipe_note: match.swipe_note, // Include the note from the request
            collab_type: collaborationData.collab_type,
            collab_description: collaborationData.description,
            collab_details: collaborationData.details,
            
            // Other user information
            other_user_first_name: otherUserData?.first_name || '',
            other_user_last_name: otherUserData?.last_name || '',
            other_user_handle: otherUserData?.handle || '',
            role_title: companyData?.job_title || 'Unknown Role', // Using job_title from the company table
            other_user_twitter_url: otherUserData?.twitter_url || null,
            other_user_twitter_followers: otherUserData?.twitter_followers || null,
            other_user_linkedin_url: otherUserData?.linkedin_url || null,
            
            // Company information
            company_name: companyData?.name || 'Unknown Company',
            company_description: companyData?.short_description || '',
            company_website: companyData?.website || null,
            company_twitter_handle: companyData?.twitter_handle || null,
            company_twitter_followers: companyData?.twitter_followers || null,
            company_linkedin_url: companyData?.linkedin_url || null,
            company_logo_url: companyData?.logo_url || null, // FIX: Add missing company logo URL field
            funding_stage: companyData?.funding_stage || null,
            has_token: companyData?.has_token || false,
            token_ticker: companyData?.token_ticker || null,
            blockchain_networks: companyData?.blockchain_networks || [],
            company_tags: companyData?.tags || []
          };
        } catch (error) {
          console.error(`Error processing match ${match.match_id}:`, error);
          return null;
        }
      }));
      
      // Filter out any null results
      const validResults = enrichedResults.filter(result => result !== null);
      console.log(`Found ${validResults.length} detailed matches for user ${userId}`);
      
      // Log a sample result for debugging
      if (validResults.length > 0) {
        console.log("Sample match details:", JSON.stringify(validResults[0], null, 2));
      }
      
      return validResults;
    } catch (error) {
      console.error("Failed to fetch matches:", error);
      throw error;
    }
  }
  
  async getCollaborationMatches(collaborationId: string): Promise<Match[]> {
    console.log("Getting matches using requests table");
    
    // Get accepted requests for this collaboration
    const acceptedRequests = await db
      .select()
      .from(requests)
      .where(
        and(
          eq(requests.collaboration_id, collaborationId),
          eq(requests.status, 'accepted')
        )
      )
      .orderBy(desc(requests.created_at));
    
    // Convert to matches for legacy compatibility
    return acceptedRequests.map(req => ({
      id: req.id,
      collaboration_id: req.collaboration_id,
      host_id: req.host_id,
      requester_id: req.requester_id,
      status: 'active' as const,
      note: req.note,
      host_accepted: true,
      requester_accepted: true,
      created_at: req.created_at,
      updated_at: req.created_at,
    }));
  }
  
  async getMatchById(id: string): Promise<Match | undefined> {
    console.log("Getting match using requests table");
    
    const request = await this.getRequestById(id);
    if (!request || request.status !== 'accepted') {
      return undefined;
    }
    
    // Convert to match for legacy compatibility
    return {
      id: request.id,
      collaboration_id: request.collaboration_id,
      host_id: request.host_id,
      requester_id: request.requester_id,
      status: 'active' as const,
      note: request.note,
      host_accepted: true,
      requester_accepted: true,
      created_at: request.created_at,
      updated_at: request.created_at,
    };
  }
  
  async updateMatchStatus(id: string, status: string): Promise<Match | undefined> {
    console.log("updateMatchStatus called - updating request status instead");
    
    try {
      // Map match status to request status
      const requestStatus = status === 'active' ? 'accepted' : status;
      await this.updateRequestStatus(id, requestStatus);
      
      // Return the updated request as a match
      return this.getMatchById(id);
    } catch (error) {
      console.error("Error updating match status:", error);
      throw error;
    }
  }
  
  // Request methods (new unified table)
  async createRequest(request: InsertRequest): Promise<Request> {
    const [newRequest] = await db
      .insert(requests)
      .values({
        ...request,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();
    return newRequest;
  }
  
  async getUserRequestsAsHost(userId: string): Promise<Request[]> {
    return db
      .select()
      .from(requests)
      .where(eq(requests.host_id, userId))
      .orderBy(desc(requests.created_at));
  }
  
  async getUserRequestsAsRequester(userId: string): Promise<Request[]> {
    return db
      .select()
      .from(requests)
      .where(eq(requests.requester_id, userId))
      .orderBy(desc(requests.created_at));
  }
  
  async getCollaborationRequests(collaborationId: string): Promise<Request[]> {
    return db
      .select()
      .from(requests)
      .where(eq(requests.collaboration_id, collaborationId))
      .orderBy(desc(requests.created_at));
  }
  
  async getRequestById(id: string): Promise<Request | undefined> {
    const [request] = await db
      .select()
      .from(requests)
      .where(eq(requests.id, id));
    return request;
  }
  
  async updateRequestStatus(id: string, status: string): Promise<Request | undefined> {
    try {
      const [updatedRequest] = await db
        .update(requests)
        .set({ 
          status,
          updated_at: new Date()
        })
        .where(eq(requests.id, id))
        .returning();
      return updatedRequest;
    } catch (error) {
      console.error("Error updating request status:", error);
      throw error;
    }
  }
  
  async getPendingRequestsForHost(userId: string, filter: 'all' | 'hidden'): Promise<any[]> {
    console.log(`Getting requests for host ${userId} with filter: ${filter}`);
    
    try {
      // Build the query based on filter
      let query = db
        .select({
          request_id: requests.id,
          collaboration_id: requests.collaboration_id,
          requester_id: requests.requester_id,
          host_id: requests.host_id,
          status: requests.status,
          note: requests.note,
          created_at: requests.created_at,
          // Join with collaborations to get collaboration details
          collaboration_title: collaborations.details,
          collaboration_type: collaborations.collab_type,
          collaboration_description: collaborations.description,
          // Join with users to get requester info
          requester_first_name: users.first_name,
          requester_last_name: users.last_name,
          requester_job_title: users.job_title,
          requester_twitter_followers: users.twitter_followers,
          // Join with companies to get company info
          company_name: companies.name,
          company_twitter_handle: companies.twitter_handle,
          company_twitter_followers: companies.twitter_followers,
          company_website: companies.website,
          company_logo_url: companies.logo_url,
          company_tags: companies.tags
        })
        .from(requests)
        .leftJoin(collaborations, eq(requests.collaboration_id, collaborations.id))
        .leftJoin(users, eq(requests.requester_id, users.id))
        .leftJoin(companies, eq(users.company_id, companies.id))
        .where(eq(requests.host_id, userId));
      
      // Apply filter
      if (filter === 'all') {
        // Show only pending requests (not hidden)
        query = query.where(
          and(
            eq(requests.host_id, userId),
            eq(requests.status, 'pending')
          )
        );
      } else if (filter === 'hidden') {
        // Show only hidden requests
        query = query.where(
          and(
            eq(requests.host_id, userId),
            eq(requests.status, 'hidden')
          )
        );
      }
      
      const results = await query.orderBy(desc(requests.created_at));
      
      console.log(`Found ${results.length} requests for host ${userId} with filter ${filter}`);
      return results;
    } catch (error) {
      console.error('Error getting pending requests:', error);
      throw error;
    }
  }
  
  async getCollaborationRequests(userId: string, options: { cursor?: string; limit?: number; filter?: string }): Promise<any> {
    const { cursor, limit = 20, filter = 'all' } = options;
    console.log(`Getting collaboration requests for user ${userId} with filter: ${filter}`);
    
    try {
      // Get all pending requests for the user as host
      const requests = await this.getPendingRequestsForHost(userId, filter as 'all' | 'hidden');
      
      // Apply pagination
      let startIndex = 0;
      if (cursor) {
        const cursorIndex = requests.findIndex(r => r.request_id === cursor);
        if (cursorIndex !== -1) {
          startIndex = cursorIndex + 1;
        }
      }
      
      const paginatedRequests = requests.slice(startIndex, startIndex + limit);
      const hasMore = startIndex + limit < requests.length;
      const nextCursor = hasMore ? paginatedRequests[paginatedRequests.length - 1]?.request_id : undefined;
      
      return {
        requests: paginatedRequests,
        hasMore,
        nextCursor
      };
    } catch (error) {
      console.error('Error getting collaboration requests:', error);
      throw error;
    }
  }
  
  async getCollaborationRequestsSummary(userId: string): Promise<{ pendingCount: number; totalCount: number }> {
    try {
      const requests = await this.getUserRequestsAsHost(userId);
      const pendingCount = requests.filter(r => r.status === 'pending').length;
      const totalCount = requests.length;
      
      return { pendingCount, totalCount };
    } catch (error) {
      console.error('Error getting collaboration requests summary:', error);
      throw error;
    }
  }
  
  async acceptCollaborationRequest(userId: string, requestId: string): Promise<{ success: boolean; error?: string; match?: any }> {
    try {
      const request = await this.getRequestById(requestId);
      if (!request) {
        return { success: false, error: 'Request not found' };
      }
      
      // Verify the user is the host of this request
      if (request.host_id !== userId) {
        return { success: false, error: 'Unauthorized' };
      }
      
      // Update request status to accepted
      await this.updateRequestStatus(requestId, 'accepted');
      
      // Send notification via Telegram
      await notifyMatchCreated(request.host_id, request.requester_id, request.collaboration_id);
      
      return { success: true, match: request };
    } catch (error) {
      console.error('Error accepting collaboration request:', error);
      return { success: false, error: 'Internal server error' };
    }
  }
  
  async hideCollaborationRequest(userId: string, requestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const request = await this.getRequestById(requestId);
      if (!request) {
        return { success: false, error: 'Request not found' };
      }
      
      // Verify the user is the host of this request
      if (request.host_id !== userId) {
        return { success: false, error: 'Unauthorized' };
      }
      
      // Update request status to hidden
      await this.updateRequestStatus(requestId, 'hidden');
      
      return { success: true };
    } catch (error) {
      console.error('Error hiding collaboration request:', error);
      return { success: false, error: 'Internal server error' };
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