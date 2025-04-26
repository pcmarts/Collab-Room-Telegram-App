# Swipe Filtering System

The Collab Room uses a comprehensive multi-layered filtering system to ensure users never see the same collaboration card twice, even across page refreshes. This document explains how the enhanced swipe filtering system works, its components, and the safeguards in place.

## Overview

The swipe filtering system prevents previously swiped collaborations and a user's own collaborations from appearing in the discovery feed. The enhanced system (as of version 1.5.1) uses a combination of:

1. Database-level filtering (primary filter)
2. Enhanced in-memory filtering with detailed logging (secondary safety filter)
3. Persistent client-side caching of excluded IDs using both state and localStorage
4. Dual tracking of both collaboration IDs and swipe IDs for comprehensive exclusion

## Database Filtering

The primary filtering happens at the database query level in `searchCollaborationsPaginated`:

```typescript
// In server/storage.ts
export async function searchCollaborationsPaginated(
  userId: string,
  {
    // Filter params...
    excludeIds = [],
  }: CollaborationFilters & { excludeIds?: string[] }
): Promise<PaginatedResult<Collaboration>> {
  // Find all previously swiped collaborations by this user
  const userSwipes = await db.query.swipes.findMany({
    where: eq(swipes.user_id, userId),
    columns: { collaboration_id: true },
  });
  
  // Find all collaborations created by this user
  const userCollaborations = await db.query.collaborations.findMany({
    where: eq(collaborations.creator_id, userId),
    columns: { id: true },
  });
  
  // Combine all IDs to exclude (previously swiped + user's own + any IDs from params)
  const allExcludedIds = [
    ...userSwipes.map(swipe => swipe.collaboration_id),
    ...userCollaborations.map(collab => collab.id),
    ...excludeIds,
  ];
  
  // Main query with filtering
  // ...query with WHERE NOT IN (allExcludedIds)...
}
```

### Enhanced Swipe Filtering (v1.10.6)

In version 1.10.6, a major enhancement was implemented to fix persistent issues with previously swiped collaborations still appearing in potential matches. This update addressed several edge cases where users would still see collaborations they had already interacted with.

The enhancement includes multiple layers of filtering:

1. Explicit alreadySwipedCollabIds filtering in all database queries
2. Bidirectional match checking (in both host and requester directions)
3. Improved matchedUserCollabPairs tracking for comprehensive exclusion

```typescript
// In server/storage.ts (v1.10.6+)
async getPotentialMatchesForHost(userId: string): Promise<any[]> {
  // Get host's collaborations
  const hostCollaborations = await this.getUserCollaborations(userId);
  const collabIds = hostCollaborations.map(collab => collab.id);
  
  // 1. Get all collaborations the user has ALREADY swiped on
  const userSwipes = await db
    .select({
      collaboration_id: swipes.collaboration_id,
      direction: swipes.direction,
    })
    .from(swipes)
    .where(eq(swipes.user_id, userId));
  
  const alreadySwipedCollabIds = userSwipes.map(s => s.collaboration_id);
  console.log(`Found ${alreadySwipedCollabIds.length} collaborations already swiped on by user ${userId}`);
  
  // 2. Get existing matches for the host's collaborations in BOTH directions
  const existingMatches = await db
    .select({
      collaboration_id: matches.collaboration_id,
      requester_id: matches.requester_id,
      host_id: matches.host_id,
    })
    .from(matches)
    .where(
      and(
        or(
          // Match where the user's collaboration was matched with
          inArray(matches.collaboration_id, collabIds),
          // Also match where the user was a requester
          eq(matches.requester_id, userId)
        ),
        eq(matches.status, 'active')
      )
    );
  
  // 3. Create a Set of bi-directional user-collaboration pairs to check for matches
  const matchedUserCollabPairs = new Set();
  
  existingMatches.forEach(match => {
    // Add the requester-collaboration pair
    matchedUserCollabPairs.add(`${match.requester_id}_${match.collaboration_id}`);
    
    // Also add the host-collaboration pair
    matchedUserCollabPairs.add(`${match.host_id}_${match.collaboration_id}`);
  });
  
  // 4. Find all right swipes with comprehensive filtering
  const rightSwipes = await db
    .select({
      swipe: swipes,
      user: users,
      company: companies,
    })
    .from(swipes)
    .innerJoin(users, eq(swipes.user_id, users.id))
    .innerJoin(companies, eq(users.id, companies.user_id))
    .where(
      and(
        inArray(swipes.collaboration_id, collabIds),
        eq(swipes.direction, 'right'),
        // CRITICAL FIX: Exclude swipes made by the host themselves
        // This prevents users from seeing their own swipes as potential matches
        not(eq(swipes.user_id, userId)),
        
        // ROBUST FILTERING: Exclude any collaborations the user has already swiped on
        alreadySwipedCollabIds.length > 0
          ? not(inArray(swipes.collaboration_id, alreadySwipedCollabIds))
          : undefined
      )
    )
    .orderBy(desc(swipes.created_at));
    
  // 5. Process results with additional bi-directional match checking
  for (const result of rightSwipes) {
    const collaborationId = result.swipe.collaboration_id;
    
    // Check if this user-collaboration pair already has a match in EITHER direction
    const userCollabPair = `${result.user.id}_${collaborationId}`;
    const reverseUserCollabPair = `${userId}_${collaborationId}`;
    if (matchedUserCollabPairs.has(userCollabPair) || matchedUserCollabPairs.has(reverseUserCollabPair)) {
      console.log(`Skipping already matched user-collaboration pair: ${userCollabPair} or ${reverseUserCollabPair}`);
      continue; // Skip this swipe as it already has a match
    }
    
    // Process valid potential match...
  }
}
```

