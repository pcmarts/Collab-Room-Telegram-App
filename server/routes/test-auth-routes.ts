import { Router } from 'express';
import { storage } from '../storage';
import { db } from '../db';
import { companies } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const router = Router();

// TEST ONLY - Create a test session for development/testing purposes
// This should never be enabled in production
router.get('/api/test-session/create', async (req: any, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'This endpoint is disabled in production' });
  }

  try {
    // Try to find an existing user for testing
    let testUser = await storage.getUserByTelegramId('1211030693'); // Test user ID
    
    // If no test user exists, create one
    if (!testUser) {
      testUser = await storage.createUser({
        id: randomUUID(),
        telegram_id: '1211030693',
        first_name: 'Test',
        last_name: 'User',
        handle: 'testuser',
        is_admin: false,
        referral_code: randomUUID().slice(0, 8)
      });
    }

    // Get company info through a direct database query 
    // since we don't have a specific method for this in the storage interface
    const companiesResult = await db.select()
      .from(companies)
      .where(eq(companies.user_id, testUser.id));

    let company = companiesResult[0];
    
    // Create a test company if needed
    if (!company) {
      // Insert company directly via db query
      const result = await db.insert(companies).values({
        user_id: testUser.id,
        name: 'Test Company',
        short_description: 'A test company for development',
        website: 'https://example.com',
        job_title: 'Developer',
        funding_stage: 'Seed',
        blockchain_networks: ['Ethereum'],
        tags: ['DeFi']
      }).returning();
      
      company = result[0];
    }

    // Create or update the session
    req.session.user = testUser;
    req.session.isAuthenticated = true;
    
    console.log('Created test session for user:', testUser.id);
    
    res.json({ 
      success: true, 
      message: 'Test session created', 
      user: testUser,
      company: company
    });
  } catch (error) {
    console.error('Error creating test session:', error);
    res.status(500).json({ error: 'Failed to create test session' });
  }
});

// TEST ONLY - Get current session info
router.get('/api/test-session/info', (req: any, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'This endpoint is disabled in production' });
  }

  if (!req.session || !req.session.user) {
    return res.json({ isAuthenticated: false, user: null });
  }

  res.json({
    isAuthenticated: true,
    user: req.session.user
  });
});

// TEST ONLY - Clear the test session
router.get('/api/test-session/clear', (req: any, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'This endpoint is disabled in production' });
  }

  req.session.destroy((err: any) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ error: 'Failed to clear session' });
    }
    
    res.json({ success: true, message: 'Session cleared' });
  });
});

export default router;