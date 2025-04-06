/**
 * Standalone script to toggle notification preferences for a specific user
 * 
 * Run with:
 * npx tsx toggle-notification-endpoint.ts [enable|disable]
 * 
 * Example:
 * npx tsx toggle-notification-endpoint.ts disable  // to turn off notifications
 * npx tsx toggle-notification-endpoint.ts enable   // to turn on notifications
 */

import { eq } from 'drizzle-orm';
import { pool } from './server/db';
import { users, notification_preferences } from './shared/schema';
import { drizzle } from 'drizzle-orm/postgres-js';

async function toggleNotifications() {
  const args = process.argv.slice(2);
  const toggleAction = args[0]?.toLowerCase();
  
  if (!toggleAction || !['enable', 'disable'].includes(toggleAction)) {
    console.error('Please specify either "enable" or "disable"');
    console.log('Usage: npx tsx toggle-notification-endpoint.ts [enable|disable]');
    process.exit(1);
  }
  
  const shouldEnable = toggleAction === 'enable';
  
  // Initialize drizzle
  const db = drizzle(pool);
  
  try {
    // Get the first admin user for testing/debugging
    const userResults = await db.select().from(users).where(eq(users.is_admin, true)).limit(1);
    const adminUser = userResults[0];
    
    if (!adminUser) {
      console.error('No admin user found in the database');
      process.exit(1);
    }
    
    console.log(`Found admin user with ID: ${adminUser.id}`);
    
    // Check current notification preferences
    const prefResults = await db.select()
      .from(notification_preferences)
      .where(eq(notification_preferences.user_id, adminUser.id))
      .limit(1);
    
    const existingPrefs = prefResults[0];
    
    console.log('Current notification preferences:', existingPrefs);
    
    // Update notification preferences
    if (existingPrefs) {
      // Update existing preferences
      const updatedPrefs = await db
        .update(notification_preferences)
        .set({
          notifications_enabled: shouldEnable,
          notification_frequency: shouldEnable ? 'Instant' : 'Daily',
          updated_at: new Date()
        })
        .where(eq(notification_preferences.user_id, adminUser.id))
        .returning();
      
      console.log(`Successfully ${shouldEnable ? 'enabled' : 'disabled'} notifications for user ${adminUser.id}`);
      console.log('Updated preferences:', updatedPrefs[0]);
    } else {
      // Create new preferences if none exist
      const newPrefs = await db
        .insert(notification_preferences)
        .values({
          user_id: adminUser.id,
          notifications_enabled: shouldEnable,
          notification_frequency: shouldEnable ? 'Instant' : 'Daily',
          updated_at: new Date()
        })
        .returning();
      
      console.log(`Successfully created and ${shouldEnable ? 'enabled' : 'disabled'} notifications for user ${adminUser.id}`);
      console.log('New preferences:', newPrefs[0]);
    }
    
    // Verify the update with a direct database query for absolute certainty
    const verifyResults = await db.select()
      .from(notification_preferences)
      .where(eq(notification_preferences.user_id, adminUser.id))
      .limit(1);
    
    const verifyPrefs = verifyResults[0];
    
    console.log('Verified notification preferences after update:', verifyPrefs);
    
    if (verifyPrefs?.notifications_enabled !== shouldEnable) {
      console.error('WARNING: Verification failed - the database value does not match the expected value!');
    } else {
      // Check if frequency matches expected value based on enabled state
      const expectedFrequency = shouldEnable ? 'Instant' : 'Daily';
      if (verifyPrefs.notification_frequency !== expectedFrequency) {
        console.error(`WARNING: Notification frequency check failed - expected ${expectedFrequency} but got ${verifyPrefs.notification_frequency}`);
      } else {
        console.log('✅ Verification successful - the database was correctly updated with proper notification values.');
      }
    }
    
  } catch (error) {
    console.error('Failed to toggle notifications:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the function
toggleNotifications().catch(console.error);