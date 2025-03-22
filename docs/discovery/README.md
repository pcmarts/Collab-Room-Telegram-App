# Discovery System

The Discovery System is a core feature of The Collab Room that enables users to discover collaboration opportunities created by other users. This document provides a detailed explanation of how the system works.

## Overview

The Discovery System presents users with a feed of collaboration cards that they can swipe through, similar to popular dating apps. Each card represents a collaboration opportunity created by another user.

## Components

The Discovery System consists of the following key components:

1. **Discovery Feed**: Frontend component that displays collaboration cards to users
2. **Collaboration Filtering**: Backend logic that determines which collaborations to show
3. **User Preferences**: Settings that allow users to customize their discovery experience
4. **Swiping Mechanism**: Interface for users to accept or reject collaboration opportunities

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
  
- `POST /api/swipes`: Records user swipe actions (left/right) on collaborations
  - Accepts collaboration_id and direction (left/right) parameters
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

The EmptyState component appears in two scenarios:
1. When no collaborations match the user's filter criteria
2. When the user has viewed all available collaborations (swiped on everything)

In both cases, the same consistent empty state UI is shown with two action buttons:
- "Refresh" - Attempts to reload collaborations from the server
- "Adjust Filters" - Takes the user to the filters page to modify their search criteria

### Client-Side Implementation

The client-side implementation in DiscoverPage.tsx has the following key features:

1. **API Integration**: Uses React Query to fetch collaborations from the `/api/collaborations/search` endpoint
2. **State Management**: Manages the state of cards, swipe history, and user interactions
3. **Error Handling**: Displays appropriate error messages when API requests fail
4. **Loading States**: Shows loading indicators during data fetching
5. **Responsive Design**: Adapts to different screen sizes and orientations

The implementation was recently improved to use the standard React Query configuration pattern rather than a custom implementation, which provides better error handling and caching capabilities.

## Customization Options

Users can customize their discovery experience through:

1. **Filter Settings**: Available in the Discovery Filters page
2. **Collaboration Preferences**: Set during onboarding and adjustable later
3. **Per-session Filters**: Applied during the current discovery session only

## Future Enhancements

Planned enhancements to the Discovery System include:

1. Machine learning based recommendations
2. Enhanced matching algorithms based on user behavior
3. Improved filtering options with more granular controls
4. Personalized discovery feeds based on user activity