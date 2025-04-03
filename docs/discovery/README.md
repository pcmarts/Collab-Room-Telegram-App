# Discovery System Documentation

This directory contains documentation for the discovery system used in the Collab Room application.

## Overview

The discovery system is responsible for helping users find relevant collaborations through a card-based interface with swipe functionality (similar to Tinder). The system includes advanced filtering, pagination, and swipe history tracking.

## Discovery Documentation

- [Swipe Filtering System](./swipe-filtering.md) - Detailed explanation of how the system prevents duplicate cards

## Key Features

1. **Card-Based Discovery Interface**:
   - Swipeable cards for easy collaboration discovery
   - "Right" swipe indicates interest, "Left" swipe indicates disinterest
   - Potential match cards shown first, followed by regular collaboration cards

2. **Cursor-Based Pagination**:
   - Efficient loading of cards in batches
   - Memory-efficient handling of large datasets
   - Cursor tracking to maintain position in the discovery feed

3. **Advanced Filtering**:
   - Filter by collaboration type
   - Filter by company attributes
   - Filter by blockchain network
   - Filter by funding stage
   - Combined OR/AND logic for intuitive filtering

4. **Swipe History Tracking**:
   - Server-side tracking of all swipes
   - Prevention of duplicate card displays
   - Integration with the authentication system for consistent user identity

## Implementation Details

### Card Types

Two distinct card types are displayed in the discovery interface:

1. **Potential Match Cards**:
   - Users who have already swiped right on your collaborations
   - Shown with priority at the beginning of the discovery feed
   - Right swipe creates an immediate match
   - Visual indicators to distinguish them from regular cards

2. **Regular Collaboration Cards**:
   - Collaborations posted by other users
   - Shown after potential match cards
   - Right swipe records interest and creates a match if mutual interest exists
   - Various specialized card layouts based on collaboration type

### Pagination Approach

The discovery system uses cursor-based pagination for efficient data loading:

1. Initial request fetches the first batch of cards
2. Subsequent requests include a cursor parameter indicating the position
3. Server returns a hasMore flag to indicate whether more cards are available
4. Client maintains the cursor state and manages loading of additional cards

### Discovery Logic

The `searchCollaborationsPaginated` function in `server/storage.ts` implements the core discovery logic:

1. Filters out previously swiped collaborations
2. Filters out the user's own collaborations
3. Applies any additional filters (collaboration type, company attributes, etc.)
4. Returns collaborations sorted by appropriate criteria
5. Includes a secondary safety filter to ensure no excluded cards appear

## Integration with Other Systems

The discovery system integrates with several other core features:

- **Authentication System**: Ensures consistent user identity for swipe history
- **Match System**: Creates matches when both users express interest
- **Notification System**: Sends notifications when matches are created

## Implementation History

- **Version 1.0.0**: Basic card discovery with local storage swipe tracking
- **Version 1.3.0**: Improved filtering system with OR/AND logic
- **Version 1.4.7**: Server-side swipe tracking with secondary safety filter

## Related Documentation

- [Authentication System](../auth/persistent-auth.md) - How authentication integrates with discovery
- [API Documentation](../api/README.md) - API endpoints related to discovery