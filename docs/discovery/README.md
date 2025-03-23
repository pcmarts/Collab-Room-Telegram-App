# Discovery System

The Discovery System is a core feature of The Collab Room that enables users to discover collaboration opportunities created by other users. This document provides a detailed explanation of how the system works.

## Overview

The Discovery System presents users with a feed of collaboration cards that they can swipe through, similar to popular dating apps. Each card represents either a collaboration opportunity created by another user or a potential match (a user who has already swiped right on one of your collaborations).

## Components

The Discovery System consists of the following key components:

1. **Discovery Feed**: Frontend component that displays collaboration cards and potential matches to users
2. **Collaboration Filtering**: Backend logic that determines which collaborations to show
3. **User Preferences**: Settings that allow users to customize their discovery experience
4. **Swiping Mechanism**: Interface for users to accept or reject collaboration opportunities or potential matches
5. **Bidirectional Matching**: System that connects users who show mutual interest in collaborating

## Filtering Logic

The collaboration filtering logic is implemented in `server/storage.ts` within the `searchCollaborations` method. The current implementation follows these rules:

1. Only show **active** collaborations (status = 'active')
2. Exclude collaborations that have already been swiped on by the user (tracked in the swipes table)
3. By default, exclude collaborations created by the current user (controlled by the `excludeOwn` parameter)
4. Apply additional filtering based on user preferences when enabled:
   - Collaboration types (collab types)
   - Company tags and sectors
   - Twitter followers count (both user and company)
   - Token status and funding stages
   - Blockchain networks
   
The `excludeOwn` parameter controls whether a user's own collaborations are included in the search results. For the Discovery page, we exclude own collaborations by default (when `excludeOwn` is `undefined` or `true`), showing only other users' collaborations. For other views like personal profiles, we can include own collaborations by setting `excludeOwn` to `false`.

To ensure users don't see repeated content, the system maintains a combined exclusion list containing both:
1. The user's own collaborations (retrieved from the collaborations table)
2. Collaborations the user has already swiped on (retrieved from the swipes table)

This ensures that after refreshing the Discovery page, users will only see new collaboration opportunities that they haven't interacted with previously.

## API Endpoints

The Discovery System is supported by the following API endpoints:

- `GET /api/collaborations/search`: Retrieves collaborations based on filter criteria
  - Implemented in `server/routes.ts` with support for various filter parameters
  - By default, excludes collaborations created by the current user (configurable via the `excludeOwn` parameter)
  - Returns properly formatted JSON data for the discovery feed

- `GET /api/potential-matches`: Retrieves users who have swiped right on the current user's collaborations
  - Returns potential matches with user and collaboration data
  - Provides information about the original collaboration that was swiped on
  - These potential matches are displayed in the discovery feed alongside regular collaborations
  
- `POST /api/swipes`: Records user swipe actions (left/right) on collaborations or potential matches
  - For regular collaborations: Accepts collaboration_id and direction (left/right) parameters
  - For potential matches: Accepts swipe_id, direction, and is_potential_match flag
  - Validates both user and collaboration existence
  - Permanently stores swipe data for future matching and analytics

## API Implementation Notes

The API implementation has the following characteristics:

1. **Error Handling**: Proper error handling with meaningful error messages
2. **Filtering**: Backend filtering based on user preferences (when enabled)
3. **Performance**: Optimized database queries to minimize response time
4. **Debugging**: Enhanced logging to troubleshoot any issues
5. **Visibility Control**: Fine-grained control over which collaborations are visible to which users

Recent fixes include:
- Fixed critical issue where previously swiped collaborations would reappear when refreshing the Discovery page
- Implemented a combined filtering approach that excludes both the user's own collaborations and previously swiped ones
- Added unified empty state UI that appears consistently when either no collaborations match or user has viewed all available cards
- Enhanced empty state UI with "Refresh" and "Adjust Filters" buttons to provide clear actions to users
- Improved logging throughout the filtering process for better debugging capabilities

## Debugging

For debugging purposes, comprehensive logs are added at various points in the collaboration filtering process:

```typescript
// Examples of enhanced debug logging in searchCollaborations method
console.log(`Found ${userSwipes.length} swipes by user ${userId}`);
console.log(`Found ${userCollaborations.length} collaborations created by user ${userId}`);
console.log(`Total IDs to exclude: ${excludeIds.length} (${userCollaborationIds.length} own + ${swipedCollaborationIds.length} swiped)`);
console.log(`Excluding ${excludeIds.length} total collaborations from results`);
```

The updated filtering logic includes detailed logging about exclusions:

```typescript
// If we have IDs to exclude, use the combined filter
if (excludeIds.length > 0) {
  console.log(`Excluding ${excludeIds.length} total collaborations from results`);
  query = query.where(not(inArray(collaborations.id, excludeIds)));
} else {
  // Fallback if no IDs to exclude but we still want to exclude own collaborations
  if (filters.excludeOwn === undefined || filters.excludeOwn === true) {
    console.log('No specific IDs to exclude, using fallback creator_id filtering');
    query = query.where(not(eq(collaborations.creator_id, userId)));
  }
}
```

The swipe recording endpoint also includes detailed logging for tracking user interactions:

