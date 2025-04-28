# Telegram Notification System Updates

## Overview

The Collab Room has enhanced the Telegram notification system with multiple improvements, including enhanced admin notifications with inline approval functionality, application confirmation notifications, personalized notes for collaboration requests, and an improved admin broadcast system. This document details all notification-related enhancements.

> **Important Update**: For information about recent fixes to the notification delivery system, including solutions for callback data length limits and chat ID validation, see [Notification Fixes](./notification-fixes.md).

## Enhanced Admin Notifications (v1.10.9)

The system now provides administrators with rich, interactive notifications about new user applications with direct approval capabilities.

### Features

- **Enriched User Information**: Displays applicant's name, Telegram handle, company details, and role
- **Hyperlinked Company Information**: Company name is hyperlinked to the company website for quick validation
- **HTML Formatted Messages**: Improved message readability with proper formatting and emphasis
- **Interactive Approval Button**: Allows admins to approve applications directly from Telegram
- **Improved Telegram ID Handling**: Robust error handling for various Telegram ID formats
- **Dedicated Admin Notification Logging**: Comprehensive logging of admin notification events

### Implementation Details

When a new user submits an application, the following process occurs:

1. The application data is saved to the database
2. An enhanced notification is sent to all admin users with the following information:
   - User's full name with Telegram handle
   - Hyperlinked company name with website URL
   - User's role/job title
   - Interactive approval button
   - Link to view application details
3. Admin can approve the application directly from Telegram
4. The notification message is updated after approval to prevent duplicate approvals

#### Telegram Notification Format

```
🆕 New User Application!

Name: John Smith (@johnsmith)
Company: Blockchain Innovations (hyperlinked to company website)
Role: Chief Technology Officer

Use the buttons below to take action:
```

#### Interactive Button Integration

Each notification includes buttons for direct actions:

```typescript
const keyboard = {
  inline_keyboard: [
    [
      {
        text: "✅ Approve Application",
        callback_data: `approve_user_${userData.telegram_id}`,
      },
    ],
    [
      {
        text: "👁️ View Application",
        web_app: { url: `${WEBAPP_URL}/admin/applications` },
      },
    ],
  ],
};
```

#### Telegram ID Validation

The system now includes robust validation for Telegram IDs to prevent notification failures:

```typescript
// Try multiple ways to convert the ID to a proper number
if (typeof admin.telegram_id === 'number') {
  telegramId = admin.telegram_id;
} else if (typeof admin.telegram_id === 'string') {
  // Remove any non-numeric characters and parse as integer
  const cleanId = admin.telegram_id.replace(/[^0-9]/g, '');
  telegramId = parseInt(cleanId, 10);
} else {
  console.error(`[ADMIN_NOTIFICATION] Invalid admin Telegram ID format`);
  continue; // Skip this admin
}

// Double-check that we have a valid number
if (isNaN(telegramId) || telegramId <= 0) {
  console.error(`[ADMIN_NOTIFICATION] Invalid admin Telegram ID after conversion`);
  continue; // Skip this admin
}
```

## Application Confirmation Notifications (v1.10.8)

The system now sends immediate notification messages to users when they submit their application to join the platform.

### Features

- **Immediate Application Feedback**: Users receive a Telegram message immediately after submitting their application
- **Telegram Handle Integration**: The notification includes the user's Telegram handle (@username) in the message
- **Interactive Application Status Button**: Each notification includes a button to check application status
- **Improved User Experience**: Provides immediate confirmation that the application was received successfully

### Implementation Details

When a user submits an application, the following process occurs:

1. The application data is saved to the database as before
2. Admin notification is sent to all admin users as before
3. A new confirmation notification is sent directly to the applicant with their Telegram handle
4. The notification includes an interactive button to check application status

#### Telegram Notification Format

```
🎉 Application Submitted Successfully! @username

Thank you for applying to join Collab Room. Click below to check your application status anytime.
```

#### Button Integration

Each notification includes a button that opens the application status page:

```typescript
const keyboard = {
  inline_keyboard: [
    [
      {
        text: "Check Application Status",
        web_app: { url: `${WEBAPP_URL}/application-status` },
      },
    ],
  ],
};
```

## Admin Broadcast System (v1.8.0 and v1.8.1)

The admin broadcast feature allows administrators to send formatted announcements to all approved users who have notifications enabled.

### Features

- **Disabled Link Previews**: All broadcast messages have link previews disabled to maintain clean message appearance (v1.8.0)
- **Enhanced HTML Formatting**: Support for bold text, italics, and hyperlinks in broadcast messages (v1.8.0)
- **Personalization Placeholders**: Dynamic replacement of placeholders like {handle} and {company} with user-specific information (v1.8.0)
- **Interactive Button**: Each broadcast includes a "Launch Collab Room" button to direct users to the app (v1.8.0)
- **Improved Error Handling**: Enhanced validation and error trapping for HTML parsing issues (v1.8.0)
- **Debug Logging**: Comprehensive logging system to assist with troubleshooting message broadcasts (v1.8.0)
- **Optimized Performance**: Efficient batch operations for database queries to prevent timeouts with large user lists (v1.8.1)
- **Proper Admin Command Scope**: Improved command visibility to ensure admin commands appear only to authorized users (v1.8.1)
- **Enhanced Scalability**: Memory-efficient data processing for large broadcasts using batch processing (v1.8.1)

### Example Broadcast Message

