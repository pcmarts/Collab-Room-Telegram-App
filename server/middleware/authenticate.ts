import { type Request, type Response, type NextFunction } from "express";
import { db } from "../db";
import { users } from "../../shared/schema";
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { getTelegramUserFromRequest } from "../utils/auth.utils";

/**
 * Authentication middleware.
 * Verifies user via Telegram data (session/headers), fetches internal user ID,
 * and attaches `userId` to the request object.
 */
export async function authenticateMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const telegramUser = getTelegramUserFromRequest(req);

        if (!telegramUser) {
            logger.debug('Auth middleware: No Telegram user found');
            // Allow access to certain public routes? Or always require auth?
            // For now, let's assume most API routes require authentication.
            // Specific public routes (like /network-stats) could be mounted *before* this middleware.
            return res.status(401).json({ error: "Unauthorized - Authentication required" });
        }

        // We have a Telegram user (or impersonated user), find the internal DB user
        const [user] = await db.select({ id: users.id, is_approved: users.is_approved })
                                 .from(users)
                                 .where(eq(users.telegram_id, telegramUser.id.toString()));

        if (!user) {
            logger.warn('Auth middleware: Telegram user found but no matching DB record', { telegramId: telegramUser.id });
            // This case might mean the user started onboarding but didn't finish,
            // or data inconsistency. Treat as unauthorized for most routes.
            // Specific onboarding routes might need to handle this state.
            return res.status(404).json({ error: "User not found" });
        }
        
        // Optional: Check if user is approved for certain routes? 
        // Could be handled by separate authorization middleware if needed.
        // if (!user.is_approved) { ... }

        // Attach internal userId to the request using declaration merging
        req.userId = user.id;
        // Optionally attach the telegram user object too if needed downstream
        // (req as any).telegramUser = telegramUser; 

        logger.debug('Auth middleware: User authenticated', { userId: req.userId, telegramId: telegramUser.id });
        next(); // Proceed to the next middleware or route handler

    } catch (error) {
        logger.error("Error in authentication middleware:", error);
        return res.status(500).json({ error: "Internal server error during authentication" });
    }
} 