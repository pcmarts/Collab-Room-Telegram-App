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
2. By default, exclude collaborations created by the current user (controlled by the `excludeOwn` parameter)
3. Apply additional filtering based on user preferences when enabled:
   - Collaboration types (collab types)
   - Company tags and sectors
   - Twitter followers count (both user and company)
   - Token status and funding stages
   - Blockchain networks
   
The `excludeOwn` parameter controls whether a user's own collaborations are included in the search results. For the Discovery page, we exclude own collaborations by default (when `excludeOwn` is `undefined` or `true`), showing only other users' collaborations. For other views like personal profiles, we can include own collaborations by setting `excludeOwn` to `false`.

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
- Fixed the `excludeOwn` parameter logic in the `searchCollaborations` method to properly handle undefined values
- Added detailed logging for the collaboration filtering process to aid debugging
- Improved error handling in the swipe recording endpoint with better validation and error messages

## Debugging

For debugging purposes, comprehensive logs are added at various points in the collaboration filtering process:

```typescript
// Examples of debug logging in searchCollaborations method
console.log('Excluding user\'s own collaborations from search results');
console.log(`Filtering by excluded topics: ${marketingPrefs.filtered_marketing_topics.join(', ')}`);
console.log(`Converting to PostgreSQL array format: ${pgArrayStr}`);
```

The swipe recording endpoint also includes detailed logging:

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