```typescript
console.log(`Creating swipe record with parameters: ${JSON.stringify(swipeData)}`);
console.log(`Success: Created swipe record with ID: ${newSwipe.id}`);
console.log(`Details: ${direction} swipe for collaboration ${collaboration_id} by user ${userId}`);
```

The client-side implementation in `DiscoverPage.tsx` also includes error logging to help diagnose any issues with the API integration.

## User Interface

The Discovery interface is implemented in `client/src/pages/DiscoverPage.tsx` and uses the following components:

- `Stack`: Container component that manages the stack of cards
- `SwipeableCard`: Individual card component with swipe gestures
- `CollaborationDialog`: Modal component for displaying collaboration details
- `MatchNotification`: Component that displays when a match is found
- `EmptyState`: Component displayed when no cards are available, with action buttons

### Card Types

The Discovery feed displays two types of cards:

1. **Regular Collaboration Cards**: Standard cards that represent collaboration opportunities created by other users.
   - Displayed with styling based on the collaboration type (podcast, twitter spaces, etc.)
   - Includes collaboration details, company information, and goals
   
2. **Potential Match Cards**: Special cards that represent users who have already swiped right on your collaborations.
   - Displayed with a distinctive blue gradient background and border
   - Features a "Potential Match" badge with a UserCheck icon
   - Shows the user's name, company, and job title
   - Indicates the collaboration type they're interested in
   - Includes clear instructions for the user to swipe right to connect or left to pass

### Empty States

The EmptyState component appears in two scenarios:
1. When no collaborations match the user's filter criteria
2. When the user has viewed all available collaborations (swiped on everything)

In both cases, the same consistent empty state UI is shown with two action buttons:
- "Refresh" - Attempts to reload collaborations from the server
- "Adjust Filters" - Takes the user to the filters page to modify their search criteria

### Client-Side Implementation

The client-side implementation in DiscoverPage.tsx has the following key features:

1. **Dual API Integration**: 
   - Uses React Query to fetch collaborations from the `/api/collaborations/search` endpoint
   - Makes parallel API call to fetch potential matches from the `/api/potential-matches` endpoint
   - Combines both data sources into a single card stack for unified display

2. **State Management**: 
   - Manages the state of cards, swipe history, and user interactions
   - Tracks card type (regular collaboration vs. potential match) for appropriate rendering and actions

3. **Error Handling**: 
   - Displays appropriate error messages when API requests fail
   - Handles partial data failures gracefully (e.g., if only one API endpoint succeeds)

4. **Match Notification**: 
   - Shows match notification when a user swipes right on a potential match
   - Handles regular collaboration matches through random probability (until database integration)

5. **Responsive Design**: 
   - Adapts to different screen sizes and orientations
   - Maintains consistent card interface for both card types

The implementation uses the standard React Query configuration pattern which provides better error handling and caching capabilities.

## Customization Options

Users can customize their discovery experience through:

1. **Filter Settings**: Available in the Discovery Filters page
2. **Collaboration Preferences**: Set during onboarding and adjustable later
3. **Per-session Filters**: Applied during the current discovery session only

## Bidirectional Matching System

The Collab Room implements a bidirectional matching system similar to dating apps, where a match is only created when both parties express interest. The key components of this system are:

1. **User-Initiated Swipes**: Users swipe right on collaborations they're interested in
2. **Potential Match Exposure**: These swipes appear as "potential matches" in the collaboration creator's discovery feed
3. **Completion of Match**: When the collaboration creator swipes right on a potential match, a mutual connection is established
4. **Match Notification**: Both parties are notified of the successful match through the Telegram bot

This implementation ensures that matches are created only with mutual consent, increasing the quality of connections.

### Match Creation and Notification Process

The complete match creation flow involves several components working together:

1. **Swipe Recording**: When a user swipes right on a collaboration, a record is created in the `swipes` table with the user ID, collaboration ID, and direction ('right').

2. **Match Detection**: The `checkForMatch` method in `server/storage.ts` is triggered after each swipe is recorded:
   - For each right swipe, the system checks if the other party has also swiped right
   - If both parties have swiped right, a new match record is created in the `matches` table
   - The match record includes `collaboration_id`, `host_id` (collaboration creator), and `requester_id` (the user who swiped right)

3. **Notification Creation**: When a match is created, two notification records are created in the `collab_notifications` table:
   - One for the host (collaboration creator)
   - One for the requester (the user who initially expressed interest)

4. **Telegram Notifications**: The system sends real-time notifications to both users via the Telegram bot:
   - Host receives: "{Requester Name} matched with your {Collaboration Type} collaboration!"
   - Requester receives: "You matched with {Host Name}'s {Collaboration Type} collaboration!"

The database structure supporting this flow includes:
- `swipes` table: Records user swipe actions on collaborations
- `matches` table: Records confirmed mutual matches between users
- `collab_notifications` table: Stores notifications about matches and other events

## Future Enhancements

Planned enhancements to the Discovery System include:

1. **Machine learning based recommendations**: Using AI to suggest potentially beneficial collaborations based on user history and preferences
2. **Enhanced matching algorithms**: Refining the matching system to consider factors like previous successful collaborations and user feedback
3. **Improved filtering options**: Adding more granular controls for discovering specific types of collaboration opportunities
4. **Personalized discovery feeds**: Creating custom feeds based on user activity, preferences, and network connections