# Swipe Filtering System

The Collab Room uses a robust two-tier filtering system to ensure users never see the same collaboration card twice. This document explains how the swipe filtering system works, its components, and the safeguards in place.

## Overview

The swipe filtering system prevents previously swiped collaborations from reappearing in the discovery feed. It uses a combination of:

1. Database-level filtering (primary filter)
2. In-memory filtering (secondary safety filter)
3. Client-side caching of excluded IDs

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

## Secondary Safety Filter

To ensure 100% reliability, a secondary in-memory filter is applied to the results:

```typescript
// In server/storage.ts
export async function searchCollaborationsPaginated(/* params */) {
  // Database filtering (as above)
  // ...

  // Secondary in-memory filtering
  const filteredResults = results.filter(
    collab => !allExcludedIds.includes(collab.id)
  );
  
  // Log warning if any collaborations should have been excluded but weren't
  const shouldHaveBeenExcluded = results.filter(
    collab => allExcludedIds.includes(collab.id)
  );
  
  if (shouldHaveBeenExcluded.length > 0) {
    console.warn(
      `WARNING: Found and removed ${shouldHaveBeenExcluded.length} collaborations that should have been excluded!`
    );
    console.warn(
      `IDs that were supposed to be excluded but appeared in results: ${JSON.stringify(
        shouldHaveBeenExcluded.map(collab => collab.id)
      )}`
    );
  }
  
  return {
    items: filteredResults,
    hasMore: /* pagination calculation */,
  };
}
```

## Client-Side Exclusion Management

The frontend maintains a list of excluded IDs in memory and sends this list with each search request:

```typescript
// In DiscoverPageNew.tsx
const [excludedIds, setExcludedIds] = useState<string[]>([]);

// When swiping on a card
const handleSwipe = async (direction: "left" | "right", collaboration: Collaboration) => {
  // Record the swipe via API
  await apiRequest("/api/swipes", "POST", {
    collaboration_id: collaboration.id,
    direction,
  });
  
  // Add the ID to the excluded list locally
  setExcludedIds(prev => [...prev, collaboration.id]);
};

// When fetching collaborations
const fetchCollaborations = async () => {
  const result = await apiRequest(
    "/api/collaborations/search",
    "POST",
    { excludeIds: excludedIds },
    { limit: "10" }
  );
  
  // Process the result
  // ...
};
```

## Authentication Integration

The swipe history tracking system is tightly integrated with the authentication system. The robust authentication with fallback mechanisms ensures that even if a user's session changes, their swipe history remains intact:

1. Server tracks swipes based on the user's ID in the database
2. Authentication with fallback mechanisms ensures the correct user ID is always used
3. This makes the server the "single source of truth" for swipe history

## Advantages of the Dual-Filter Approach

1. **Reliability**: Even if the database filter fails for some reason, the in-memory filter catches any missed exclusions
2. **Debugging**: The system logs detailed information about any filtering inconsistencies
3. **Transparency**: Clear logs make it easy to identify and diagnose issues
4. **Performance**: The primary database filter optimizes performance by limiting the result set early in the query

## Implementation Details

This system was implemented in version 1.4.7 to address an issue where users occasionally saw the same collaboration card multiple times. The root causes identified were:

1. Session changes sometimes causing user identity inconsistencies
2. IN clause limitations in some database queries
3. Edge cases in the filtering logic

By implementing the dual-filter system along with improved authentication, these issues have been fully resolved.