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
2. Exclude collaborations created by the current user
3. Previously, additional filtering was applied based on:
   - User preferences (collab types, company tags, followers count, etc.)
   - User's swipe history (already swiped collaborations)
   - Token status and funding stages
   - Blockchain networks
   
As of the latest update, only the first two rules are enforced to maximize the number of collaborations shown to users.

## API Endpoints

The Discovery System is supported by the following API endpoints:

- `GET /api/collaborations/search`: Retrieves collaborations based on filter criteria
- `GET /api/discovery-cards`: Retrieves cards for the discovery feed (filtering out user's own collaborations)

## Debugging

For debugging purposes, logs are added at various points in the collaboration filtering process:

```typescript
// Example debug logging in searchCollaborations method
console.log(`DEBUG: searchCollaborations: Retrieved ${collabs.length} active collaborations`);
console.log(`DEBUG: searchCollaborations: After excluding user's own, ${filteredCollabs.length} remain`);
```

## User Interface

The Discovery interface is implemented in `client/src/pages/DiscoverPage.tsx` and uses the following components:

- `Stack`: Container component that manages the stack of cards
- `SwipeableCard`: Individual card component with swipe gestures
- `CollaborationDialog`: Modal component for displaying collaboration details

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