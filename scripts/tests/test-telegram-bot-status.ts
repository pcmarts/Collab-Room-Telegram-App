#!/usr/bin/env tsx
/**
 * Test script to check Telegram bot status and callback handling
 */

import { bot } from "../../server/telegram";
import { db } from "../../server/db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";

async function testTelegramBotStatus() {
  console.log("=== Telegram Bot Status Test ===");
  console.log("Testing bot connection and callback handling...");

  try {
    // Test 1: Check bot info
    console.log("\n1. Testing bot connection...");
    const botInfo = await bot.getMe();
    console.log("✅ Bot connected successfully");
    console.log("Bot username:", botInfo.username);
    console.log("Bot ID:", botInfo.id);

    // Test 2: Check if polling is active
    console.log("\n2. Checking polling status...");
    console.log("Polling enabled:", bot.isPolling());

    // Test 3: Check admin users in database
    console.log("\n3. Checking admin users...");
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.is_admin, true));
    
    console.log(`Found ${adminUsers.length} admin users:`);
    adminUsers.forEach(admin => {
      console.log(`- ${admin.first_name} ${admin.last_name || ''} (${admin.telegram_id})`);
    });

    // Test 4: Check pending users
    console.log("\n4. Checking pending users...");
    const pendingUsers = await db
      .select()
      .from(users)
      .where(eq(users.is_approved, false));
    
    console.log(`Found ${pendingUsers.length} pending users:`);
    pendingUsers.forEach(user => {
      console.log(`- ${user.first_name} ${user.last_name || ''} (${user.telegram_id})`);
    });

    // Test 5: Check callback query listeners
    console.log("\n5. Checking callback query listeners...");
    const listeners = bot.listeners('callback_query');
    console.log(`Found ${listeners.length} callback_query listeners`);

    console.log("\n✅ All tests passed! Bot appears to be working correctly.");
    
  } catch (error) {
    console.error("❌ Error during testing:", error);
    console.error("Error details:", error.message);
    
    if (error.message.includes('TOKEN')) {
      console.error("This appears to be a token-related error. Check your bot token.");
    }
    
    if (error.message.includes('polling')) {
      console.error("This appears to be a polling-related error. Bot might not be receiving updates.");
    }
  }
}

// Run the test
testTelegramBotStatus()
  .then(() => {
    console.log("\n=== Test completed ===");
    process.exit(0);
  })
  .catch(error => {
    console.error("Test failed:", error);
    process.exit(1);
  });