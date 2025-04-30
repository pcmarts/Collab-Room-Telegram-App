// New simplified swipe endpoint implementation
import { Request, Response } from 'express';
import { storage } from './server/storage';
// Import directly from schema.ts
import { collaborations, swipes, users } from './shared/schema';
import { eq } from 'drizzle-orm';
import { db } from './server/db';

// Helper function to extract Telegram user data from request
function getTelegramUserFromRequest(req: any) {
  console.log('Headers:', JSON.stringify(req.headers));
  
  // Check if the request contains Telegram init data
  const telegramData = req.headers['x-telegram-init-data'];
  if (!telegramData) {
    console.log('No Telegram init data found in request headers');
    console.log('Available headers:', JSON.stringify(req.headers));
    
    // Development fallback for testing
    if (process.env.NODE_ENV !== 'production') {
      console.log('Using development fallback for Telegram data');
      return {
        id: 'test_user_id',
        first_name: 'Test',
        last_name: 'User',
        username: null
      };
    }
    
    return null;
  }
  
  try {
    // Parse the Telegram init data
    const params = new URLSearchParams(telegramData);
    const userData = params.get('user');
    
    if (!userData) {
      console.log('No user data found in Telegram init data');
      return null;
    }
    
    const user = JSON.parse(userData);
    console.log('Parsed Telegram user data:', user);
    return user;
  } catch (error) {
    console.error('Error parsing Telegram user data:', error);
    return null;
  }
}

interface TelegramRequest extends Request {
  telegramData?: {
    id: string;
    username?: string;
    first_name: string;
    last_name?: string;
  }
}

export async function handleSwipeRequest(req: TelegramRequest, res: Response) {
  console.log('============ DEBUG: Create Swipe Endpoint (Simplified) ============');
  console.log('Request timestamp:', new Date().toISOString());
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { collaboration_id, swipe_id, direction, is_potential_match, details, note } = req.body;
    
    console.log('Parsed request parameters:', { collaboration_id, swipe_id, direction, is_potential_match, note });
    
    // Validate direction is either "left" or "right"
    if (direction !== 'left' && direction !== 'right') {
      console.log('Validation error: Invalid direction value:', direction);
      return res.status(400).json({ error: 'Direction must be either "left" or "right"' });
    }
    
    // Check if we have a valid ID (either collaboration_id or swipe_id)
    if (!collaboration_id && !swipe_id) {
      console.log('Validation error: Missing required parameters');
      return res.status(400).json({ error: 'Either collaboration_id or swipe_id is required' });
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
    console.log(`User details: first_name=${telegramData.first_name}, last_name=${telegramData.last_name || 'N/A'}, username=${telegramData.username || 'N/A'}`);
    
    // Get the actual user from database using telegram_id
    console.log(`Looking up user by Telegram ID: ${telegramId}...`);
    const user = await storage.getUserByTelegramId(telegramId);
    
    if (!user) {
      console.log('Database error: User not found with telegramId:', telegramId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`Database success: Found user ${user.id} (${user.first_name} ${user.last_name || ''})`);
    
    // Handle the actual swipe creation based on the request type
    let actualCollaborationId = collaboration_id;
    
    // Handle potential match case (swiping on a card showing in the "potential matches" view)
    if (is_potential_match && swipe_id) {
      console.log(`Processing potential match with swipe ID: ${swipe_id}`);
      
      try {
        // Fetch the original swipe to get the collaboration ID
        const [originalSwipe] = await db
          .select({
            swipe: swipes,
            user: users,
            collaboration: collaborations
          })
          .from(swipes)
          .where(eq(swipes.id, swipe_id))
          .innerJoin(users, eq(swipes.user_id, users.id))
          .innerJoin(collaborations, eq(swipes.collaboration_id, collaborations.id));
        
        if (!originalSwipe) {
          console.log(`Database error: Original swipe ${swipe_id} not found`);
          return res.status(404).json({ error: 'Original swipe not found' });
        }
        
        // Get the collaboration_id from the original swipe
        actualCollaborationId = originalSwipe.collaboration.id;
        
        console.log(`Found original swipe with collaboration ID: ${actualCollaborationId}`);
        console.log(`Original swipe was from user ID: ${originalSwipe.user.id}`);
      } catch (error) {
        console.error('Error retrieving original swipe:', error);
        return res.status(500).json({ error: 'Failed to retrieve original swipe data' });
      }
    }
    
    // Now create the actual swipe - our improved storage.createSwipe method will handle match creation
    try {
      console.log(`Creating swipe for collaboration: ${actualCollaborationId}`);
      
      // Verify the collaboration exists
      const collaboration = await storage.getCollaboration(actualCollaborationId);
      if (!collaboration) {
        console.log(`Database error: Collaboration ${actualCollaborationId} not found`);
        return res.status(404).json({ error: 'Collaboration not found' });
      }
      
      // Create the swipe using our improved storage method
      const swipe = await storage.createSwipe({
        user_id: user.id,
        collaboration_id: actualCollaborationId,
        direction,
        note, // Include the optional note field
        details: details || {}
      });
      
      console.log(`Success: Created swipe record with ID: ${swipe.id}`);
      
      return res.status(201).json({
        success: true,
        swipe
      });
    } catch (error) {
      console.error('Database error creating swipe:', error);
      return res.status(500).json({ error: 'Failed to create swipe' });
    }
  } catch (error) {
    console.error('Server error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return res.status(500).json({ 
      error: 'Server error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}