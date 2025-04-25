# Telegram Notification System Fixes

## Overview

This document describes the improvements made to the Telegram notification system to resolve critical issues affecting notification delivery in Collab Room, particularly with right-swipe notifications for collaboration requests.

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