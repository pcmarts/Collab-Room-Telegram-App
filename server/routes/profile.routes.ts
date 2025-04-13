import { Router, type Request, type Response } from "express";
import { getUserProfile, upsertUserCompany, handleOnboarding } from "../services/profile.service";
import { authLimiter } from '../middleware/rate-limiter'; // Assuming rate limiter is needed
import { db } from "../db"; // Needed to find user ID from telegram ID
import { users } from "../../shared/schema"; // Needed to find user ID from telegram ID
import { eq } from 'drizzle-orm'; // Needed to find user ID from telegram ID
import { getTelegramUserFromRequest } from "../utils/auth.utils";

const profileRouter = Router();

/**
 * GET /api/profile
 * Fetches the current user's profile, company, and preferences.
 */
profileRouter.get("/profile", async (req: Request, res: Response) => {
  const userId = req.userId; // Use userId from global middleware
  if (!userId) return res.status(500).json({ error: 'User ID not found after auth' });
  try {
    // REMOVE user lookup by telegramId here
    const profileData = await getUserProfile(userId, req.session);
    return res.json(profileData);
  } catch (error) {
    // Service layer should have logged the error
    const statusCode = error instanceof Error && error.message === "User not found" ? 404 : 500;
    return res.status(statusCode).json({ error: error instanceof Error ? error.message : "Internal server error" });
  }
});

/**
 * POST /api/company
 * Creates or updates the company information for the current user.
 */
profileRouter.post("/company", authLimiter, async (req: Request, res: Response) => {
  const userId = req.userId; // Use userId from global middleware
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    // Map requested field names to db schema names
    const {
      company_name, // These come from the frontend
      job_title,
      website,
      funding_stage,
      ...otherFields
    } = req.body;
    
    // Create a properly shaped companyData object
    const companyData = {
      name: company_name, // Map to the actual field name in the schema
      job_title,
      website,
      funding_stage,
      ...otherFields
    };
    
    // Basic validation for required fields
    if (!companyData.name || !companyData.job_title || !companyData.website || !companyData.funding_stage) {
      return res.status(400).json({ 
        error: 'Missing required company fields', 
        message: 'Company name, job title, website, and funding stage are required.'
      });
    }

    // Call the service function to handle the company update
    const company = await upsertUserCompany(userId, companyData);

    return res.json({
      success: true,
      company,
      message: 'Company information saved successfully'
    });

  } catch (error) {
    // Log error details
    logger.error('Error in company update route:', { 
      userId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    // Return appropriate error response
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to save company information" 
    });
  }
});

/**
 * POST /api/onboarding
 * Handles the user onboarding or profile update process.
 */
profileRouter.post("/onboarding", authLimiter, async (req: Request, res: Response) => {
  // Onboarding is special: it might create a user OR update one.
  // The global middleware requires an *existing* user.
  // We need the Telegram user info *before* knowing if a DB user exists.
  // Option 1: Move onboarding outside authenticated routes in index.ts
  // Option 2: Modify auth middleware to allow this route if user *not* found but telegramUser *is* found.
  // Option 3: Keep getTelegramUser here and handle user lookup inside.
  // Let's go with Option 3 for now for simplicity, but Option 2 is cleaner.
  try {
    const telegramUser = getTelegramUserFromRequest(req); // Keep local call
    if (!telegramUser) {
      // This case shouldn't happen if Option 2 was used, but good failsafe
      return res.status(401).json({ error: "Unauthorized - Invalid Telegram data required for onboarding" });
    }
    const { user, isProfileUpdate } = await handleOnboarding(telegramUser, req.body);
    return res.json({
      success: true,
      message: isProfileUpdate ? 'Profile updated successfully' : 'Application submitted successfully',
      user // Return the user object
    });
  } catch (error) {
    // Service layer should have logged the error
    // Handle specific validation errors if thrown by the service
    const statusCode = error instanceof Error && error.message.includes('required') ? 400 : 500;
    return res.status(statusCode).json({ error: error instanceof Error ? error.message : "Server error during onboarding" });
  }
});

export default profileRouter; 