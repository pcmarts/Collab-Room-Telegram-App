# Discovery Cards Query Optimization

## Overview
This document outlines the optimization implemented to improve the loading speed of discovery cards in the Collab Room application. The primary focus was on reducing database roundtrips by combining multiple separate queries into a single, more efficient query.

## Problem Statement
The original implementation makes multiple separate database queries for each request to load discovery cards:
1. Get user's marketing preferences (1 query)
2. Get user's previous swipes to exclude already swiped collaborations (1 query)
3. Get user's own collaborations to exclude them (1 query)
4. Additional query for cursor-based pagination (1 query if cursor is provided)
5. Main query to fetch collaborations with filters (1 query)

This approach results in at least 3 separate database calls per request (and potentially 4+ with cursors), which increases latency and reduces performance.

## Solution
We've implemented an optimized version of the `searchCollaborationsPaginated` function that:

1. Uses a single database query with strategic joins to fetch all relevant data:
   - Left joins with marketing preferences to fetch preferences in the same query
   - Uses SQL `NOT EXISTS` subqueries to exclude already swiped collaborations instead of loading them separately
   - Directly excludes user's own collaborations using the creator_id field

2. Adds performance tracking to measure query execution time

3. Includes a fallback mechanism to use the legacy implementation if the optimized version encounters errors, ensuring backward compatibility and stability

## Implementation Details

### Key SQL Techniques Used
- SQL `NOT EXISTS` to exclude swiped collaborations:
  ```sql
  NOT EXISTS (
    SELECT 1 FROM swipes
    WHERE swipes.collaboration_id = collaborations.id
    AND swipes.user_id = $userId
  )
  ```

- Left joining with marketing preferences to load them alongside collaborations:
  ```sql
  LEFT JOIN marketing_preferences
  ON marketing_preferences.user_id = $userId
  ```

### Performance Improvements
- Reduces number of database roundtrips from 3-5 to just 1-2
- Eliminates the need to load and process all user swipes and user collaborations separately
- Optimizes cursor-based pagination by only fetching the timestamp of the cursor collaboration if needed

### Fallback Mechanism
If the optimized implementation encounters any errors, it automatically falls back to the legacy implementation:
```javascript
try {
  // Optimized implementation
} catch (error) {
  console.error('Error in optimized searchCollaborationsPaginated:', error);
  console.log('Falling back to legacy implementation');
  return this.searchCollaborationsPaginatedLegacy(userId, filters);
}
```

## Future Optimization Opportunities
1. Move more of the JavaScript-based filtering to SQL WHERE clauses for further performance gains
2. Implement selective loading of related data based on what's actually needed by the client
3. Add query result caching for frequently accessed cards
4. Implement database indexing strategy specifically optimized for the discovery cards query pattern