```
📣 <b>Admin Announcement</b>

Hey @UserHandle 

6x <b>Collabs</b> are now live in the <b>Collab Room</b>:

🔥 <a href='https://x.com/zerion'>Zerion</a> - Blog Feature
🔥 <a href='https://x.com/re'>RE</a> - X Giveaway/Retweet Campaign
🔥 <a href='https://x.com/t3rn_io'>T3RN</a> - X Spaces
🔥 <a href='https://x.com/bondexapp'>Bondex</a> - Report Feature & X Spaces

If you haven't already, definitely go ahead and <b>add your first collab</b> up for CompanyName. It's only day 1 and we're still in Beta so please share any feedback to @thisispaulm.
```

### Admin Command Access

- The `/broadcast` command is exclusively available to admin users
- The command is hidden from regular users' command menu
- Additional security checks verify admin status before allowing broadcast execution

### Implementation Details

The broadcast system uses a multi-step process with state tracking:

1. **Command Initiation**: Admin starts with `/broadcast` command
2. **Message Composition**: Admin composes HTML-formatted message with placeholders
3. **Message Preview**: System shows how message will appear with placeholders filled
4. **Confirmation**: Admin confirms or cancels the broadcast
5. **Execution**: System sends personalized messages to all eligible users

#### Data Retrieval Optimization (v1.8.1)

The broadcast feature was optimized in v1.8.1 to handle large user lists:

1. **Efficient Batch Queries**: Instead of a JOIN operation, separate queries fetch user and company data
2. **Memory-Efficient Processing**: Data is processed in-memory using Map objects for efficient lookup
3. **Proper User Filtering**: Only users with notifications enabled receive messages
4. **Request Rate Limiting**: Small delay between messages prevents hitting Telegram API limits

#### Personalization Placeholders

The broadcast system supports these dynamic placeholders:

| Placeholder | Replaced With | Example |
|-------------|---------------|---------|
| `{first_name}` | User's first name | "John" |
| `{last_name}` | User's last name | "Smith" |
| `{full_name}` | User's full name | "John Smith" |
| `{handle}` | User's Telegram handle with @ | "@johnsmith" |
| `{company}` | User's company name | "Acme Corp" |

#### Message Formatting

```typescript
// Format the message with personalization
let personalizedMessage = message;
personalizedMessage = personalizedMessage.replace(/\{first_name\}/g, user.first_name || "");
personalizedMessage = personalizedMessage.replace(/\{last_name\}/g, user.last_name || "");
personalizedMessage = personalizedMessage.replace(/\{handle\}/g, formattedHandle);
personalizedMessage = personalizedMessage.replace(/\{company\}/g, user.company_name || "");

// Create final message with header
const finalPersonalizedMessage = 
  `📣 <b>Admin Announcement</b>\n\n${personalizedMessage}`;

// Send with disabled link previews
await bot.sendMessage(userChatId, finalPersonalizedMessage, {
  parse_mode: "HTML",
  disable_web_page_preview: true, // Disable link previews for clean appearance
  reply_markup: launchKeyboard
});
```

## Personalized Collaboration Request Notifications

When users send a collaboration request, they can now include a customized note that appears directly in the Telegram notification sent to the host.

## Features Added in v1.7.5

- **Enhanced HTML Formatting in Notifications**: Fixed issues with HTML formatting when company names contain website links
- **Improved Notification Content**: Added more comprehensive collaboration details in notifications
- **HTML Escaping**: Properly handled special HTML characters to ensure notifications display correctly

## Features Added in v1.7.0

- **Personalized Notes in Telegram Notifications**: When a user sends a collaboration request with a note, the note is now included in the Telegram notification sent to the host.
- **Note Format**: Notes appear in the notification with a "Personal Note:" label, formatted in HTML for better readability.
- **Consistent Display**: Notes are displayed with the same formatting in both HTML-formatted messages and plain text fallback messages.
- **Confirmation Toasts**: Users receive clear confirmation toasts when their collaboration requests (with or without notes) are sent.

## Implementation Details

### Telegram Notification Format

When a user includes a personalized note with their collaboration request, the Telegram notification now includes this section:

```
<b>Personal Note:</b> "User's personalized message here"
```

### HTML Formatting and Safety (v1.7.5)

Notifications now properly handle company URLs and special HTML characters:

- Company URLs are properly formatted as HTML links with escaping
- Special characters like <, >, &, etc. are properly escaped in HTML content
- Comprehensive collaboration details (topic, description, date) are included with proper formatting

Example:
```
New collaboration request for <b>DeFi Treasury Management</b>
<b>From:</b> John Doe at <a href="https://example.com">Example Company</a>
<b>Description:</b> Seeking partners for treasury optimization and yield generation
<b>Date:</b> April 2025
```

### Plain Text Fallback

For cases where HTML formatting fails, the plain text fallback also includes the note:

```
Personal Note: "User's personalized message here"
```

### Note Persistence

Notes are now saved in both the swipes and matches tables to ensure they persist through the entire collaboration lifecycle, from initial request to established match.

## Example Usage

1. User discovers a collaboration of interest and swipes right
2. The Add Note dialog appears with options to add a personalized note or "Just send"
3. If the user adds a note, it's saved with the swipe and included in the Telegram notification
4. The host receives a Telegram notification containing the user's personalized note
5. If the host approves the request, the note is preserved in the match record for future reference

## Technical Components

- **AddNoteDialog**: Provides the interface for users to compose personalized notes
- **SwipeableCard**: Intercepts right swipes to show the note dialog before submitting
- **Telegram Notification Templates**: Include conditional rendering for notes when present
- **Database Storage**: Both swipes and matches tables now store and utilize the note field