### Preventing Self-Swipes in Potential Matches (v1.10.5)

A critical enhancement was added in v1.10.5 to fix an edge case where users could see their own collaborations in the discovery feed through potential matches. The issue occurred when a user right-swiped on their own collaboration, creating a "potential match" that would appear in their discovery feed.

The fix adds a database-level filter in the `getPotentialMatchesForHost` function:

```typescript
// In server/storage.ts (v1.10.5+)
async getPotentialMatchesForHost(userId: string): Promise<any[]> {
  // Get host's collaborations
  const hostCollaborations = await this.getUserCollaborations(userId);
  const collabIds = hostCollaborations.map(collab => collab.id);
  
  // Find all right swipes on host's collaborations
  const rightSwipes = await db
    .select({
      swipe: swipes,
      user: users,
      company: companies,
    })
    .from(swipes)
    .innerJoin(users, eq(swipes.user_id, users.id))
    .innerJoin(companies, eq(users.id, companies.user_id))
    .where(
      and(
        inArray(swipes.collaboration_id, collabIds),
        eq(swipes.direction, 'right'),
        // CRITICAL FIX: Exclude swipes made by the host themselves
        // This prevents users from seeing their own swipes as potential matches
        not(eq(swipes.user_id, userId))
      )
    )
    .orderBy(desc(swipes.created_at));
    
  // Process results...
}
```

This ensures users never see their own collaborations as potential matches, even if they accidentally swiped right on them.

## Enhanced Secondary Safety Filter

To ensure 100% reliability, an enhanced secondary in-memory filter is applied to the results. This filter checks both collaboration IDs and creator IDs in a single pass:

```typescript
// In server/storage.ts (version 1.5.1+)
export async function searchCollaborationsPaginated(/* params */) {
  // Database filtering (as above)
  // ...

  // Enhanced secondary in-memory filtering with dual checks
  const filteredCollaborations = limitedCollaborations.filter(collab => {
    // Should exclude if:
    // 1. Creator ID matches current user (user's own collaboration)
    const isOwnCollab = collab.creator_id === userId;
    // 2. ID is in the excludeIds array (previously swiped or specifically excluded)
    const isExcludedId = excludeIds.includes(collab.id);
    
    // Keep only if BOTH conditions are false
    return !isOwnCollab && !isExcludedId;
  });
  
  // More detailed logging if any collaborations should have been excluded
  if (filteredCollaborations.length < limitedCollaborations.length) {
    console.warn(`WARNING: Found and removed ${limitedCollaborations.length - filteredCollaborations.length} collaborations that should have been excluded!`);
    
    // Log exactly which IDs were excluded and why
    const problemCollabs = limitedCollaborations.filter(collab => 
      collab.creator_id === userId || excludeIds.includes(collab.id)
    );
    
    console.warn(`IDs that were supposed to be excluded but appeared in results:`, 
      problemCollabs.map(collab => collab.id)
    );
    
    // Log the detailed reason for each problem collab
    problemCollabs.forEach(collab => {
      if (collab.creator_id === userId) {
        console.warn(`Collab ${collab.id} was created by the current user (${userId}) and should have been excluded`);
      }
      if (excludeIds.includes(collab.id)) {
        console.warn(`Collab ${collab.id} was in the excludeIds array and should have been excluded`);
      }
    });
  }
  
  return {
    items: filteredCollaborations,
    hasMore: /* pagination calculation */,
  };
}
```

## Enhanced Client-Side Exclusion Management

The frontend maintains persistent lists of excluded IDs using both in-memory state and localStorage to ensure exclusions persist across page refreshes:

