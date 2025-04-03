# Potential Matches

## Overview

Potential matches are a special card type displayed in the discovery interface. They represent other users who have already expressed interest in your collaboration by swiping right on it.

## Visual Distinction

Potential match cards have a distinct visual appearance:

- Special "Potential Match" badge with sparkle icon
- Subtle animation/glow effect
- Enhanced gradient border
- Redesigned content layout highlighting the match opportunity
- Special "Match Now" button styling

## Filtering Mechanism

Potential matches use the same filtering approach as regular collaboration cards to ensure consistency:

1. **Server-side filtering:** The `/api/potential-matches` endpoint returns potential matches while excluding those the user has already interacted with:
   - Filters based on user_id and collaboration_id combinations
   - Also filters based on swipe_id to ensure comprehensive exclusion
   - Uses a Set data structure to efficiently track and filter swipe IDs

2. **Client-side filtering:** Additional filtering occurs in the client to ensure any recently swiped cards (that might not yet be reflected in server data) are also excluded:
   - Uses localStorage to track both card IDs and swipe IDs
   - Filters out potential matches using both match ID and swipe ID
   - Maintains a persistent record of already-seen cards across sessions

3. **Duplicate prevention:** The combination of server and client filtering ensures users never see potential matches they've already swiped on:
   - Double-layered protection against repeat cards
   - Console logging to track and debug any filtering issues
   - Enhanced filtering during swipe actions to immediately exclude cards

## Data Structure

Potential match cards include additional data about the potential match:

```typescript
interface PotentialMatchData {
  user_id: string;
  first_name: string;
  last_name?: string;
  company_name: string;
  job_title?: string;
  twitter_followers?: string;
  company_twitter_followers?: string;
  swipe_created_at?: string;
  collaboration_id: string;
  swipe_id: string;      // Unique ID of the swipe record (used for filtering)
}
```

## Special UX Handling

Swiping right on a potential match card creates an immediate match, triggering the match animation. This is different from regular collaboration cards where a right swipe only creates a potential match for the other user.