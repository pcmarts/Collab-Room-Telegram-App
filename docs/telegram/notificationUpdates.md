# Personalized Collaboration Request Notifications

## Overview

The Collab Room has enhanced the Telegram notification system with personalized notes for collaboration requests. When users send a collaboration request, they can now include a customized note that appears directly in the Telegram notification sent to the host.

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
