/**
 * Test script for query performance with database indexes
 * 
 * This script runs the searchCollaborationsPaginated query multiple times
 * and measures the execution time to evaluate performance improvements
 * 
 * Run with:
 * npx tsx test-query-performance.js
 */

import { db } from './server/db.js';
import { IStorage } from './server/storage.js';
import { StorageImplementation } from './server/storage.js';

async function runQueryTest() {
  console.log('Starting query performance test...');
  console.log('======================================');
  
  try {
    // Get a test user ID
    const [testUser] = await db.query.users.findMany({
      where: (users, { eq }) => eq(users.is_approved, true),
      limit: 1
    });
    
    if (!testUser) {
      console.error('No approved users found for testing');
      return;
    }
    
    const userId = testUser.id;
    console.log(`Testing with user ID: ${userId}`);
    
    // Create storage instance
    const storage = new StorageImplementation();
    
    // Parameters for the test
    const numIterations = 5;
    const pageSize = 10;
    
    // Run multiple iterations and measure time
    let totalTimeMs = 0;
    
    for (let i = 0; i < numIterations; i++) {
      console.log(`\nIteration ${i + 1}/${numIterations}`);
      
      const startTime = performance.now();
      
      const result = await storage.searchCollaborationsPaginated(userId, {
        limit: pageSize,
        excludeOwn: true
      });
      
      const endTime = performance.now();
      const executionTimeMs = endTime - startTime;
      
      totalTimeMs += executionTimeMs;
      
      console.log(`Found ${result.items.length} collaborations`);
      console.log(`Query execution time: ${executionTimeMs.toFixed(2)}ms`);
    }
    
    const avgTimeMs = totalTimeMs / numIterations;
    console.log('\n======================================');
    console.log(`Average execution time: ${avgTimeMs.toFixed(2)}ms over ${numIterations} iterations`);
    console.log('======================================');
    
  } catch (error) {
    console.error('Error during performance test:', error);
  }
}

runQueryTest().catch(console.error);