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
      
      // Get discovery cards directly from DB, bypassing storage layer
      const collabs = await db
        .select()
        .from(collaborations)
        .where(
          and(
            not(eq(collaborations.creator_id, dbUser.id)),
            eq(collaborations.status, 'active')
          )
        );
      
      // Return exact format and structure for debugging
      return res.status(200).json({
        user: dbUser,
        cardsCount: collabs.length,
        cards: collabs
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