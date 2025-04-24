/**
 * Telegram Authentication Utilities
 * 
 * Extracted from the main routes file to provide a reusable utility
 * for authentication in the unified discovery endpoint.
 */

import type { Request } from "express";
import type { Session } from 'express-session';
import { logger } from './logger';

// Define our session data structure
interface ImpersonationSession extends Session {
  impersonating?: {
    originalUser: any;
    impersonatedUser: {
      id: string;
      first_name: string;
      last_name?: string;
      username?: string;
    }
  },
  telegramUser?: {
    id: string;
    username?: string;
    first_name: string;
    last_name?: string;
    // Add expiry time to invalidate cached user data after a certain period
    cachedAt: number;
  }
}

// Extend Request type with our custom fields
export interface TelegramRequest extends Request {
  telegramData?: {
    id: string;
    username?: string;
    first_name: string;
    last_name?: string;
  }
  session: ImpersonationSession;
}

// This type allows us to accept either a full Request or just an object with the header we need
type TelegramReq = TelegramRequest | { 
  headers: { 'x-telegram-init-data': string } | any;
  path?: string;
  session?: ImpersonationSession;
};

/**
 * Extract the Telegram user information from a request
 * @param req The request object containing Telegram data
 * @returns The Telegram user object or null if not found
 */
export function getTelegramUserFromRequest(req: TelegramReq) {
  try {
    // If impersonating and not an admin endpoint, return impersonated user
    if (req.session?.impersonating && !req.path?.startsWith('/api/admin')) {
      return req.session.impersonating.impersonatedUser;
    }

    // Check if we have valid cached Telegram user data in the session
    // and it's less than 30 minutes old
    const SESSION_DATA_TTL = 30 * 60 * 1000; // 30 minutes
    if (req.session?.telegramUser && 
        req.session.telegramUser.id && 
        (Date.now() - req.session.telegramUser.cachedAt < SESSION_DATA_TTL)) {
      // Use the cached data from session
      return req.session.telegramUser;
    }

    // STEP 1: First try to get from the standard Telegram init data
    const initData = req.headers['x-telegram-init-data'] as string;
    if (initData) {
      try {
        // Parse Telegram data
        const decodedInitData = new URLSearchParams(initData);
        const userJson = decodedInitData.get('user') || '{}';
        logger.debug('Parsed Telegram user data:', userJson);
        const telegramUser = JSON.parse(userJson);
        
        if (telegramUser.id) {
          // Store the parsed data in session for future requests
          if (req.session) {
            req.session.telegramUser = {
              ...telegramUser,
              cachedAt: Date.now()
            };
          }
          return telegramUser;
        }
      } catch (parseError) {
        logger.error('Error parsing Telegram init data:', parseError);
        // Continue to try the next authentication method
      }
    }
    
    // STEP 2: Check for direct Telegram user ID in header (fallback mechanism)
    const telegramUserId = req.headers['x-telegram-user-id'] as string;
    if (telegramUserId) {
      logger.debug('Using Telegram user ID from headers:', telegramUserId);
      
      // Create a minimal Telegram user object with just the ID
      // This is enough for authentication purposes
      const minimalTelegramUser = {
        id: telegramUserId,
        // We might not have these values, but they're needed for type compatibility
        first_name: 'User', // Generic placeholder
        cachedAt: Date.now()
      };
      
      // Store this minimal data in session for future requests
      if (req.session) {
        req.session.telegramUser = minimalTelegramUser;
      }
      
      return minimalTelegramUser;
    }

    // If we got here, we couldn't find Telegram user data
    logger.debug('No Telegram init data or user ID found in request headers');
    // Log full headers for debugging (but sanitize any sensitive info)
    const safeHeaders = { ...req.headers };
    delete safeHeaders.cookie; // Remove cookies for security
    delete safeHeaders.authorization; // Remove auth tokens
    logger.debug('Available headers:', safeHeaders);
    
    logger.warn('⚠️ No Telegram data found in request');
    return null;
  } catch (error) {
    logger.error('Error in getTelegramUserFromRequest:', error);
    return null;
  }
}