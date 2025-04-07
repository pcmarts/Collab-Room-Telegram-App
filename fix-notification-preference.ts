/**
 * Script to manually fix notification preferences for a specific user
 * 
 * Run with:
 * npx tsx fix-notification-preference.ts
 */

import { eq } from 'drizzle-orm';
import { pool } from './server/db';
import { users, notification_preferences } from './shared/schema';
import { drizzle } from 'drizzle-orm/postgres-js';

async function fixNotificationPreference() {
  // Initialize drizzle
  const db = drizzle(pool);
  
  try {
    // Get telegram ID of the user to fix from command line, or use the first admin user
    const args = process.argv.slice(2);
    const telegramId = args[0];
    
    let userToFix;
    
    if (telegramId) {
      console.log(`Looking for user with Telegram ID: ${telegramId}`);
      const results = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramId))
        .limit(1);
      userToFix = results[0];
    } else {
      console.log('No Telegram ID provided, using first admin user');
      const results = await db.select()
        .from(users)
        .where(eq(users.is_admin, true))
        .limit(1);
      userToFix = results[0];
    }
    
    if (!userToFix) {
      console.error('No user found in the database');
      process.exit(1);
    }
    
    console.log(`Found user with ID: ${userToFix.id}, Telegram ID: ${userToFix.telegram_id}`);
    
    // Check current notification preferences
    const prefResults = await db.select()
      .from(notification_preferences)
      .where(eq(notification_preferences.user_id, userToFix.id))
      .limit(1);
      
    const existingPrefs = prefResults[0];
    
    console.log('Current notification preferences:', existingPrefs);
    
    if (existingPrefs) {
      // Check if the notification preference is false and update the frequency if needed
      if (existingPrefs.notifications_enabled === false) {
        // Update to make sure the frequency matches the enabled status
        const updatedPrefs = await db
          .update(notification_preferences)
          .set({
            notification_frequency: 'Never', // When notifications are disabled, set frequency to Never
            updated_at: new Date()
          })
          .where(eq(notification_preferences.user_id, userToFix.id))
          .returning();
        
        console.log('Updated notification frequency to "Never" to match disabled status');
        console.log('Updated preferences:', updatedPrefs[0]);
      } else {
        // Make sure enabled notifications have "Instant" frequency
        const updatedPrefs = await db
          .update(notification_preferences)
          .set({
            notification_frequency: 'Instant',
            updated_at: new Date()
          })
          .where(eq(notification_preferences.user_id, userToFix.id))
          .returning();
        
        console.log('Updated notification frequency to "Instant" to match enabled status');
        console.log('Updated preferences:', updatedPrefs[0]);
      }
    } else {
      // Create new preferences if none exist - default to enabled with "Instant" frequency
      const newPrefs = await db
        .insert(notification_preferences)
        .values({
          user_id: userToFix.id,
          notifications_enabled: true,
          notification_frequency: 'Instant',
          updated_at: new Date()
        })
        .returning();
      
      console.log('Created new notification preferences with default settings');
      console.log('New preferences:', newPrefs[0]);
    }
    
    // Verify the update with a direct database query
    const verifyResults = await db.select()
      .from(notification_preferences)
      .where(eq(notification_preferences.user_id, userToFix.id))
      .limit(1);
      
    const verifyPrefs = verifyResults[0];
    
    console.log('Final notification preferences:', verifyPrefs);
    
    if (verifyPrefs) {
      // Verify the frequency matches the enabled status
      const shouldHaveFrequency = verifyPrefs.notifications_enabled ? 'Instant' : 'Never';
      
      if (verifyPrefs.notification_frequency !== shouldHaveFrequency) {
        console.error('WARNING: Frequency does not match enabled status!');
      } else {
        console.log('✅ Verification successful - notification frequency matches enabled status');
      }
    }
    
  } catch (error) {
    console.error('Failed to fix notification preferences:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the function
fixNotificationPreference().catch(console.error);