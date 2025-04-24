/**
 * Discovery Routes
 * 
 * This file contains all routes related to the discovery feature,
 * including the new unified discovery endpoint.
 */

import type { Express, Request, Response } from "express";
import { storage } from "../storage";

/**
 * Register all discovery-related routes on the Express app
 * @param app The Express app to register routes on
 */
export function registerDiscoveryRoutes(app: Express) {
  // Register the unified discovery endpoint
  app.post("/api/discovery/unified", unifiedDiscoveryEndpoint);
}

/**
 * Unified discovery endpoint handler
 * Combines user swipes, potential matches, and collaborations into a single API call
 */
export async function unifiedDiscoveryEndpoint(req: Request, res: Response) {
  try {
    console.log('============ DEBUG: Unified Discovery Data Endpoint ============');
    console.log('Headers:', { 
      host: req.headers.host,
      origin: req.headers.origin
    });
    
    // Parse request parameters
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const cursor = req.query.cursor as string | undefined;
    const excludeOwn = req.query.excludeOwn === 'true';
    
    // Parse filters from query parameters
    const filters: any = {
      collabTypes: req.query.collabTypes ? (req.query.collabTypes as string).split(',') : undefined,
      companyTags: req.query.companyTags ? (req.query.companyTags as string).split(',') : undefined,
      minCompanyFollowers: req.query.minCompanyFollowers as string,
      minUserFollowers: req.query.minUserFollowers as string,
      hasToken: req.query.hasToken === 'true',
      fundingStages: req.query.fundingStages ? (req.query.fundingStages as string).split(',') : undefined,
      blockchainNetworks: req.query.blockchainNetworks ? (req.query.blockchainNetworks as string).split(',') : undefined,
      excludeOwn,
      cursor,
      limit
    };
    
    // Get additional collaboration IDs to exclude from POST body
    const excludeIds = req.body && req.body.excludeIds ? req.body.excludeIds : [];
    if (excludeIds && excludeIds.length > 0) {
      console.log(`Excluding ${excludeIds.length} additional IDs from body:`, excludeIds);
      filters.excludeIds = excludeIds;
    }
    
    // Get Telegram user from request (using the function from the main routes file)
    // Since this uses the global function, this endpoint needs to be registered after it's defined
    // @ts-ignore - Ignore the TS error since we're getting this function from the global scope
    const telegramUser = getTelegramUserFromRequest(req);
    if (!telegramUser) {
      console.error('No Telegram user ID found in request');
      return res.status(401).json({ error: 'Unauthorized - No Telegram user ID' });
    }
    
    const telegramId = telegramUser.id;
    console.log(`Found Telegram user: ${telegramId}`);
    
    // Find the database user by Telegram ID
    const user = await storage.getUserByTelegramId(telegramId.toString());
    if (!user) {
      console.error(`No database user found for Telegram ID: ${telegramId}`);
      return res.status(401).json({ error: 'Unauthorized - User not found' });
    }
    
    console.log(`Found database user: ${user.id}`);
    
    // Execute all database queries in parallel for better performance
    const startTime = Date.now();
    
    // Use Promise.all to run these queries in parallel
    const [userSwipes, potentialMatches, collaborations] = await Promise.all([
      // Get user swipes
      storage.getUserSwipes(user.id),
      
      // Get potential matches
      storage.getPotentialMatchesForHost(user.id),
      
      // Get collaborations with filtering
      storage.searchCollaborationsPaginated(user.id, filters)
    ]);
    
    const executionTime = Date.now() - startTime;
    console.log(`Unified discovery data fetched in ${executionTime}ms`);
    console.log(`- User swipes: ${userSwipes.length}`);
    console.log(`- Potential matches: ${potentialMatches.length}`);
    console.log(`- Collaborations: ${collaborations.items.length} (hasMore: ${collaborations.hasMore})`);
    
    // Return combined data in a single response
    return res.json({
      userSwipes,
      potentialMatches,
      collaborations
    });
  } catch (error) {
    console.error('Error fetching unified discovery data:', error);
    return res.status(500).json({ error: 'Failed to fetch discovery data' });
  }
}