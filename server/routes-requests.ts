import { Express, Request, Response, NextFunction } from 'express';
import { eq, and, inArray } from 'drizzle-orm';
import { db } from './db';
import { users, requests, collaborations } from '../shared/schema';
import { storage } from './storage';
import { requestLimiter } from './middleware/rate-limiter';

// Define the enhanced request interface
interface TelegramRequest extends Request {
  telegramData?: {
    id: string;
    username?: string;
    first_name: string;
    last_name?: string;
  }
}

// Helper function to extract telegram user data from request
function getTelegramUserFromRequest(req: any) {
  // This function should extract telegram data from the request
  // Implementation depends on your existing telegram authentication logic
  return req.telegramData || null;
}

// New simplified collaboration request endpoint
export function registerRequestEndpoint(app: Express) {
  app.post("/api/requests", requestLimiter, async (req: TelegramRequest, res: Response) => {
    console.log('============ NEW REQUEST ENDPOINT ============');
    console.log('Request timestamp:', new Date().toISOString());
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    try {
      const { collaboration_id, request_id, action, is_potential_match, note } = req.body;
      
      console.log('Parsed request parameters:', { collaboration_id, request_id, action, is_potential_match, note });
      
      // Validate action is either "request" or "skip"
      if (action !== 'request' && action !== 'skip') {
        console.log('Validation error: Invalid action value:', action);
        return res.status(400).json({ error: 'Action must be either "request" or "skip"' });
      }
      
      // Check if we have a valid ID (either collaboration_id or request_id)
      if (!collaboration_id && !request_id) {
        console.log('Validation error: Missing required parameters');
        return res.status(400).json({ error: 'Either collaboration_id or request_id is required' });
      }
      
      // Get user from telegram data
      console.log('Attempting to extract telegram user data from request...');
      const telegramData = getTelegramUserFromRequest(req);
      
      if (!telegramData) {
        console.log('Authentication error: No telegram data found in the request');
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const telegramId = telegramData.id.toString();
      console.log(`Authentication success: Found Telegram ID: ${telegramId}`);
      
      // Get the actual user from database using telegram_id
      console.log(`Looking up user by Telegram ID: ${telegramId}...`);
      const user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        console.log('Database error: User not found with telegramId:', telegramId);
        return res.status(404).json({ error: 'User not found' });
      }
      
      console.log(`Database success: Found user ${user.id} (${user.first_name} ${user.last_name || ''})`);
      
      // Handle potential match response (user responding to an existing request)
      if (is_potential_match && request_id) {
        console.log(`Processing potential match response: ${action} for request ID: ${request_id}`);
        
        try {
          if (action === 'request') {
            // Accept the request (create match)
            const result = await storage.acceptCollaborationRequest(user.id, request_id);
            if (result.success) {
              return res.status(200).json({
                success: true,
                match_created: true,
                match: result.match
              });
            } else {
              return res.status(400).json({ error: result.error });
            }
          } else if (action === 'skip') {
            // Hide the request
            const result = await storage.hideCollaborationRequest(user.id, request_id);
            if (result.success) {
              return res.status(200).json({
                success: true,
                action: 'hidden'
              });
            } else {
              return res.status(400).json({ error: result.error });
            }
          }
        } catch (error) {
          console.error('Error processing potential match response:', error);
          return res.status(500).json({ error: 'Failed to process potential match response' });
        }
      }
      
      // Handle request to collaboration
      if (collaboration_id) {
        console.log(`Processing ${action} for collaboration: ${collaboration_id}`);
        
        try {
          // Create collaboration request using the new method
          const request = await storage.createCollaborationRequest(user.id, collaboration_id, action, note);
          
          console.log(`Success: Created collaboration ${action} with ID: ${request.id}`);
          
          return res.status(201).json({
            success: true,
            request: request,
            action: action
          });
        } catch (error) {
          console.error('Error creating collaboration request:', error);
          return res.status(500).json({ error: 'Failed to create collaboration request' });
        }
      }
      
      return res.status(400).json({ error: 'Invalid request parameters' });
      
    } catch (error) {
      console.error('Error in request endpoint:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
      return res.status(500).json({ error: 'Failed to process request' });
    }
  });
}