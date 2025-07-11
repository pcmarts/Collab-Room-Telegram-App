#!/usr/bin/env tsx
/**
 * Test script to verify the approval functionality is working after the fix
 */

import { db } from "../../server/db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";

async function testApprovalFixed() {
  console.log("=== Testing Approval Status After Fix ===");
  
  try {
    // Check the status of the user we just tried to approve
    const userToCheck = await db
      .select()
      .from(users)
      .where(eq(users.telegram_id, "7892486659"))
      .limit(1);

    if (userToCheck.length > 0) {
      const user = userToCheck[0];
      console.log("User found:", user.first_name, user.last_name);
      console.log("Current approval status:", user.is_approved);
      console.log("Approved at:", user.approved_at);
      
      if (user.is_approved) {
        console.log("✅ User is successfully approved!");
        console.log("Approval time:", user.approved_at?.toISOString());
      } else {
        console.log("❌ User is still pending approval");
      }
    } else {
      console.log("❌ User not found in database");
    }

    // Also check other pending users
    console.log("\n=== Checking All Pending Users ===");
    const pendingUsers = await db
      .select()
      .from(users)
      .where(eq(users.is_approved, false));

    console.log(`Found ${pendingUsers.length} pending users:`);
    pendingUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.first_name} ${user.last_name || ''} (${user.telegram_id})`);
    });

    // Check recently approved users
    console.log("\n=== Checking Recently Approved Users ===");
    const approvedUsers = await db
      .select()
      .from(users)
      .where(eq(users.is_approved, true));

    console.log(`Found ${approvedUsers.length} approved users:`);
    approvedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.first_name} ${user.last_name || ''} (approved: ${user.approved_at?.toISOString() || 'unknown'})`);
    });

  } catch (error) {
    console.error("Error during test:", error);
  }
}

// Run the test
testApprovalFixed()
  .then(() => {
    console.log("\n=== Test completed ===");
    process.exit(0);
  })
  .catch(error => {
    console.error("Test failed:", error);
    process.exit(1);
  });