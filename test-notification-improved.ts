/**
 * Test script for notification system with improved debugging
 * 
 * Run with:
 * npx tsx test-notification-improved.ts
 */

import { db } from './server/db';
import { users, collaborations, notification_preferences } from './shared/schema';
import { eq } from 'drizzle-orm';
import { notifyNewCollabRequest } from './server/telegram';
import * as crypto from 'crypto';

async function main() {
  try {
    console.log("Starting notification test with improved debugging");
    
    // Get a sample approved user
    const [host] = await db
      .select()
      .from(users)
      .where(eq(users.is_approved, true))
      .limit(1);
    
    if (!host) {
      console.error("No approved users found in the database");
      return;
    }
    
    console.log(`Found host user: ${host.id} (${host.first_name} ${host.last_name || ''})`);
    console.log(`Host Telegram ID: ${host.telegram_id || 'none'}`);
    
    // Get a second approved user
    const [requester] = await db
      .select()
      .from(users)
      .where(eq(users.is_approved, true))
      .where(db.sql`${users.id} != ${host.id}`)
      .limit(1);
    
    if (!requester) {
      console.error("Could not find a second approved user");
      return;
    }
    
    console.log(`Found requester user: ${requester.id} (${requester.first_name} ${requester.last_name || ''})`);
    console.log(`Requester Telegram ID: ${requester.telegram_id || 'none'}`);
    
    // Get a collaboration created by the host
    const [collaboration] = await db
      .select()
      .from(collaborations)
      .where(eq(collaborations.creator_id, host.id))
      .limit(1);
    
    if (!collaboration) {
      console.log("No collaboration found for host, creating a test collaboration...");
      
      // Create a test collaboration
      const [newCollaboration] = await db
        .insert(collaborations)
        .values({
          id: crypto.randomUUID(),
          creator_id: host.id,
          collab_type: 'Co-Marketing on Twitter',
          status: 'active',
          created_at: new Date(),
          description: 'Test collaboration for notification testing'
        })
        .returning();
      
      console.log(`Created test collaboration: ${newCollaboration.id}`);
      
      // Use the new collaboration
      collaboration = newCollaboration;
    } else {
      console.log(`Found existing collaboration: ${collaboration.id}`);
    }
    
    // Check notification preferences
    const [preferences] = await db
      .select()
      .from(notification_preferences)
      .where(eq(notification_preferences.user_id, host.id));
    
    console.log(`Host notification preferences: ${preferences ? (preferences.notifications_enabled ? 'enabled' : 'disabled') : 'not set'}`);
    
    if (preferences && preferences.notifications_enabled === false) {
      console.log("Enabling host notifications for testing...");
      
      // Enable notifications temporarily for testing
      await db
        .update(notification_preferences)
        .set({ notifications_enabled: true })
        .where(eq(notification_preferences.user_id, host.id));
      
      console.log("Notifications enabled for test");
    }
    
    // Send a test notification
    console.log("Sending test notification...");
    console.log(`Parameters: hostUserId=${host.id}, requesterUserId=${requester.id}, collaborationId=${collaboration.id}`);
    
    const result = await notifyNewCollabRequest(
      host.id,          // Host user ID (collaboration creator)
      requester.id,     // Requester user ID (user who swiped right)
      collaboration.id  // Collaboration ID
    );
    
    console.log(`Notification result: ${result ? 'Success' : 'Failed'}`);
    
    // If we temporarily enabled notifications, restore previous setting
    if (preferences && preferences.notifications_enabled === false) {
      console.log("Restoring original notification settings...");
      
      await db
        .update(notification_preferences)
        .set({ notifications_enabled: false })
        .where(eq(notification_preferences.user_id, host.id));
      
      console.log("Original settings restored");
    }
    
    console.log("Test completed");
    process.exit(0);
  } catch (error) {
    console.error("Error during notification test:", error);
    process.exit(1);
  }
}

main();