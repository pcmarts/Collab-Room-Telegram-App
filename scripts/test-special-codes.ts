/**
 * Test script for special referral codes functionality
 * 
 * This script tests the special codes system and demonstrates
 * how the auto-approval feature works.
 * 
 * Run with: npx tsx scripts/test-special-codes.ts
 */

import { isAutoApprovalCode, getSpecialCodes, addSpecialCode, removeSpecialCode } from '../server/config/special-codes';
import { logger } from '../server/utils/logger';

async function testSpecialCodes() {
  logger.info('Testing special codes functionality...');
  
  // Test 1: Check existing special codes
  logger.info('=== Test 1: Checking existing special codes ===');
  const existingCodes = getSpecialCodes();
  logger.info(`Found ${existingCodes.length} existing special codes:`, existingCodes);
  
  // Test 2: Test auto-approval detection
  logger.info('=== Test 2: Testing auto-approval detection ===');
  const testCodes = [
    'ADMIN_INSTANT',
    'VIP_ACCESS',
    'PARTNER_INVITE',
    'invalid_code',
    'random_123',
    'vip_access', // lowercase variant
    ' ADMIN_INSTANT ', // with spaces
  ];
  
  testCodes.forEach(code => {
    const isSpecial = isAutoApprovalCode(code);
    logger.info(`Code "${code}" -> Auto-approval: ${isSpecial}`);
  });
  
  // Test 3: Add and remove special codes
  logger.info('=== Test 3: Testing add/remove functionality ===');
  const testNewCode = 'TEST_CODE_123';
  
  logger.info(`Adding test code: ${testNewCode}`);
  addSpecialCode(testNewCode);
  
  logger.info(`Checking if test code works: ${isAutoApprovalCode(testNewCode)}`);
  
  logger.info(`Removing test code: ${testNewCode}`);
  removeSpecialCode(testNewCode);
  
  logger.info(`Checking if test code still works: ${isAutoApprovalCode(testNewCode)}`);
  
  // Test 4: Case sensitivity and normalization
  logger.info('=== Test 4: Testing case sensitivity ===');
  const caseTestCodes = [
    'admin_instant',
    'ADMIN_INSTANT',
    'Admin_Instant',
    'vip_access',
    'VIP_ACCESS',
    'Vip_Access'
  ];
  
  caseTestCodes.forEach(code => {
    const isSpecial = isAutoApprovalCode(code);
    logger.info(`Code "${code}" -> Auto-approval: ${isSpecial}`);
  });
  
  logger.info('Special codes testing completed!');
}

// Helper function to demonstrate API usage
async function demonstrateAPIUsage() {
  logger.info('=== API Usage Demo ===');
  
  // Simulate checking a code during application process
  const applicationCode = 'VIP_ACCESS';
  
  if (isAutoApprovalCode(applicationCode)) {
    logger.info(`✅ User with code "${applicationCode}" will be auto-approved`);
  } else {
    logger.info(`❌ User with code "${applicationCode}" requires manual approval`);
  }
  
  // Simulate checking invalid code
  const invalidCode = 'INVALID_CODE_123';
  
  if (isAutoApprovalCode(invalidCode)) {
    logger.info(`✅ User with code "${invalidCode}" will be auto-approved`);
  } else {
    logger.info(`❌ User with code "${invalidCode}" requires manual approval`);
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testSpecialCodes()
    .then(() => demonstrateAPIUsage())
    .then(() => {
      logger.info('All tests completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Test failed', { error: error.message });
      process.exit(1);
    });
}