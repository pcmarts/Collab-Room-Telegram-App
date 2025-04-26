# Discovery System Documentation

This directory contains documentation for the discovery system used in the Collab Room application.

## Overview

The discovery system is responsible for helping users find relevant collaborations through a card-based interface with swipe functionality (similar to Tinder). The system includes advanced filtering, pagination, and swipe history tracking.

## Discovery Documentation

- [Swipe Filtering System](./swipe-filtering.md) - Detailed explanation of how the system prevents duplicate cards
- [Swipe Count Diagnostics](./swipe-count-diagnostics.md) - Tools for investigating swipe count discrepancies
- [Potential Matches](./potential-matches.md) - Documentation for the potential matches feature
- [Authentication Timing Fix](./authentication-timing-fix.md) - Fix for blank discovery page on initial load
- [Twitter Engagement Display](./twitter-engagement-display.md) - Improved display of Twitter engagement types in collaboration details
- [UI Improvements](./ui-improvements.md) - Documentation of SwipeableCard button fixes and Discovery page UI enhancements
- [Reset Left Swipes](./reset-left-swipes.md) - Feature to allow users to see previously rejected collaborations again

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

## UI and Navigation

### UI Consistency

The discovery system maintains UI consistency across all states:

1. **Loading State**: 
   - Displays a spinning loader while maintaining the same layout structure as the active state
   - Preserves the header and overall page structure for a consistent experience
   - Avoids jarring layout shifts during state transitions

2. **Empty State**:
   - Shows a message when no cards are available while maintaining the same header and layout
   - Consistent styling with the rest of the application
   - Clear call-to-action when appropriate

3. **Active State**:
   - Full card display with consistent positioning and layout
   - Standardized card dimensions and spacing

### Navigation Integration

The discovery system integrates with the application's navigation system:

1. **Cross-Page Navigation**:
   - Seamless transitions between Discovery and Matches pages using Wouter
   - Client-side routing to prevent full page reloads when moving between related features
   - Preserves state when appropriate to maintain user context

2. **Data Consistency**:
   - Uses MatchContext to maintain consistent data across pages
   - Automatically updates related components when matches are created
   - Ensures a coherent experience when navigating between discovery and matches views

## Match Moments

When a match is created through the discovery system, a match moment dialog is displayed to inform the user and provide navigation options:

1. **Match Display**:
   - Shows collaboration type and company name
   - Displays the user's first name when available ("You've matched with [Name] from [Company]")
   - Uses animated entrance transitions for an engaging experience

2. **Navigation Options**:
   - "View My Matches" button with a MessageCircle (chat) icon for viewing all matches
   - "Continue Discovering" button with the discovery icon (LuCopy) for returning to discovery
   - Optional direct message button for immediate communication

3. **User Experience**:
   - Seamless integration with the discovery flow
   - Consistent visual design with the rest of the application
   - Clear call-to-action buttons with appropriate icons
   - Proper context preservation when navigating between pages

## Implementation History

- **Version 1.0.0**: Basic card discovery with local storage swipe tracking
- **Version 1.3.0**: Improved filtering system with OR/AND logic
- **Version 1.4.7**: Server-side swipe tracking with secondary safety filter
- **Version 1.5.2**: Enhanced match filtering to prevent duplicate matches
- **Version 1.5.3**: Improved UI consistency across all states and enhanced navigation
- **Version 1.6.1**: Enhanced match moment UI with improved button icons and user name display
- **Version 1.7.9**: Disabled automatic refresh mechanisms to prevent authentication loops
- **Version 1.8.2**: Fixed blank discovery page by improving initial authentication timing
- **Version 1.8.4**: Improved Twitter engagement types display in collaboration details with proper formatting
- **Version 1.8.8**: Enhanced SwipeableCard component with improved button functionality, updated Filter button to include text label, and modified bottom panel to only show Refresh button when no cards are available
- **Version 1.9.7**: Added detailed swipe count diagnostics to investigate discrepancies between swipe counts and available collaborations
- **Version 1.10.1**: Added Reset Left Swipes feature to allow users to see previously rejected collaborations again, and made the Adjust Filters button only appear when filters are actually active
- **Version 1.10.5**: Fixed critical issue where users could see their own collaborations in the discovery feed, improved server-side filtering to prevent self-swipes
- **Version 1.10.6**: Enhanced all database queries to properly exclude any previously swiped collaborations with bidirectional match checking across host and requester roles

## Related Documentation

- [Authentication System](../auth/persistent-auth.md) - How authentication integrates with discovery
- [API Documentation](../api/README.md) - API endpoints related to discovery