/**
 * Test script to verify Telegram notifications are working for collaboration requests
 */

const { db } = require('./server/db');
const { users, collaborations, requests } = require('./shared/schema');
const { notifyNewCollabRequest } = require('./server/telegram');
const { eq } = require('drizzle-orm');

async function testNotificationFlow() {
  console.log('🔍 Testing Telegram notification flow...');
  
  try {
    // Find a real user and collaboration for testing
    const testUser = await db.select().from(users).where(eq(users.telegram_id, '7892486659')).limit(1);
    const testCollab = await db.select().from(collaborations).limit(1);
    
    if (!testUser.length || !testCollab.length) {
      console.log('❌ Test user or collaboration not found');
      return;
    }
    
    console.log(`✅ Found test user: ${testUser[0].first_name} (${testUser[0].id})`);
    console.log(`✅ Found test collaboration: ${testCollab[0].collab_type} (${testCollab[0].id})`);
    
    // Test the notification function
    console.log('📧 Testing notification function...');
    const result = await notifyNewCollabRequest(
      testCollab[0].creator_id,
      testUser[0].id,
      testCollab[0].id
    );
    
    console.log(`📧 Notification result: ${result ? 'SUCCESS' : 'FAILED'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testNotificationFlow();