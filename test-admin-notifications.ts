/**
 * This script tests the enhanced admin notification system
 * It simulates a new user application and sends a notification to all admin users
 * 
 * Run with:
 * npx tsx test-admin-notifications.ts
 */

import { notifyAdminsNewUser } from './server/telegram';

async function testAdminNotificationSystem() {
  console.log('===== Testing Enhanced Admin Notification System =====');
  
  // Create mock user data - this represents a new user application
  const mockUserData = {
    telegram_id: "12345678",  // Demo telegram ID
    first_name: "John",
    last_name: "Demo",
    handle: "johndemo",
    company_name: "Demo Company",
    company_website: "www.democompany.com",
    job_title: "Chief Testing Officer"
  };
  
  try {
    console.log('Sending notification with the following user data:');
    console.log(JSON.stringify(mockUserData, null, 2));
    
    // Send notification to all admin users
    await notifyAdminsNewUser(mockUserData);
    
    console.log('\n✅ Notification sent successfully! Check the logs/admin_messages.log file for the logged messages.');
    console.log('✅ Check your admin Telegram account for the notification with the enhanced information and inline buttons.');
  } catch (error) {
    console.error('❌ Error sending notification:', error);
  }
  
  console.log('\n===== Test Complete =====');
}

// Run the test
testAdminNotificationSystem().catch(console.error);