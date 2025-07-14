/**
 * Special codes management routes
 * 
 * These routes allow admins to manage special referral codes
 * that trigger automatic approval of user applications.
 */

import { Router } from 'express';
import { isAutoApprovalCode, getSpecialCodes, addSpecialCode, removeSpecialCode } from '../config/special-codes';
import { logger } from '../utils/logger';

const router = Router();

// Get all special codes (admin only)
router.get('/list', async (req, res) => {
  try {
    // TODO: Add admin authentication middleware
    const codes = getSpecialCodes();
    res.json({ 
      success: true, 
      codes,
      count: codes.length 
    });
  } catch (error) {
    logger.error('Failed to get special codes', { error: error.message });
    res.status(500).json({ error: 'Failed to get special codes' });
  }
});

// Check if a code is a special auto-approval code
router.post('/check', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }
    
    const isSpecial = isAutoApprovalCode(code);
    res.json({ 
      success: true, 
      isSpecial,
      code: code.trim().toUpperCase()
    });
  } catch (error) {
    logger.error('Failed to check special code', { error: error.message });
    res.status(500).json({ error: 'Failed to check special code' });
  }
});

// Add a new special code (admin only)
router.post('/add', async (req, res) => {
  try {
    // TODO: Add admin authentication middleware
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }
    
    addSpecialCode(code);
    logger.info(`Added special code: ${code}`);
    
    res.json({ 
      success: true, 
      message: 'Special code added successfully',
      code: code.trim().toUpperCase()
    });
  } catch (error) {
    logger.error('Failed to add special code', { error: error.message });
    res.status(500).json({ error: 'Failed to add special code' });
  }
});

// Remove a special code (admin only)
router.post('/remove', async (req, res) => {
  try {
    // TODO: Add admin authentication middleware
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }
    
    removeSpecialCode(code);
    logger.info(`Removed special code: ${code}`);
    
    res.json({ 
      success: true, 
      message: 'Special code removed successfully',
      code: code.trim().toUpperCase()
    });
  } catch (error) {
    logger.error('Failed to remove special code', { error: error.message });
    res.status(500).json({ error: 'Failed to remove special code' });
  }
});

export default router;