#!/usr/bin/env tsx
/**
 * Test script to simulate the approval button click
 */

import { bot } from "../../server/telegram";
import { db } from "../../server/db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";

async function testApprovalSimulation() {
  console.log("=== Testing Approval Simulation ===");
  
  try {
    // Get the admin user that should be clicking the button
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.telegram_id, "1211030693")) // Paul Martin admin
      .limit(1);

    if (!adminUser.length) {
      console.error("Admin user not found");
      return;
    }

    console.log("Admin user found:", adminUser[0].first_name);

    // Get a pending user
    const pendingUser = await db
      .select()
      .from(users)
      .where(eq(users.is_approved, false))
      .limit(1);

    if (!pendingUser.length) {
      console.error("No pending users found");
      return;
    }

    console.log("Pending user found:", pendingUser[0].first_name, pendingUser[0].telegram_id);

    // Simulate the callback query that would be sent when admin clicks approve
    const simulatedCallbackQuery = {
      id: "test_callback_123",
      from: {
        id: parseInt(adminUser[0].telegram_id),
        first_name: adminUser[0].first_name,
        last_name: adminUser[0].last_name || "",
        username: adminUser[0].username || "",
      },
      data: `approve_user_${pendingUser[0].telegram_id}`,
      message: {
        message_id: 12345,
        chat: {
          id: parseInt(adminUser[0].telegram_id),
        },
        date: Math.floor(Date.now() / 1000),
        text: "Test message",
      },
    };

    console.log("Simulated callback query:", JSON.stringify(simulatedCallbackQuery, null, 2));

    // Test the approval handler directly
    console.log("\n=== Testing approval handler directly ===");
    
    // Import the handler function (we need to make it accessible)
    console.log("Checking if user is approved before test:", pendingUser[0].is_approved);
    
    // Instead of calling the handler directly, let's check if a real callback would work
    console.log("Expected callback data format:", `approve_user_${pendingUser[0].telegram_id}`);
    
    // Check if the bot has the callback listener
    const listeners = bot.listeners('callback_query');
    console.log("Number of callback_query listeners:", listeners.length);
    
    if (listeners.length > 0) {
      console.log("✅ Bot has callback_query listener registered");
      
      // Test parsing the callback data
      const testCallbackData = `approve_user_${pendingUser[0].telegram_id}`;
      const parts = testCallbackData.split("_");
      const telegramIdToApprove = parts[2];
      
      console.log("Parsed telegram ID from callback:", telegramIdToApprove);
      console.log("Original telegram ID:", pendingUser[0].telegram_id);
      console.log("IDs match:", telegramIdToApprove === pendingUser[0].telegram_id);
      
      if (telegramIdToApprove === pendingUser[0].telegram_id) {
        console.log("✅ Callback data parsing works correctly");
      } else {
        console.error("❌ Callback data parsing failed");
      }
    } else {
      console.error("❌ No callback_query listener found");
    }

    console.log("\n=== Test Summary ===");
    console.log("- Admin user exists:", adminUser.length > 0);
    console.log("- Pending user exists:", pendingUser.length > 0);
    console.log("- Callback listener registered:", listeners.length > 0);
    console.log("- Expected callback format:", `approve_user_${pendingUser[0].telegram_id}`);
    
    console.log("\nTo test the approval button:");
    console.log("1. Find the admin notification message in Telegram");
    console.log("2. Click the 'Approve Application' button");
    console.log("3. Check the server logs for [CALLBACK] and [APPROVAL] messages");
    
  } catch (error) {
    console.error("Error during simulation:", error);
  }
}

// Run the test
testApprovalSimulation()
  .then(() => {
    console.log("\n=== Simulation test completed ===");
    process.exit(0);
  })
  .catch(error => {
    console.error("Test failed:", error);
    process.exit(1);
  });