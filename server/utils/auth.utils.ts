import { type Request } from "express";
import type { Session, SessionData } from 'express-session';
import { logger } from './logger'; // Adjust path as needed

/**
 * Extracts Telegram user data from request headers or session, handling impersonation.
 * Uses augmented Request and Session types from express.d.ts
 * @param req - The Express request object.
 * @returns The Telegram user object or null if not found.
 */
export function getTelegramUserFromRequest(req: Request): SessionData['telegramUser'] | SessionData['impersonating']['impersonatedUser'] | null {
  try {
    // Use req.session directly, types provided by express.d.ts
    if (req.session?.impersonating && !req.path?.startsWith('/api/admin')) {
      // Add explicit check to satisfy linter - This might still show error if types not fully resolved
      if (req.session.impersonating) { 
          return req.session.impersonating.impersonatedUser;
      }
    }

    const SESSION_DATA_TTL = 30 * 60 * 1000; // 30 minutes
    if (req.session?.telegramUser?.id && (Date.now() - req.session.telegramUser.cachedAt < SESSION_DATA_TTL)) {
      return req.session.telegramUser;
    }

    const initData = req.headers['x-telegram-init-data'] as string;
    if (initData) {
      try {
        const decodedInitData = new URLSearchParams(initData);
        const userJson = decodedInitData.get('user') || '{}';
        const telegramUser = JSON.parse(userJson);
        
        if (telegramUser.id) {
          const sessionUser = { ...telegramUser, cachedAt: Date.now() };
          if (req.session) {
            req.session.telegramUser = sessionUser; // Uses augmented SessionData
          }
          return sessionUser;
        }
      } catch (parseError) {
        logger.error('Error parsing Telegram init data:', parseError);
      }
    }
    
    const telegramUserId = req.headers['x-telegram-user-id'] as string;
    if (telegramUserId) {
      logger.debug('Using Telegram user ID from headers (fallback):', telegramUserId);
      const minimalTelegramUser = {
        id: telegramUserId,
        first_name: 'User', // Generic placeholder
        cachedAt: Date.now()
      };
      if (req.session) {
        req.session.telegramUser = minimalTelegramUser; // Uses augmented SessionData
      }
      return minimalTelegramUser;
    }

    logger.warn('⚠️ No Telegram data found in request headers or session');
    return null;
  } catch (error) {
    logger.error('Error in getTelegramUserFromRequest:', error);
    return null;
  }
} 