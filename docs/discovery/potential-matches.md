# Potential Matches

## Overview

Potential matches are a special card type displayed in the discovery interface. They represent other users who have already expressed interest in your collaboration by swiping right on it.

## Enhanced Visual Distinction

Potential match cards have a distinct visual appearance to clearly indicate their special status:

- Special rose-colored "Potential Match" badge with star icon
- Animated subtle glow effect with rose color that pulses gently
- Enhanced gradient border with rose/pink tones
- Redesigned content layout highlighting the match opportunity
- Rose-colored "Match" button with sparkle icon (replaces standard "Connect" button)
- Comprehensive company information display including:
  - Company name and short description
  - Full set of social media links (Twitter, LinkedIn, Website, etc.)
  - User's name who swiped right on your collaboration
  - Additional metadata relevant to the collaboration type

## Enhanced Filtering Mechanism

Potential matches use a comprehensive multi-layered filtering approach to ensure consistency and reliability (updated in version 1.10.5):

1. **Server-side primary filtering:** The `/api/potential-matches` endpoint returns potential matches while excluding those the user has already interacted with:
   - Filters based on user_id and collaboration_id combinations in the database query
   - Also filters based on swipe_id to ensure comprehensive exclusion
   - Uses a Set data structure to efficiently track and filter swipe IDs
   - **NEW in v1.5.2:** Checks the matches table to exclude collaborations that already have a match
   - **NEW in v1.10.5:** Excludes self-swipes (swipes made by the user on their own collaborations) by adding not(eq(swipes.user_id, userId)) filter to the database query

2. **Server-side secondary safety filter:** After the database query returns results, a secondary in-memory filter is applied:
   - Checks each result against the excluded IDs list and user's own collaborations
   - Provides detailed logging about any items that should have been excluded but weren't
   - Logs the specific reason for exclusion (user's own, previously swiped, already matched, etc.)
   - **NEW in v1.5.2:** Provides specific logging for matches that are excluded due to already existing in the matches table
   - **NEW in v1.10.5:** Improved logging of self-swipe exclusions for better debugging

3. **Enhanced client-side filtering:** Multiple layers of client-side filtering ensure any recently swiped cards are properly excluded:
   - Uses both React state and localStorage to track excluded IDs
   - Persists exclusions across page refreshes and navigation
   - Merges state-based and localStorage-based exclusion lists for redundancy
   - Performs additional safety filter before rendering cards

4. **Comprehensive duplicate prevention and validation:** The combination of server and client filtering with improved data field validation ensures users never see potential matches they've already swiped on or matched with:
   - Quadruple-layered protection against repeat cards
   - Enhanced console logging to track and debug any filtering issues
   - Immediate tracking of collaboration IDs, swipe IDs, and match IDs
   - Improved validation of card data to prevent incomplete or empty cards from displaying
   - **NEW in v1.5.3:** Strict validation of potential match data to prevent displaying cards with missing required fields
   - **NEW in v1.5.3:** Additional filtering layer to eliminate invalid potential matches in both refresh and initial load flows
   - **NEW in v1.5.2:** Completely eliminates duplicate matches by checking existing matches table before showing potential match cards

## Enhanced Data Structure

Potential match cards include comprehensive data about both the potential match and their company:

```typescript
// As of version 1.10.4
interface PotentialMatchData {
  // User information
  user_id: string;
  first_name: string;
  last_name?: string;
  
  // Company information
  company_name: string;
  company_description?: string;
  job_title?: string;  // Fixed in v1.10.4 - properly preserved through data flow
  
  // Social media and metrics
  twitter_handle?: string;
  twitter_followers?: number;
  company_twitter_followers?: number;
  
  // Company contact and links
  company_website?: string;
  linkedin_url?: string;    // Fixed in v1.5.1 - proper field reference
  company_telegram?: string;
  company_discord?: string;
  
  // Match tracking
  swipe_created_at?: string;
  collaboration_id: string;
  swipe_id: string;      // Unique ID of the swipe record (used for filtering)
  note?: string;         // Optional personalized note from the user
}
```

## Special UX Handling

Swiping right on a potential match card creates an immediate match, triggering the match animation. This is different from regular collaboration cards where a right swipe only creates a potential match for the other user.

## Match Creation and Notification

When a match is created (by swiping right on a potential match):

1. The client updates the global MatchContext state to indicate a new match was created
2. A visual "Match Moment" animation is displayed to the user
3. The Matches page (if visited) will automatically refresh its data to show the new match
4. Server-side Telegram notifications are sent to both users

The MatchContext provides a shared state mechanism that ensures consistent match data across different pages of the application, eliminating the need for manual refreshes when navigating to the Matches page.