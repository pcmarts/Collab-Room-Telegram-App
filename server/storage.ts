import { 
  users, companies, collaborations, collab_notifications, swipes, matches,
  notification_preferences, marketing_preferences, conference_preferences,
  type User, type InsertUser,
  type Collaboration, type InsertCollaboration, 
  type CollabApplication, type InsertCollabApplication,
  type CollabNotification, type InsertCollabNotification,
  type Swipe, type InsertSwipe,
  type Match, type InsertMatch,
  type NotificationPreferences, type MarketingPreferences, type ConferencePreferences
} from "@shared/schema";
import { z } from 'zod';
import { db } from "./db";
import { eq, and, or, inArray, isNull, not, desc, sql, ilike, lt } from "drizzle-orm";
import { notifyMatchCreated, notifyNewCollabRequest } from "./telegram";

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
  
  async searchCollaborations(userId: string, filters: CollaborationFilters): Promise<Collaboration[]> {
    // Call the paginated version but return just the items
    const result = await this.searchCollaborationsPaginated(userId, filters);
    return result.items;
  }
  
  async searchCollaborationsPaginated(userId: string, filters: CollaborationFilters): Promise<PaginatedCollaborations> {
    console.log('============ DEBUG: Search Collaborations Paginated (Join-Based) ============');
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
    
    // Apply filters based on user preferences
    // These only apply if the corresponding filter is enabled

    // 1. Collaboration Types Filter (from collaborations table)
    if (marketingPrefs?.discovery_filter_collab_types_enabled && 
        marketingPrefs?.collabs_to_discover && 
        marketingPrefs.collabs_to_discover.length > 0) {
      
      console.log(`Filtering by collaboration types: ${marketingPrefs.collabs_to_discover.join(', ')}`);
      // Using inArray for single value field (not an array)
      // This implements OR logic between selected collaboration types
      query = query.where(inArray(collaborations.collab_type, marketingPrefs.collabs_to_discover));
    }
    
    // 2. Topics Filter (from collaborations table)
    if (marketingPrefs?.discovery_filter_topics_enabled && 
        marketingPrefs?.filtered_marketing_topics && 
        marketingPrefs.filtered_marketing_topics.length > 0) {
      
      console.log(`Filtering by topics: ${marketingPrefs.filtered_marketing_topics.join(', ')}`);
      
      // Convert JavaScript array to PostgreSQL array format
      const topicsPgArray = '{' + marketingPrefs.filtered_marketing_topics.join(',') + '}';
      console.log(`Converting to PostgreSQL array format: ${topicsPgArray}`);
      
      // Filter for collaborations that match ANY of the selected topics (OR logic)
      // The && operator is the "overlap" operator which checks if arrays have any elements in common
      query = query.where(sql`${collaborations.topics} && ${topicsPgArray}::text[]`);
    }
    
    // 3. Company Tags/Sectors Filter (from companies table)
    if (marketingPrefs?.discovery_filter_company_sectors_enabled && 
        marketingPrefs?.company_tags && 
        marketingPrefs.company_tags.length > 0) {
      
      console.log(`Filtering by company tags/sectors from COMPANIES table: ${marketingPrefs.company_tags.join(', ')}`);
      
      // Convert to PostgreSQL array format
      const tagsPgArray = '{' + marketingPrefs.company_tags.join(',') + '}';
      console.log(`Converting company tags to PostgreSQL array format: ${tagsPgArray}`);
      
      // Filter based on the companies table (joined data) rather than duplicated data
      query = query.where(sql`${companies.tags} && ${tagsPgArray}::text[]`);
    }
    
    // 4. User Twitter Follower Count Filter (from users table)
    if (marketingPrefs?.discovery_filter_user_followers_enabled && 
        marketingPrefs?.twitter_followers) {
      
      console.log(`Filtering by min user Twitter followers from USERS table: ${marketingPrefs.twitter_followers}`);
      // Use the users table for user twitter followers
      query = query.where(sql`${users.twitter_followers} >= ${marketingPrefs.twitter_followers}`);
    }
    
    // 5. Company Twitter Follower Count Filter (from companies table)
    if (marketingPrefs?.discovery_filter_company_followers_enabled && 
        marketingPrefs?.company_twitter_followers) {
      
      console.log(`Filtering by min company Twitter followers from COMPANIES table: ${marketingPrefs.company_twitter_followers}`);
      // Use the companies table instead of the duplicated data in collaborations
      query = query.where(sql`${companies.twitter_followers} >= ${marketingPrefs.company_twitter_followers}`);
    }
    
    // 6. Funding Stages Filter (from companies table)
    if (marketingPrefs?.discovery_filter_funding_stages_enabled && 
        marketingPrefs?.funding_stage) {
      
      // Convert comma-separated string to array
      const fundingStages = marketingPrefs.funding_stage.split(',');
      console.log(`Filtering by funding stages from COMPANIES table: ${fundingStages.join(', ')}`);
      
      // Convert to PostgreSQL array format
      const fundingStagesPgArray = '{' + fundingStages.join(',') + '}';
      console.log(`Converting funding stages to PostgreSQL array format: ${fundingStagesPgArray}`);
      
      // Use the companies table for funding stage data
      query = query.where(sql`${companies.funding_stage} = ANY(${fundingStagesPgArray}::text[])`);
    }
    
    // 7. Token Status Filter (from companies table)
    if (marketingPrefs?.discovery_filter_token_status_enabled) {
      console.log(`Filtering by token status from COMPANIES table: ${marketingPrefs.company_has_token}`);
      // Use the companies table for token status
      query = query.where(sql`${companies.has_token} = ${marketingPrefs.company_has_token}`);
    }
    
    // 8. Blockchain Networks Filter (from companies table)
    if (marketingPrefs?.discovery_filter_blockchain_networks_enabled && 
        marketingPrefs?.company_blockchain_networks && 
        marketingPrefs.company_blockchain_networks.length > 0) {
      
      console.log(`Filtering by blockchain networks from COMPANIES table: ${marketingPrefs.company_blockchain_networks.join(', ')}`);
      
      // Convert to PostgreSQL array format
      const networksPgArray = '{' + marketingPrefs.company_blockchain_networks.join(',') + '}';
      console.log(`Converting blockchain networks to PostgreSQL array format: ${networksPgArray}`);
      
      // Use the companies table for blockchain networks data
      // This is the key change to fix the blockchain networks filter issue
      query = query.where(sql`${companies.blockchain_networks} && ${networksPgArray}::text[]`);
      
      // Add debug logging to verify the filter is being applied correctly
      console.log(`Applied blockchain networks filter using companies.blockchain_networks`);
    }
    
    // Apply cursor-based pagination if a cursor is provided
    if (filters.cursor) {
      console.log(`Using cursor-based pagination with cursor: ${filters.cursor}`);
      
      try {
        // Find the creation timestamp of the cursor collaboration
        const [cursorCollab] = await db
          .select({ created_at: collaborations.created_at })
          .from(collaborations)
          .where(eq(collaborations.id, filters.cursor));
        
        if (cursorCollab) {
          console.log(`Found cursor collaboration with timestamp: ${cursorCollab.created_at}`);
          
          // Add a filter to get only collaborations older than the cursor
          query = query.where(
            sql`${collaborations.created_at} < ${cursorCollab.created_at}`
          );
        } else {
          console.warn(`Cursor collaboration not found: ${filters.cursor}`);
        }
      } catch (err) {
        console.error('Error applying cursor-based pagination:', err);
      }
    }
    
    // Add additional debug logging
    console.log('Final joined filter query constructed, executing and returning results');
    
    // Get the collaborations with joined data, with limit + 1 to determine if there are more
    const rawResults = await query
      .orderBy(desc(collaborations.created_at))
      .limit(limit + 1);
      
    // Map the joined results back to just the collaborations
    // This ensures backward compatibility with existing frontend code
    const rawCollaborations = rawResults.map(result => result.collaboration);
    
    // Determine if there are more collaborations
    const hasMore = rawCollaborations.length > limit;
    
    // Remove the extra item if we have more than the limit
    const limitedCollaborations = hasMore ? rawCollaborations.slice(0, limit) : rawCollaborations;
    
    // ADDITIONAL SAFETY CHECK: Double check that no excluded IDs made it through the query
    // This shouldn't be necessary if the SQL query worked correctly, but we're adding it as a fallback
    // This is especially important in case of race conditions where swipes happen during the query execution
    
    // We need to make sure NO MATTER WHAT that:
    // 1. User's own collaborations are filtered out (using creator_id)
    // 2. Previously swiped collaborations are filtered out
    // 3. Any excludeIds from the request are filtered out
    
    // First check for previously swiped collaborations and excludeIds
    const filteredCollaborations = limitedCollaborations.filter(collab => {
      // Should exclude if:
      // 1. Creator ID matches current user (user's own collaboration)
      const isOwnCollab = collab.creator_id === userId;
      // 2. ID is in the excludeIds array (previously swiped or specifically excluded)
      const isExcludedId = excludeIds.includes(collab.id);
      
      // Keep only if BOTH conditions are false
      return !isOwnCollab && !isExcludedId;
    });
    
    // If we filtered out any collaborations, log a warning
    if (filteredCollaborations.length < limitedCollaborations.length) {
      console.warn(`WARNING: Found and removed ${limitedCollaborations.length - filteredCollaborations.length} collaborations that should have been excluded!`);
      
      // Log exactly which IDs were excluded and why
      const problemCollabs = limitedCollaborations.filter(collab => 
        collab.creator_id === userId || excludeIds.includes(collab.id)
      );
      
      console.warn(`IDs that were supposed to be excluded but appeared in results:`, 
        problemCollabs.map(collab => collab.id)
      );
      
      // Log the detailed reason for each problem collab
      problemCollabs.forEach(collab => {
        if (collab.creator_id === userId) {
          console.warn(`Collab ${collab.id} was created by the current user (${userId}) and should have been excluded`);
        }
        if (excludeIds.includes(collab.id)) {
          console.warn(`Collab ${collab.id} was in the excludeIds array and should have been excluded`);
        }
      });
    }
    
    // Replace the limitedCollaborations with our filtered version
    limitedCollaborations.length = 0;
    limitedCollaborations.push(...filteredCollaborations);
    
    // The next cursor will be the ID of the last item in the current page
    const nextCursor = hasMore && limitedCollaborations.length > 0 
      ? limitedCollaborations[limitedCollaborations.length - 1].id 
      : undefined;
    
    console.log(`Returning ${limitedCollaborations.length} collaborations with hasMore=${hasMore}`);
    
    // Enhance collaborations with creator company info
    const enhancedCollaborations = await Promise.all(limitedCollaborations.map(async (collab) => {
      try {
        // Find the company associated with the creator_id
        const [company] = await db
          .select()
          .from(companies)
          .where(eq(companies.user_id, collab.creator_id));
        
        if (company) {
          // Add all company data to the collaboration object
          return {
            ...collab,
            creator_company_name: company.name,
            // Add all company information
            company_data: {
              id: company.id,
              name: company.name,
              short_description: company.short_description,
              long_description: company.long_description,
              website: company.website,
              job_title: company.job_title,
              twitter_handle: company.twitter_handle,
              twitter_followers: company.twitter_followers,
              linkedin_url: company.linkedin_url,
              funding_stage: company.funding_stage,
              has_token: company.has_token,
              token_ticker: company.token_ticker,
              blockchain_networks: company.blockchain_networks,
              tags: company.tags
            }
          };
        }
        
        return collab;
      } catch (err) {
        console.error('Error getting company info for collaboration:', err);
        return collab;
      }
    }));
    
    return {
      items: enhancedCollaborations,
      hasMore,
      nextCursor
    };
  }
  
  async updateCollaborationStatus(id: string, status: string): Promise<Collaboration | undefined> {
    try {
      // Make sure status is either 'active' or 'paused'
      if (status !== 'active' && status !== 'paused') {
        throw new Error('Invalid status value. Status must be either "active" or "paused".');
      }
      
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
  
  // Collaboration applications
  // Updated application methods to use swipes instead of collab_applications
  async applyToCollaboration(application: InsertCollabApplication): Promise<CollabApplication> {
    console.log("Creating a swipe right from application data:", application);
    
    // Create a swipe right on the collaboration
    const [newSwipe] = await db
      .insert(swipes)
      .values({
        user_id: application.applicant_id,
        collaboration_id: application.collaboration_id,
        direction: 'right',
        details: application.details, // Store application details in swipe details
        created_at: new Date()
      })
      .returning();
    
    // Convert swipe to CollabApplication format for backward compatibility
    return {
      id: newSwipe.id,
      collaboration_id: newSwipe.collaboration_id,
      applicant_id: newSwipe.user_id,
      status: 'pending', // Default status for new applications
      details: newSwipe.details,
      created_at: newSwipe.created_at || new Date()
    };
  }
  
  async getCollaborationApplications(collaborationId: string): Promise<CollabApplication[]> {
    console.log("Getting applications (swipes) for collaboration:", collaborationId);
    
    // Get all "right" swipes for this collaboration
    const swipesData = await db
      .select()
      .from(swipes)
      .where(and(
        eq(swipes.collaboration_id, collaborationId),
        eq(swipes.direction, 'right')
      ))
      .orderBy(desc(swipes.created_at));
    
    // Convert swipes to CollabApplication format
    return swipesData.map(swipe => ({
      id: swipe.id,
      collaboration_id: swipe.collaboration_id,
      applicant_id: swipe.user_id,
      status: 'pending', // Default status for existing applications
      details: swipe.details,
      created_at: swipe.created_at || new Date()
    }));
  }
  
  async getUserApplications(userId: string): Promise<CollabApplication[]> {
    console.log("Getting applications (swipes) by user:", userId);
    
    // Get all "right" swipes by this user
    const swipesData = await db
      .select()
      .from(swipes)
      .where(and(
        eq(swipes.user_id, userId),
        eq(swipes.direction, 'right')
      ))
      .orderBy(desc(swipes.created_at));
    
    // Convert swipes to CollabApplication format
    return swipesData.map(swipe => ({
      id: swipe.id,
      collaboration_id: swipe.collaboration_id,
      applicant_id: swipe.user_id,
      status: 'pending', // Default status
      details: swipe.details,
      created_at: swipe.created_at || new Date()
    }));
  }
  
  async updateApplicationStatus(id: string, status: string): Promise<CollabApplication | undefined> {
    console.log("Updating application (swipe) status:", id, status);
    
    // This is now a no-op as we're using swipes instead of applications
    // But we need to maintain backward compatibility
    
    // Find the swipe
    const [swipe] = await db
      .select()
      .from(swipes)
      .where(eq(swipes.id, id));
    
    if (!swipe) {
      return undefined;
    }
    
    // If status is 'accepted', create a match
    if (status === 'accepted') {
      // Get the collaboration to find the creator_id
      const [collaboration] = await db
        .select()
        .from(collaborations)
        .where(eq(collaborations.id, swipe.collaboration_id));
      
      if (collaboration) {
        // Create match
        await this.createMatch({
          collaboration_id: swipe.collaboration_id,
          requester_id: swipe.user_id,
          host_id: collaboration.creator_id,
          status: 'active',
          created_at: new Date()
        });
      }
    }
    
    // Return converted swipe as CollabApplication
    return {
      id: swipe.id,
      collaboration_id: swipe.collaboration_id,
      applicant_id: swipe.user_id,
      status: status, // Use the updated status
      details: swipe.details,
      created_at: swipe.created_at || new Date()
    };
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
    const [notification] = await db
      .update(collab_notifications)
      .set({ is_read: true })
      .where(eq(collab_notifications.id, id))
      .returning();
    return notification;
  }
  
  async markNotificationAsSent(id: string): Promise<CollabNotification | undefined> {
    const [notification] = await db
      .update(collab_notifications)
      .set({ is_sent: true })
      .where(eq(collab_notifications.id, id))
      .returning();
    return notification;
  }
  
  // Swipe methods
  async createSwipe(swipe: InsertSwipe): Promise<Swipe> {
    try {
      console.log("Creating swipe with data:", JSON.stringify(swipe, null, 2));
      
      // Insert the new swipe
      const [newSwipe] = await db
        .insert(swipes)
        .values({
          ...swipe,
          details: swipe.details || {} // Ensure details is set (not undefined)
        })
        .returning();
      
      console.log("Swipe created:", JSON.stringify(newSwipe, null, 2));

      // If this is a right swipe, get the collaboration details for notifications
      if (swipe.direction === 'right') {
        // Get the collaboration details
        const [collaboration] = await db
          .select()
          .from(collaborations)
          .where(eq(collaborations.id, swipe.collaboration_id));
        
        if (collaboration) {
          // Send a notification to the host (collaboration creator)
          // but only if the swiper is not the host themselves
          if (collaboration.creator_id !== swipe.user_id) {
            try {
              console.log("Sending collaboration request notification to host:", {
                hostId: collaboration.creator_id,
                requesterId: swipe.user_id,
                collaborationId: swipe.collaboration_id
              });
              
              // Send the notification using our new function
              await notifyNewCollabRequest(
                collaboration.creator_id,
                swipe.user_id,
                swipe.collaboration_id,
                newSwipe.note || undefined // Pass the optional note, convert null to undefined
              );
            } catch (notifyError) {
              console.error("Error sending collab request notification:", notifyError);
              // Continue processing even if notification fails
            }
          }
          
          // Check for a match
          await this.checkForMatch(newSwipe);
        }
      }
      
      return newSwipe;
    } catch (error) {
      console.error("Error creating swipe:", error);
      throw error;
    }
  }
  
  // Helper method to check for a match when a new swipe is created
  private async checkForMatch(newSwipe: Swipe): Promise<void> {
    try {
      console.log("Checking for match with new swipe:", newSwipe.id);
      
      // Get the collaboration details
      const collaboration = await this.getCollaboration(newSwipe.collaboration_id);
      if (!collaboration) {
        console.error("Collaboration not found:", newSwipe.collaboration_id);
        return;
      }
      
      // Determine if the user is swiping on their own collaboration
      const isUserTheHost = newSwipe.user_id === collaboration.creator_id;
      if (isUserTheHost) {
        console.log("User is swiping on their own collaboration - skipping match check");
        return;
      }
      
      // If requester swiped right on host's collaboration, 
      // check if host has swiped right on any of requester's collaborations
      const hostId = collaboration.creator_id;
      const requesterId = newSwipe.user_id;
      
      console.log(`Checking for match: Host ID ${hostId}, Requester ID ${requesterId}`);
      
      // Get requester's collaborations
      const requesterCollabs = await this.getUserCollaborations(requesterId);
      if (requesterCollabs.length === 0) {
        console.log("Requester has no collaborations - no match possible");
        return;
      }
      
      const requesterCollabIds = requesterCollabs.map(collab => collab.id);
      
      // Check if host has swiped right on any of requester's collaborations
      const hostRightSwipes = await db
        .select()
        .from(swipes)
        .where(and(
          eq(swipes.user_id, hostId),
          inArray(swipes.collaboration_id, requesterCollabIds),
          eq(swipes.direction, 'right')
        ));
      
      if (hostRightSwipes.length === 0) {
        console.log("No matching right swipes found from host");
        return;
      }
      
      console.log(`Found ${hostRightSwipes.length} potential matches from host`);
      
      // We have a match! Create a match record and notifications
      const matchedSwipe = hostRightSwipes[0]; // Use the first match found
      const matchedCollab = requesterCollabs.find(c => c.id === matchedSwipe.collaboration_id);
      
      if (!matchedCollab) {
        console.error("Matched collaboration not found:", matchedSwipe.collaboration_id);
        return;
      }
      
      console.log("Creating match between:", {
        host_collab: newSwipe.collaboration_id,
        host_id: hostId,
        requester_collab: matchedCollab.id,
        requester_id: requesterId
      });
      
      // Create the match record with the note from the swipe
      const match = await this.createMatch({
        collaboration_id: newSwipe.collaboration_id,
        host_id: hostId,
        requester_id: requesterId,
        note: newSwipe.note // Directly copy the note from the swipe to the match
      });
      
      // Log detailed info about note transfer
      console.log("Note transfer details:", {
        swipeId: newSwipe.id,
        swipeNote: newSwipe.note,
        matchId: match.id,
        matchNote: match.note
      });
      
      console.log("Match created:", match);
      
      // Get user details for notifications
      const host = await this.getUser(hostId);
      const requester = await this.getUser(requesterId);
      
      if (!host || !requester) {
        console.error("Could not find host or requester for notifications");
        return;
      }
      
      // Create notifications for both parties
      await this.createNotification({
        user_id: hostId,
        collaboration_id: newSwipe.collaboration_id,
        type: 'match',
        content: `${requester.first_name} ${requester.last_name || ''} matched with your ${collaboration.collab_type} collaboration!`,
        is_read: false,
        is_sent: false,
        created_at: new Date()
      });
      
      await this.createNotification({
        user_id: requesterId,
        collaboration_id: matchedCollab.id,
        type: 'match',
        content: `You matched with ${host.first_name} ${host.last_name || ''}'s ${collaboration.collab_type} collaboration!`,
        is_read: false,
        is_sent: false,
        created_at: new Date()
      });
      
      console.log("Match notifications created successfully");
      
      // Send Telegram notifications to both users
      try {
        console.log("Sending Telegram match notifications to users:", {
          hostId,
          requesterId,
          collaborationId: newSwipe.collaboration_id
        });
        
        await notifyMatchCreated(hostId, requesterId, newSwipe.collaboration_id);
        console.log("Telegram notifications sent successfully");
      } catch (telegramError) {
        // Don't fail the process if Telegram notification fails
        console.error("Error sending Telegram notifications:", telegramError);
      }
    } catch (error) {
      console.error("Error checking for match:", error);
    }
  }
  
  async getUserSwipes(userId: string): Promise<Swipe[]> {
    try {
      return db
        .select()
        .from(swipes)
        .where(eq(swipes.user_id, userId))
        .orderBy(desc(swipes.created_at));
    } catch (error) {
      console.error("Error getting user swipes:", error);
      throw error;
    }
  }
  
  async getCollaborationSwipes(collaborationId: string): Promise<Swipe[]> {
    try {
      return db
        .select()
        .from(swipes)
        .where(eq(swipes.collaboration_id, collaborationId))
        .orderBy(desc(swipes.created_at));
    } catch (error) {
      console.error("Error getting collaboration swipes:", error);
      throw error;
    }
  }
  
  async getPotentialMatchesForHost(userId: string): Promise<any[]> {
    try {
      // 1. Get all collaborations created by this user
      const userCollabs = await this.getUserCollaborations(userId);
      if (!userCollabs.length) {
        return [];
      }
      
      const collabIds = userCollabs.map(collab => collab.id);
      
      // 2. Find all right swipes by other users on these collaborations
      const rightSwipes = await db
        .select({
          swipe: swipes,
          user: users,
          company: companies,
          collaboration: collaborations
        })
        .from(swipes)
        .where(and(
          inArray(swipes.collaboration_id, collabIds),
          eq(swipes.direction, 'right') // Only get right swipes (interest)
        ))
        .innerJoin(users, eq(swipes.user_id, users.id))
        .innerJoin(companies, eq(users.id, companies.user_id))
        .innerJoin(collaborations, eq(swipes.collaboration_id, collaborations.id))
        .orderBy(desc(swipes.created_at));
      
      // 3. Filter out potential matches that have already been swiped on
      
      // First, get all swipes made by the host for regular collaborations
      const hostSwipes = await this.getUserSwipes(userId);
      const hostSwipeMap = new Map();
      
      // Create a map of user_id -> collaboration_id -> direction
      hostSwipes.forEach(swipe => {
        if (!hostSwipeMap.has(swipe.user_id)) {
          hostSwipeMap.set(swipe.user_id, new Map());
        }
        hostSwipeMap.get(swipe.user_id).set(swipe.collaboration_id, swipe.direction);
      });
      
      // Also track swipes made on potential matches by their swipe ID
      // This is critical - we need to exclude potential matches that have already been swiped on
      const swipeIdSet = new Set<string>();
      hostSwipes.forEach(swipe => {
        swipeIdSet.add(swipe.id);
      });
      
      // 3b. Get all existing matches for the user to filter out already matched collaborations
      const userMatches = await this.getUserMatches(userId);
      console.log(`Found ${userMatches.length} existing matches for user ${userId}`);
      
      // Create a set of collaboration IDs that are already in the matches table
      const matchedCollaborationIds = new Set<string>(
        userMatches.map(match => match.collaboration_id)
      );
      
      // Filter out already-swiped users or already-swiped potential matches
      const potentialMatches = rightSwipes.filter(match => {
        // Skip if this swipe ID is in our previously swiped set
        if (swipeIdSet.has(match.swipe.id)) {
          console.log(`Filtering out already swiped potential match with swipe ID: ${match.swipe.id}`);
          return false;
        }
        
        // Check if this collaboration already has a match
        if (matchedCollaborationIds.has(match.collaboration.id)) {
          console.log(`Filtering out already matched collaboration with ID: ${match.collaboration.id}`);
          return false;
        }
        
        // Also check the traditional way - if host has swiped on this user's collaboration
        const userMap = hostSwipeMap.get(match.user.id);
        if (!userMap) return true; // Host hasn't swiped on this user at all
        
        // Check if host has swiped on this user for this collaboration
        return !userMap.has(match.collaboration.id);
      });
      
      // 4. Format the data for the frontend
      return potentialMatches.map(match => ({
        id: match.swipe.id,
        swipe_id: match.swipe.id,
        user_id: match.user.id,
        collaboration_id: match.collaboration.id,
        collaboration_type: match.collaboration.collab_type,
        collaboration_description: match.collaboration.description,
        collaboration_topics: match.collaboration.topics,
        swipe_direction: match.swipe.direction,
        swipe_created_at: match.swipe.created_at,
        user_first_name: match.user.first_name,
        user_last_name: match.user.last_name,
        user_twitter_followers: match.user.twitter_followers,
        company_name: match.company.name,
        company_job_title: match.company.job_title,
        company_twitter_followers: match.company.twitter_followers,
        company_description: match.company.short_description,
        company_website: match.company.website,
        company_twitter: match.company.twitter_handle,
        company_linkedin: match.company.linkedin_url,
        requester_company: match.company.name,
        requester_role: match.company.job_title,
        note: match.swipe.note // Include the personalized note in potential matches
      }));
    } catch (error) {
      console.error("Error getting potential matches for host:", error);
      throw error;
    }
  }
  
  // Match methods
  async createMatch(match: InsertMatch): Promise<Match> {
    try {
      const [newMatch] = await db
        .insert(matches)
        .values(match)
        .returning();
      return newMatch;
    } catch (error) {
      console.error("Error creating match:", error);
      throw error;
    }
  }

  async getUserMatches(userId: string): Promise<Match[]> {
    try {
      // Get matches where the user is either host or requester
      const userMatches = await db
        .select()
        .from(matches)
        .where(
          or(
            eq(matches.host_id, userId),
            eq(matches.requester_id, userId)
          )
        )
        .orderBy(desc(matches.created_at));
      return userMatches;
    } catch (error) {
      console.error("Error getting user matches:", error);
      throw error;
    }
  }
  
  async getUserMatchesWithDetails(userId: string): Promise<any[]> {
    try {
      console.log(`Fetching complete match details for user ${userId}`);
      
      // Get matches with collaboration and user details in a single query
      const result = await db.execute(sql`
        WITH user_matches AS (
          SELECT 
            m.*,
            CASE
              WHEN m.host_id = ${userId} THEN m.requester_id
              ELSE m.host_id
            END AS other_user_id,
            CASE
              WHEN m.host_id = ${userId} THEN 'host'
              ELSE 'requester'
            END AS user_role
          FROM matches m
          WHERE m.host_id = ${userId} OR m.requester_id = ${userId}
          ORDER BY m.created_at DESC
        )
        SELECT
          um.id AS match_id,
          um.collaboration_id,
          um.status AS match_status,
          um.created_at AS match_date,
          um.user_role,
          um.note AS match_note,
          
          -- Collaboration details
          c.id AS collab_id,
          c.collab_type,
          c.description AS collab_description,
          c.topics AS collab_topics,
          c.status AS collab_status,
          
          -- Other user details
          ou.id AS other_user_id,
          ou.first_name AS other_user_first_name,
          ou.last_name AS other_user_last_name,
          ou.handle AS other_user_handle,
          ou.twitter_followers AS other_user_twitter_followers,
          ou.twitter_url AS other_user_twitter_url,
          ou.linkedin_url AS other_user_linkedin_url,
          
          -- Other user's company details
          comp.id AS company_id,
          comp.name AS company_name,
          comp.job_title AS role_title,
          comp.short_description AS company_description,
          comp.website AS company_website,
          comp.twitter_handle AS company_twitter_handle,
          comp.twitter_followers AS company_twitter_followers,
          comp.linkedin_url AS company_linkedin_url,
          comp.funding_stage,
          comp.has_token,
          comp.token_ticker,
          comp.blockchain_networks,
          comp.tags AS company_tags
        FROM user_matches um
        JOIN collaborations c ON um.collaboration_id = c.id
        JOIN users ou ON um.other_user_id = ou.id
        LEFT JOIN companies comp ON ou.id = comp.user_id
        ORDER BY um.created_at DESC
      `);
      
      // Access the rows directly from the query result and convert to array of objects
      const matchesResult = Array.isArray(result) ? result : [];
      const rows = 'rows' in result ? result.rows : matchesResult;
      const userMatchesWithDetails = Array.isArray(rows) ? rows : [];
      
      console.log(`Found ${userMatchesWithDetails.length} enriched matches for user ${userId}`);
      return userMatchesWithDetails;
    } catch (error) {
      console.error("Error getting user matches with details:", error);
      throw error;
    }
  }

  async getCollaborationMatches(collaborationId: string): Promise<Match[]> {
    try {
      const collabMatches = await db
        .select()
        .from(matches)
        .where(eq(matches.collaboration_id, collaborationId))
        .orderBy(desc(matches.created_at));
      return collabMatches;
    } catch (error) {
      console.error("Error getting collaboration matches:", error);
      throw error;
    }
  }

  async getMatchById(id: string): Promise<Match | undefined> {
    try {
      const [match] = await db
        .select()
        .from(matches)
        .where(eq(matches.id, id));
      return match;
    } catch (error) {
      console.error("Error getting match by ID:", error);
      throw error;
    }
  }

  async updateMatchStatus(id: string, status: string): Promise<Match | undefined> {
    try {
      // Make sure status is valid (active, archived, completed)
      if (!['active', 'archived', 'completed'].includes(status)) {
        throw new Error('Invalid status value. Status must be one of: active, archived, completed');
      }
      
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
  
  // Notification preferences
  async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined> {
    const [userPreferences] = await db
      .select()
      .from(notification_preferences)
      .where(eq(notification_preferences.user_id, userId));
    return userPreferences;
  }
  
  async updateUserNotificationPreferences(userId: string, prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences | undefined> {
    // Check if notification preferences exist for this user
    const existingPrefs = await this.getUserNotificationPreferences(userId);
    
    // Log the current state for debugging
    console.log(`[updateUserNotificationPreferences] User ${userId} - Existing prefs:`, existingPrefs);
    console.log(`[updateUserNotificationPreferences] Updating with:`, prefs);
    
    if (existingPrefs) {
      // Update existing preferences with updated_at timestamp
      const [updatedPrefs] = await db
        .update(notification_preferences)
        .set({
          ...prefs,
          updated_at: new Date()
        })
        .where(eq(notification_preferences.id, existingPrefs.id))
        .returning();
      
      console.log(`[updateUserNotificationPreferences] Updated preferences:`, updatedPrefs);
      return updatedPrefs;
    } else {
      // Create new preferences with both timestamps
      const [newPrefs] = await db
        .insert(notification_preferences)
        .values({
          user_id: userId,
          notifications_enabled: prefs.notifications_enabled !== undefined ? prefs.notifications_enabled : true,
          notification_frequency: prefs.notification_frequency || 'Daily',
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning();
      
      console.log(`[updateUserNotificationPreferences] Created new preferences:`, newPrefs);
      return newPrefs;
    }
  }
  
  // Marketing preferences methods
  async getUserMarketingPreferences(userId: string): Promise<MarketingPreferences | undefined> {
    const [userPreferences] = await db
      .select()
      .from(marketing_preferences)
      .where(eq(marketing_preferences.user_id, userId));
    return userPreferences;
  }
  
  async updateUserMarketingPreferences(userId: string, prefs: Partial<MarketingPreferences>): Promise<MarketingPreferences | undefined> {
    // Check if preferences exist for this user
    const existingPrefs = await this.getUserMarketingPreferences(userId);
    
    // Ensure all array fields are properly initialized and validated
    const safePrefs = {
      ...prefs,
      collabs_to_discover: Array.isArray(prefs.collabs_to_discover) ? prefs.collabs_to_discover : [],
      collabs_to_host: Array.isArray(prefs.collabs_to_host) ? prefs.collabs_to_host : [],
      twitter_collabs: Array.isArray(prefs.twitter_collabs) ? prefs.twitter_collabs : [],
      filtered_marketing_topics: Array.isArray(prefs.filtered_marketing_topics) ? prefs.filtered_marketing_topics : [],
      company_blockchain_networks: Array.isArray(prefs.company_blockchain_networks) ? prefs.company_blockchain_networks : []
    };
    
    console.log("STORAGE: Saving marketing preferences with arrays:", {
      collabs_to_discover: safePrefs.collabs_to_discover,
      collabs_to_host: safePrefs.collabs_to_host,
      twitter_collabs: safePrefs.twitter_collabs,
      filtered_marketing_topics: safePrefs.filtered_marketing_topics,
      company_blockchain_networks: safePrefs.company_blockchain_networks
    });
    
    if (existingPrefs) {
      // Update existing preferences
      const [updatedPrefs] = await db
        .update(marketing_preferences)
        .set(safePrefs)
        .where(eq(marketing_preferences.id, existingPrefs.id))
        .returning();
      return updatedPrefs;
    } else {
      // Create new preferences
      const [newPrefs] = await db
        .insert(marketing_preferences)
        .values({
          user_id: userId,
          collabs_to_discover: safePrefs.collabs_to_discover,
          collabs_to_host: safePrefs.collabs_to_host,
          twitter_collabs: safePrefs.twitter_collabs,
          filtered_marketing_topics: safePrefs.filtered_marketing_topics,
          company_blockchain_networks: safePrefs.company_blockchain_networks,
          discovery_filter_enabled: prefs.discovery_filter_enabled || false,
          discovery_filter_topics_enabled: prefs.discovery_filter_topics_enabled || false,
          discovery_filter_company_followers_enabled: prefs.discovery_filter_company_followers_enabled || false,
          discovery_filter_user_followers_enabled: prefs.discovery_filter_user_followers_enabled || false,
          discovery_filter_funding_stages_enabled: prefs.discovery_filter_funding_stages_enabled || false,
          discovery_filter_token_status_enabled: prefs.discovery_filter_token_status_enabled || false,
          discovery_filter_company_sectors_enabled: prefs.discovery_filter_company_sectors_enabled || false,
          discovery_filter_blockchain_networks_enabled: prefs.discovery_filter_blockchain_networks_enabled || false
        })
        .returning();
      return newPrefs;
    }
  }
  
  // Conference preferences methods
  async getUserConferencePreferences(userId: string): Promise<ConferencePreferences | undefined> {
    const [userPreferences] = await db
      .select()
      .from(conference_preferences)
      .where(eq(conference_preferences.user_id, userId));
    return userPreferences;
  }
  
  async updateUserConferencePreferences(userId: string, prefs: Partial<ConferencePreferences>): Promise<ConferencePreferences | undefined> {
    // Check if preferences exist for this user
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
}

export const storage = new DatabaseStorage();