# Reset Left Swipes Feature

## Overview

The Reset Left Swipes feature enhances the user experience in the Discovery page by allowing users to see previously rejected collaborations (left-swiped cards) again. This is particularly useful when users have gone through all available cards and want to reconsider previously skipped opportunities.

## Implementation Details

### Frontend Implementation

The feature was implemented in the Discovery page UI with the following components:

1. **Conditional Filtering Logic**:
   - Added a marketing preferences query to detect when filters are active
   - Used `useMemo` to create a `hasActiveFilters` variable that checks all filter flags
   - Made the "Adjust Filters" button only appear when filters are actually set

2. **Reset Left Swipes Button**:
   - Added a new button in the "No more cards" empty state
   - Implemented a loading state to provide visual feedback during the reset process
   - Connected to the backend via a React Query mutation

3. **API Integration**:
   - Used React Query's `useMutation` hook to make the API call
   - Handled success and error states with toast notifications
   - Added proper state management for loading and error conditions

### Backend Implementation

1. **Database Storage Interface**:
   - Added `deleteLeftSwipes` method to the `IStorage` interface
   - Method returns the count of deleted swipes for user feedback
   - Designed to only delete left swipes while preserving right swipes

2. **Database Method Implementation**:
   - Used Drizzle ORM to perform a conditional delete operation
   - Added filtering by `user_id` and `direction='left'` to ensure only rejected cards are reset
   - Implemented error handling and detailed logging

3. **API Endpoint**:
   - Created a new `/api/reset-left-swipes` endpoint that authenticates the user
   - Returns the count of deleted swipes for client-side feedback
   - Added comprehensive error handling and debugging logs

## Benefits

1. **Improved User Experience**:
   - Users no longer reach a "dead end" when they've viewed all cards
   - Provides a clear way to continue using the app even after all cards are viewed
   - Offers more control over the discovery process

2. **Contextual UI**:
   - The "Adjust Filters" button only appears when relevant, reducing confusion
   - Provides clear visual feedback during the reset process
   - Includes success/error toast notifications for user awareness

3. **Technical Improvements**:
   - Clean separation of concerns between UI, state management, and API calls
   - Efficient database operations that preserve important right-swipe data
   - Comprehensive error handling and logging for troubleshooting

## Usage

When a user has viewed all available cards, they will see an empty state with two options:

1. "Reset Left Swipes" button - clicking this will restore all previously rejected cards
2. "Adjust Filters" button (only shown when filters are active) - allows users to modify their filters

Upon successful reset, the user will receive a toast notification indicating how many swipes were reset, and the Discovery page will automatically refresh to show the newly available cards.