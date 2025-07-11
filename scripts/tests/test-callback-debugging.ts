#!/usr/bin/env tsx
/**
 * Test script to debug callback query handling
 */

import { bot } from "../../server/telegram";
import { db } from "../../server/db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";

async function testCallbackDebugging() {
  console.log("=== Callback Query Debugging Test ===");
  console.log("This will listen for callback queries for 30 seconds...");

  // Add a temporary callback query listener to debug
  bot.on('callback_query', (callbackQuery) => {
    console.log("\n🔥 CALLBACK QUERY RECEIVED!");
    console.log("Time:", new Date().toISOString());
    console.log("From:", callbackQuery.from.first_name, callbackQuery.from.id);
    console.log("Data:", callbackQuery.data);
    console.log("Message ID:", callbackQuery.message?.message_id);
    console.log("Chat ID:", callbackQuery.message?.chat.id);
    console.log("Full callback query:", JSON.stringify(callbackQuery, null, 2));
    
    // Answer the callback query immediately to test
    bot.answerCallbackQuery(callbackQuery.id, {
      text: "Debug: Received callback query!",
    }).catch(err => {
      console.error("Error answering callback query:", err);
    });
  });

  // Listen for any messages to debug
  bot.on('message', (msg) => {
    console.log("\n📨 MESSAGE RECEIVED!");
    console.log("From:", msg.from?.first_name, msg.from?.id);
    console.log("Text:", msg.text);
    console.log("Chat ID:", msg.chat.id);
  });

  // Also check recent pending users that might have approval buttons
  console.log("\n=== Recent Pending Users ===");
  const pendingUsers = await db
    .select()
    .from(users)
    .where(eq(users.is_approved, false))
    .limit(3);
  
  console.log("These users should have approval buttons in admin chat:");
  pendingUsers.forEach(user => {
    console.log(`- ${user.first_name} ${user.last_name || ''} (${user.telegram_id})`);
    console.log(`  Expected callback data: approve_user_${user.telegram_id}`);
  });

  console.log("\n⏰ Listening for callbacks for 30 seconds...");
  console.log("Please click the 'Approve Application' button in Telegram now!");
  
  // Wait for 30 seconds
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  console.log("\n✅ Test completed. Check the output above for any callback queries.");
}

// Run the test
testCallbackDebugging()
  .then(() => {
    console.log("\n=== Debug test completed ===");
    process.exit(0);
  })
  .catch(error => {
    console.error("Test failed:", error);
    process.exit(1);
  });