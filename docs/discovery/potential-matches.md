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

1. **Server-side filtering:** The `/api/potential-matches` endpoint returns potential matches while excluding those the user has already interacted with.

2. **Client-side filtering:** Additional filtering occurs in the client to ensure any recently swiped cards (that might not yet be reflected in server data) are also excluded:
   - Uses localStorage to track recently swiped card IDs
   - Filters out potential matches based on this local cache

3. **Duplicate prevention:** The combination of server and client filtering ensures users never see potential matches they've already swiped on.

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
}
```

## Special UX Handling

Swiping right on a potential match card creates an immediate match, triggering the match animation. This is different from regular collaboration cards where a right swipe only creates a potential match for the other user.