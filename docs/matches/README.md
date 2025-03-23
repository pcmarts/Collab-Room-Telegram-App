# Matches Module Documentation

## Overview

The Matches page displays users who have matched with collaborations. Users can view details about matches and initiate chats with matched users.

## Key Features

- Display of match cards showing collaboration type, person, and company information
- "Details" button to show comprehensive information about the collaboration and matched person
- "Chat" button to initiate Telegram conversations with matched users
- Status indicators for active/inactive matches

## Technical Implementation

### Backend API

The matches API endpoint (`/api/matches`) retrieves match data with the following features:

- Authentication via Telegram user data
- Cache-Control headers to optimize performance 
- ETag for content validation
- Detailed error reporting for improved debugging

### React Frontend

The Matches page component:

- Uses React Query for data fetching with proper caching strategy
- Implements stable query keys to prevent infinite request cycles
- Shows loading spinners during API requests
- Displays appropriate error messages when API requests fail

### Match Data Structure

Each match includes:

```typescript
interface Match {
  id: string;
  matchDate: string;
  status: string;
  collaborationType: string; 
  description: string;
  details: any; // Collaboration-specific details
  matchedPerson: string;
  companyName: string;
  roleTitle: string;
  companyDescription?: string;
  userDescription?: string;
  username?: string; // Telegram username for chat links
}
```

## Recent Fixes

**Version 1.3.1 (2025-03-23):**

- Fixed server-side 500 error caused by incompatible `require('crypto')` call in ESM context
- Resolved infinite API requests issue by implementing stable React Query keys
- Improved API response handling with proper JSON parsing
- Added caching headers to improve performance
- Simplified ETag generation for better compatibility

## Security & Performance Considerations

- No hardcoded usernames or Telegram IDs exist in the codebase; all user data comes from the database
- Matches are only shown to authenticated users
- Caching mechanisms help reduce server load
- Proper error handling prevents information leakage