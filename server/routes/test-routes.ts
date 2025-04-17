/**
 * Test routes for development purposes
 * These routes should NOT be enabled in production
 */

import { Router, Request, Response } from 'express';
import { storage } from '../storage';

const router = Router();

// Create a test session with a mock user for testing purposes
router.post('/api/test-session', async (req: Request, res: Response) => {
  // Skip this endpoint in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found in production mode' });
  }

  try {
    const { userId, username, isAdmin } = req.body;

    if (!userId || !username) {
      return res.status(400).json({ error: 'Missing required user information' });
    }

    // Create a mock session user
    if (!req.session) {
      return res.status(500).json({ error: 'Session not available' });
    }

    // Add the mock user to the session
    req.session.user = {
      id: userId,
      first_name: username,
      handle: username,
      telegram_id: 'test-telegram-id',
      is_admin: !!isAdmin,
    };

    // Save the session
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('Failed to save test session:', err);
          reject(err);
          return;
        }
        resolve();
      });
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Test session created',
      user: req.session.user
    });
  } catch (error) {
    console.error('Error creating test session:', error);
    return res.status(500).json({ 
      error: 'Failed to create test session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Check if test session exists
router.get('/api/test-session', (req: Request, res: Response) => {
  // Skip this endpoint in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found in production mode' });
  }

  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'No test session exists' });
  }

  return res.status(200).json({ 
    success: true, 
    user: req.session.user
  });
});

// Clear test session
router.delete('/api/test-session', (req: Request, res: Response) => {
  // Skip this endpoint in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found in production mode' });
  }

  if (!req.session) {
    return res.status(500).json({ error: 'Session not available' });
  }

  req.session.destroy((err) => {
    if (err) {
      console.error('Failed to destroy test session:', err);
      return res.status(500).json({ error: 'Failed to clear test session' });
    }
    return res.status(200).json({ success: true, message: 'Test session cleared' });
  });
});

export default router;