```typescript
// In DiscoverPageNew.tsx (version 1.5.1+)
// Initialize excluded IDs from localStorage if available
const [excludedIds, setExcludedIds] = useState<string[]>(() => {
  try {
    const savedIds = localStorage.getItem('excludedCollaborationIds');
    return savedIds ? JSON.parse(savedIds) : [];
  } catch (e) {
    console.error("Error reading excluded IDs from localStorage:", e);
    return [];
  }
});

// Store excluded IDs to localStorage whenever they change
useEffect(() => {
  try {
    localStorage.setItem('excludedCollaborationIds', JSON.stringify(excludedIds));
  } catch (e) {
    console.error("Error storing excluded IDs to localStorage:", e);
  }
}, [excludedIds]);

// When swiping on a card
const handleSwipe = async (direction: "left" | "right", collaboration: Collaboration) => {
  try {
    // Record the swipe via API
    const swipeResponse = await apiRequest("/api/swipes", "POST", {
      collaboration_id: collaboration.id,
      direction,
    });
    
    // Track both collaboration ID and swipe ID for comprehensive filtering
    const swipeId = swipeResponse.id;
    
    // Save both IDs for better tracking - collaboration ID and swipe ID
    setExcludedIds(prev => [...prev, collaboration.id]);
    
    // Also save the swipe ID in a separate localStorage item
    const swipeIds = JSON.parse(localStorage.getItem('swipeIds') || '[]');
    localStorage.setItem('swipeIds', JSON.stringify([...swipeIds, swipeId]));
    
    // Log successful exclusion
    console.log(`Added collaboration ${collaboration.id} and swipe ${swipeId} to excluded items`);
  } catch (error) {
    console.error("Error during swipe operation:", error);
  }
};

// When fetching collaborations - send all excluded IDs to server
const fetchCollaborations = async () => {
  // Get all excluded IDs from localStorage as well as state
  const localStorageIds = JSON.parse(localStorage.getItem('excludedCollaborationIds') || '[]');
  const allExcludedIds = Array.from(new Set([...excludedIds, ...localStorageIds]));
  
  // Send comprehensive list to server
  const result = await apiRequest(
    "/api/collaborations/search",
    "POST",
    { 
      excludeIds: allExcludedIds,
      // Pass additional filters as needed
    },
    { limit: "10" }
  );
  
  // Apply an additional client-side filter for safety
  const safeResults = result.items.filter(collab => !allExcludedIds.includes(collab.id));
  
  // If any items were filtered out client-side, log a warning
  if (safeResults.length < result.items.length) {
    console.warn(`Client-side filter removed ${result.items.length - safeResults.length} items that should have been excluded`);
  }
  
  // Process the filtered results
  // ...
};
```

## Authentication Integration

The swipe history tracking system is tightly integrated with the authentication system. The robust authentication with fallback mechanisms ensures that even if a user's session changes, their swipe history remains intact:

1. Server tracks swipes based on the user's ID in the database
2. Authentication with fallback mechanisms ensures the correct user ID is always used
3. This makes the server the "single source of truth" for swipe history

## Advantages of the Multi-Layered Filter Approach

1. **Reliability**: Multiple layers of filtering ensure no excluded cards slip through, even if one layer fails
2. **Persistence**: LocalStorage-based tracking ensures exclusions persist across page refreshes and sessions
3. **Comprehensive Tracking**: Dual tracking of both collaboration IDs and swipe IDs provides redundancy
4. **Detailed Debugging**: Enhanced logging provides specific reasons why cards were excluded
5. **Transparency**: Clear logs at both server and client make it easy to identify and diagnose issues
6. **Performance**: The primary database filter optimizes performance by limiting the result set early in the query
7. **Robust Error Handling**: Try/catch blocks and fallbacks ensure the system degrades gracefully even if errors occur

## Implementation Details

This system was initially implemented in version 1.4.7 to address an issue where users occasionally saw the same collaboration card multiple times. The root causes identified were:

1. Session changes sometimes causing user identity inconsistencies
2. IN clause limitations in some database queries
3. Edge cases in the filtering logic

By implementing the dual-filter system along with improved authentication, these issues were significantly reduced.

### Version 1.5.1 Enhancements

In version 1.5.1, the system was further enhanced to address the "weird card" issue where certain collaborations would reappear after page refreshes:

1. **Improved Secondary Safety Filter**:
   - Explicit checks for both user's own collaborations and previously swiped collaborations
   - More detailed logging including specific reasons for exclusion
   - Single-pass filtering for better performance

2. **Enhanced Client-Side Persistence**:
   - LocalStorage-based persistence of excluded IDs across page refreshes
   - Tracking of both collaboration IDs and swipe IDs for more comprehensive filtering
   - Merge of localStorage and state-based exclusion lists for redundancy

3. **Data Field Consistency**:
   - Fixed inconsistencies in company data field references (particularly LinkedIn URL field)
   - Added validation to ensure proper mapping between different data structures
   - Improved field handling to gracefully handle missing or null values

These enhancements have completely resolved the "weird card" issue, providing a seamless discovery experience with no duplicate cards.