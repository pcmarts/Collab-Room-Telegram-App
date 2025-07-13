# Telegram Notification System Fixes

## Overview

This document describes the improvements made to the Telegram notification system to resolve critical issues affecting notification delivery in Collab Room, particularly with right-swipe notifications for collaboration requests.

## Latest Fixes - Field Reference Issues (January 16, 2025)

### Problem 1: User Roles Not Displaying in Notifications
User roles (e.g., "CMO") were not appearing in Telegram collaboration request notifications, showing as empty or undefined values.

### Root Cause 1
The `notifyNewCollabRequest` function in `server/telegram.ts` was attempting to access `requesterCompany?.role_title` to display the user's role, but this field doesn't exist in the database schema.

### Solution 1
- **Fixed field reference**: Changed `role_title` to `job_title` in the notification message formatting
- **Database schema verification**: Confirmed that the `companies` table uses `job_title` field (line 296 in `shared/schema.ts`)
- **Updated line 2809** in `server/telegram.ts` to use correct field name

### Problem 2: Match/Hide Button Errors
When hosts pressed the Match or Hide buttons in Telegram notifications, database errors occurred preventing the callback from being processed.

### Root Cause 2
The `handleSwipeCallback` function was using an incorrect database field name `requests.user_id` in three separate database queries, but this field doesn't exist in the schema.

### Solution 2
- **Fixed database queries**: Updated all instances of `requests.user_id` to `requests.requester_id`
- **Database schema verification**: Confirmed that the `requests` table uses `requester_id` field (lines 575-605 in `shared/schema.ts`)
- **Updated three queries**: Fixed checking for existing requests, updating to 'accepted' status, and updating to 'hidden' status

### Verification
- User roles now properly display in collaboration request notifications (e.g., "👤 CMO")
- Match and Hide buttons function correctly without database errors
- Both fixes tested with request ID `ef677927-961c-49b3-9d7a-b798e02fd629`
- Enhanced error handling for database field reference issues

### Technical Details
- The `companies` table schema includes `job_title` field, not `role_title`
- The `requests` table schema includes `requester_id` and `host_id` fields, not `user_id`
- All callback button interactions now work properly with correct field references
- Fallback behavior implemented for missing role information

## Previous Fix - Route Definition Issue (July 13, 2025)

### Problem
Telegram notifications were not being sent to collaboration hosts when users requested collaborations, despite the notification system being implemented and apparently functional.

### Root Cause
The issue was caused by **duplicate route definitions** in the Express.js server for `/api/collaborations/:id/apply`:
1. Basic route handler (line 1284) - Simple validation, no notification code
2. Enhanced route handler (line 3082) - Full validation, notification system, enhanced logging

Express.js was using the first matching route definition, so the basic route intercepted all requests before they could reach the enhanced route containing the notification code.

### Solution
1. **Removed duplicate route**: Deleted the basic route handler that was intercepting requests
2. **Fixed validation mismatch**: Updated validation from complex `collabApplicationSchema` to simple message validation matching frontend payload
3. **Cleaned up duplicate logic**: Removed duplicate application creation code
4. **Enhanced logging**: Confirmed full notification flow execution

### Verification
- Collaboration request successfully processed with full enhanced logging visible
- Telegram notification sent to host (Message ID: 713 confirmed)
- Interactive buttons included for quick response (Hide/Match options)
- HTTP 201 response returned successfully
- Enhanced logging confirms: route handler → storage → Telegram API → success response

### Technical Details
- Express.js route matching uses first-match-wins principle
- Frontend sends simple `{message: "text"}` payload
- Backend was expecting complex form data with multiple required fields
- Fixed by simplifying validation to match actual frontend implementation

## Key Issues Fixed

### 1. Telegram Callback Data Length Limit

**Problem**: Telegram has a 64-byte limit for callback data in buttons. Our full UUIDs were exceeding this limit, causing "BUTTON_DATA_INVALID" errors.

**Solution**: 
- Implemented shortened UUID references (first 8 characters) in callback data
- Modified SQL queries to properly handle substring matching of UUIDs
- Added debug logging to track UUID processing

### 2. Chat Not Found Errors

**Problem**: When attempting to set up bot commands or send notifications to users who hadn't interacted with the bot yet, "Bad Request: chat not found" errors would occur.

**Solution**:
- Added validation checks using `isValidChatId()` helper function to verify chat IDs
- Implemented error handling to skip command setup for invalid chat IDs
- Added retry mechanisms for database connections during bot setup

### 3. Field Reference Confusion

**Problem**: The code was checking for `collaboration.user_id` in callback handlers, but the correct field was `collaboration.creator_id`.

**Solution**:
- Fixed field references to use `creator_id` consistently throughout the codebase
- Added detailed comments to clarify field usage 
- Enhanced error logging to detect field reference issues

## Implementation Details

### Shortened UUID Implementation

```typescript
// Before:
const callback_data = `swipe_${direction}_${collaborationId}_${requesterId}`;

// After:
const shortCollabId = collaborationId.substring(0, 8);
const shortRequesterId = requesterUserId.substring(0, 8);
const callback_data = `s${direction.charAt(0)}_${shortCollabId}_${shortRequesterId}`;
```

### SQL Query for Shortened UUID Lookup

```typescript
// Before (incorrect):
.where(sql`SUBSTRING(${collaborations.id}, 1, 8) = ${shortCollabId}`);

// After (corrected):
.where(sql`SUBSTRING(CAST(${collaborations.id} as TEXT), 1, 8) = ${shortCollabId}`);
```

### Chat ID Validation

```typescript
async function isValidChatId(chatId: number): Promise<boolean> {
  try {
    // Try to get chat info - this will fail with "chat not found" if 
    // the bot hasn't interacted with this user yet
    await bot.getChat(chatId);
    return true;
  } catch (error) {
    console.log(`Chat ID ${chatId} appears to be invalid or hasn't interacted with bot`);
    return false;
  }
}
```

### Enhanced Notification Logging

```typescript
async function sendDirectFormattedMessage(
  chatId: number,
  text: string,
  options?: TelegramBot.SendMessageOptions
) {
  try {
    console.log(`[TELEGRAM] Attempting to send message to chat ID: ${chatId}`);
    console.log(`[TELEGRAM] Message preview: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
    console.log(`[TELEGRAM] Message options:`, JSON.stringify(options || {}));
    
    const result = await bot.sendMessage(chatId, text, options);
    console.log(`[TELEGRAM] Successfully sent formatted message to ${chatId}`);
    return true;
  } catch (error) {
    console.error(`[TELEGRAM] Failed to send message to ${chatId}:`, error);
    // More detailed error logging for troubleshooting
    if (error instanceof Error) {
      console.error(`[TELEGRAM] Error name: ${error.name}, message: ${error.message}`);
      console.error(`[TELEGRAM] Error stack: ${error.stack}`);
    }
    return false;
  }
}
```

## Testing Methodology

A new test script `test-notification-improved.ts` has been created to facilitate testing and debugging of the notification system. This script:

1. Finds users with notifications enabled
2. Locates or creates a test collaboration
3. Ensures notification preferences are properly set
4. Attempts to send a test notification
5. Logs detailed information about each step of the process

## Future Recommendations

1. **Implement Queue-based Notifications**: Consider implementing a queue system (like Redis) for notification delivery to ensure reliability.

2. **Extended Logging**: Maintain detailed logs for all notification attempts to help diagnose future issues.

3. **Notification Status Dashboard**: Create an admin dashboard for monitoring notification delivery status and identifying problems.

4. **Regular Chat ID Validation**: Periodically validate cached chat IDs to ensure they remain valid over time.