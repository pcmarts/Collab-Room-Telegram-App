/**
 * Unified discovery data API endpoint for optimized front-end loading
 * This endpoint combines multiple API calls into a single request to improve performance
 */

import type { Request, Response } from "express";
import { storage } from "../storage";

// Interface for Telegram request with user data
export interface TelegramRequest extends Request {
  telegramData?: {
    id: string;
    username?: string;
    first_name: string;
    last_name?: string;
  }
}

/**
 * Unified discovery API endpoint - combines multiple API calls for better performance
 * Returns user swipes, potential matches, and filtered collaborations in a single response
 */
export async function getUnifiedDiscoveryData(req: TelegramRequest, res: Response) {
  console.log('============ DEBUG: Unified Discovery Data Endpoint ============');
  console.log('Headers:', { 
    host: req.headers.host,
    origin: req.headers.origin,
    telegramData: !!req.telegramData
  });
  
  try {
    // Parse request parameters
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const cursor = req.query.cursor as string | undefined;
    const excludeOwn = req.query.excludeOwn === 'true';
    
    // Parse filters from query parameters
    const filters = {
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
    
    // Get Telegram user ID from request
    if (!req.telegramData || !req.telegramData.id) {
      console.error('No Telegram user ID found in request');
      return res.status(401).json({ error: 'Unauthorized - No Telegram user ID' });
    }
    
    const telegramId = req.telegramData.id;
    console.log(`Found Telegram user: ${telegramId}`);
    
    // Find the database user by Telegram ID
    const user = await storage.getUserByTelegramId(telegramId);
    if (!user) {
      console.error(`No database user found for Telegram ID: ${telegramId}`);
      return res.status(401).json({ error: 'Unauthorized - User not found' });
    }
    
    console.log(`Found database user: ${user.id}`);
    
    // Get unified discovery data
    const startTime = Date.now();
    const discoveryData = await storage.getDiscoveryData(user.id, filters);
    const executionTime = Date.now() - startTime;
    
    console.log(`Unified discovery data fetched in ${executionTime}ms`);
    console.log(`- User swipes: ${discoveryData.userSwipes.length}`);
    console.log(`- Potential matches: ${discoveryData.potentialMatches.length}`);
    console.log(`- Collaborations: ${discoveryData.collaborations.items.length} (hasMore: ${discoveryData.collaborations.hasMore})`);
    
    return res.json(discoveryData);
  } catch (error) {
    console.error('Error fetching unified discovery data:', error);
    return res.status(500).json({ error: 'Failed to fetch discovery data' });
  }
}