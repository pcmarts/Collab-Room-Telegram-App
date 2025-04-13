import { Router, type Request, type Response } from "express";
import {
  checkAdminStatus,
  getAllUsers,
  setUserAdminStatus,
  approveUser,
  getAllApplications
} from "../services/admin.service";
import { db } from "../db"; // Needed for impersonation user lookup
import { users } from "../../shared/schema"; // Needed for impersonation user lookup
import { eq } from 'drizzle-orm'; // Needed for impersonation user lookup
import { logger } from '../utils/logger';

// TODO: Import checkAdminMiddleware from its final location (e.g., ../middleware/authenticate.ts)
// import { checkAdminMiddleware } from "../routes"; // TEMPORARY import
import { checkAdminMiddleware } from "../middleware/admin.middleware"; // Import from new location
// TODO: Import getTelegramUserFromRequest from its final location
// import { getTelegramUserFromRequest } from "../routes"; // TEMPORARY import
import { getTelegramUserFromRequest } from "../utils/auth.utils"; // Import from new location

const adminRouter = Router();

// Apply admin check middleware to all routes in this router
adminRouter.use(checkAdminMiddleware);

// --- Admin Routes --- 

// GET /api/admin/check (Already handled by middleware, but keep for explicit check?)
// NOTE: The original implementation didn't use checkAdminMiddleware, let's keep it that way for now
// adminRouter.get("/check", async (req: TelegramRequest, res: Response) => { ... });
// Let's assume /api/admin/check is removed or handled separately if needed without admin rights.

// GET /api/admin/users
adminRouter.get("/users", async (req: Request, res: Response) => {
  try {
    const allUsers = await getAllUsers();
    return res.json(allUsers);
  } catch (error) {
    logger.error('Error in GET /admin/users route:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch users" });
  }
});

// POST /api/admin/set-user-admin-status (Duplicate of PATCH? Choose one)
// Let's keep the PATCH version as it's more conventional for updates
/*
adminRouter.post("/set-user-admin-status", async (req: TelegramRequest, res: Response) => {
  // ... logic ...
});
*/

// PATCH /api/admin/users/:userId/admin-status
adminRouter.patch("/users/:userId/admin-status", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { isAdmin } = req.body;
    if (typeof isAdmin !== 'boolean') {
      return res.status(400).json({ error: "isAdmin must be a boolean value" });
    }
    
    const updatedUser = await setUserAdminStatus(userId, isAdmin);
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    return res.json({
      success: true, 
      user: updatedUser,
      message: `User admin status ${isAdmin ? 'granted' : 'revoked'} successfully`
    });
  } catch (error) {
    logger.error('Error in PATCH /admin/users/:userId/admin-status route:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update user admin status" });
  }
});

// POST /api/admin/impersonate
adminRouter.post("/impersonate", async (req: Request, res: Response) => {
  try {
    const { telegram_id } = req.body;
    if (!telegram_id) {
      return res.status(400).json({ error: "Telegram ID is required" });
    }

    // Get the user to impersonate
    const [userToImpersonate] = await db.select().from(users).where(eq(users.telegram_id, telegram_id));
    if (!userToImpersonate) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get original admin user (who is making the request)
    const adminTelegramUser = getTelegramUserFromRequest(req);
    if (!adminTelegramUser) {
        return res.status(401).json({ error: "Admin user not found in request"});
    }
    // Fetch full admin user data if needed for `originalUser` object
    const [adminUserRecord] = await db.select().from(users).where(eq(users.telegram_id, adminTelegramUser.id.toString()));

    if (!req.session) {
      logger.error('No session object found during impersonation start');
      return res.status(500).json({ error: "Session not initialized" });
    }

    // Store impersonation data in session
    req.session.impersonating = {
      originalUser: adminUserRecord, // Store full original user data
      impersonatedUser: {
        id: userToImpersonate.telegram_id,
        first_name: userToImpersonate.first_name,
        last_name: userToImpersonate.last_name || undefined,
        username: userToImpersonate.handle || undefined
      }
    };

    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        logger.error('Error saving session during impersonation start:', err);
        return res.status(500).json({ error: "Failed to save session" });
      }
      logger.info(`Admin ${adminUserRecord?.handle} started impersonating ${userToImpersonate.handle}`);
      return res.json({
        success: true,
        message: "Impersonation started", 
        user: userToImpersonate // Return the user being impersonated
      });
    });

  } catch (error) {
    logger.error("Error starting impersonation:", error);
    return res.status(500).json({ error: "Failed to start impersonation" });
  }
});

// POST /api/admin/stop-impersonation
adminRouter.post("/stop-impersonation", async (req: Request, res: Response) => {
  try {
    if (!req.session?.impersonating) {
      return res.status(400).json({ error: "Not currently impersonating" });
    }
    
    const originalUserHandle = req.session.impersonating.originalUser?.handle;
    const impersonatedUserHandle = req.session.impersonating.impersonatedUser?.username || req.session.impersonating.impersonatedUser?.id;

    // Clear impersonation data
    delete req.session.impersonating;

    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        logger.error('Error saving session during impersonation stop:', err);
        return res.status(500).json({ error: "Failed to save session" });
      }
      logger.info(`Admin ${originalUserHandle} stopped impersonating ${impersonatedUserHandle}`);
      return res.json({ success: true, message: "Impersonation ended" });
    });
  } catch (error) {
    logger.error("Error ending impersonation:", error);
    return res.status(500).json({ error: "Failed to end impersonation" });
  }
});

// POST /api/admin/approve-user
adminRouter.post("/approve-user", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const updatedUser = await approveUser(userId);
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" }); // Service handles already approved case
    }

    return res.json({
      success: true,
      user: updatedUser,
      message: "User approved successfully"
    });
  } catch (error) {
    logger.error("Error in POST /admin/approve-user route:", error);
    const statusCode = error instanceof Error && error.message.toLowerCase().includes('not found') ? 404 : 500;
    return res.status(statusCode).json({ error: error instanceof Error ? error.message : "Failed to approve user" });
  }
});

// GET /api/admin/applications
adminRouter.get("/applications", async (req: Request, res: Response) => {
   try {
    const applications = await getAllApplications();
    return res.json(applications);
  } catch (error) {
    logger.error('Error in GET /admin/applications route:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch applications" });
  }
});

export default adminRouter; 