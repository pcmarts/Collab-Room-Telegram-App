// This file contains a temporary debug route to check database content
import { Express, Request, Response } from 'express';
import { db } from './db';
import { 
  users, 
  collaborations, 
  swipes, 
  marketing_preferences 
} from '../shared/schema';
import { eq, not, and, sql } from 'drizzle-orm';

export function registerDebugRoutes(app: Express) {
  // Debug endpoint to test discovery cards directly without caching
  app.get('/api/debug/discovery-cards', async (req: Request, res: Response) => {
    try {
      const telegramId = req.query.telegramId?.toString() || '1211030693';  // Default to Paul's ID
      console.log(`Debug endpoint: Getting discovery cards for telegram ID: ${telegramId}`);
      
      // Disable caching completely for debug endpoints
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Get user
      const [dbUser] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramId));
      
      if (!dbUser) {
        return res.status(404).json({ error: `User not found with telegramID: ${telegramId}` });
      }
      
      // 1. Get the user's swipes to exclude already swiped collaborations
      const userSwipes = await db
        .select()
        .from(swipes)
        .where(eq(swipes.user_id, dbUser.id));
      
      // Extract the IDs of collaborations the user has already swiped on
      const swipedCollaborationIds = userSwipes.map(swipe => swipe.collaboration_id);
      
      console.log(`Debug endpoint: User has swiped on ${swipedCollaborationIds.length} collaborations`);
      
      // 2. Get all active collaborations not created by this user
      console.log(`Debug endpoint: Filtering out collaborations created by user ID: ${dbUser.id}`);
      
      // First check if the user has any collaborations
      const userCollabs = await db
        .select()
        .from(collaborations)
        .where(eq(collaborations.creator_id, dbUser.id));
      
      console.log(`Debug endpoint: User has created ${userCollabs.length} collaborations`);
      if (userCollabs.length > 0) {
        console.log(`Debug endpoint: Sample user collab: ${JSON.stringify({
          id: userCollabs[0].id,
          creator_id: userCollabs[0].creator_id
        })}`);
      }
      
      // Get all active collaborations
      const allActiveCollabs = await db
        .select()
        .from(collaborations)
        .where(eq(collaborations.status, 'active'));
      
      console.log(`Debug endpoint: Total active collaborations: ${allActiveCollabs.length}`);
      
      // Filter them manually to ensure we're correctly excluding user's collaborations
      const collabs = allActiveCollabs.filter(collab => {
        // For debugging purposes - log unexpected collabs
        if (collab.creator_id === dbUser.id) {
          console.log(`Debug endpoint: FOUND USER'S OWN COLLABORATION: ID ${collab.id} by creator ${collab.creator_id}`);
          return false; // Exclude this collab
        }
        return true; // Include collabs not created by user
      });
      
      console.log(`Debug endpoint: Found ${collabs.length} active collaborations not created by user ${dbUser.id}`);
      
      // 3. Filter out collaborations the user has already swiped on
      const filteredCollabs = collabs.filter(collab => 
        !swipedCollaborationIds.includes(collab.id)
      );
      
      console.log(`Debug endpoint: After filtering out swiped collabs, ${filteredCollabs.length} remain`);
      
      // Return exact format and structure for debugging
      return res.status(200).json({
        user: dbUser,
        cardsCount: filteredCollabs.length,
        cards: filteredCollabs
      });
    } catch (error) {
      console.error('Error in debug discovery-cards endpoint:', error);
      res.status(500).json({ 
        error: 'Failed to get debug discovery cards',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Only in development environment - route to check database state
  app.get('/api/debug/database-stats', async (_req: Request, res: Response) => {
    try {
      // Get user count
      const userCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);
      
      // Get all users for debug
      const allUsers = await db
        .select()
        .from(users)
        .limit(10); // Limit to 10 users for safety
      
      // Get collaboration count
      const collabCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(collaborations);
      
      // Get all collaborations for debug
      const allCollabs = await db
        .select()
        .from(collaborations)
        .limit(10); // Limit to 10 for safety
      
      // Get swipe count
      const swipeCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(swipes);
      
      // Get marketing preferences count
      const marketingPrefsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(marketing_preferences);
      
      // Get a specific user's data
      const testUserId = 'b4093f49-f0c3-4bae-a294-35fb87c493eb'; // Paul Martin ID
      const testUser = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId));
      
      // Get active collaborations not created by test user
      const activeCollabsNotByUser = await db
        .select()
        .from(collaborations)
        .where(
          and(
            not(eq(collaborations.creator_id, testUserId)),
            eq(collaborations.status, 'active')
          )
        )
        .limit(10);
      
      // Get swipes by test user
      const userSwipes = await db
        .select()
        .from(swipes)
        .where(eq(swipes.user_id, testUserId));
      
      // Format the response
      const response = {
        counts: {
          users: Number(userCount[0].count),
          collaborations: Number(collabCount[0].count),
          swipes: Number(swipeCount[0].count),
          marketingPreferences: Number(marketingPrefsCount[0].count)
        },
        testUser: testUser[0] || null,
        sampleData: {
          users: allUsers,
          collaborations: allCollabs,
          activeCollabsNotByTestUser: activeCollabsNotByUser,
          userSwipes: userSwipes
        }
      };
      
      return res.json(response);
    } catch (error) {
      console.error('Error in debug route:', error);
      return res.status(500).json({ 
        error: 'Debug route error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
}