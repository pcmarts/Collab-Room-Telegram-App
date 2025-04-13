import { type Request, type Response, type NextFunction } from "express";
import { db } from "../db"; // Adjust path as needed
import { users } from "../../shared/schema"; // Adjust path as needed
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger'; // Adjust path as needed
import { getTelegramUserFromRequest } from "../utils/auth.utils"; // Import from new location

/**
 * Middleware to check if the current user is an admin.
 * It uses getTelegramUserFromRequest to identify the user.
 */
export async function checkAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const telegramUser = getTelegramUserFromRequest(req);
    if (!telegramUser) {
      logger.warn('Admin check failed: No Telegram user found in request');
      return res.status(401).json({ error: "Unauthorized - Not logged in" });
    }
    
    // We only need the ID part usually
    const telegramId = typeof telegramUser.id === 'string' ? telegramUser.id : String(telegramUser.id);

    const [user] = await db.select({ is_admin: users.is_admin })
      .from(users)
      .where(eq(users.telegram_id, telegramId));
    
    if (!user) {
      logger.warn('Admin check failed: User not found in database', { telegramId });
      return res.status(401).json({ error: "Unauthorized - User not found" });
    }
    
    if (!user.is_admin) {
      logger.warn('Admin check failed: User is not an admin', { telegramId });
      return res.status(403).json({ error: "Forbidden - Admin access required" });
    }
    
    // Admin check passed
    logger.debug('Admin check passed for user', { telegramId });
    next();
  } catch (error) {
    logger.error("Error in admin middleware:", error);
    return res.status(500).json({ error: "Internal server error during admin check" });
  }
} 