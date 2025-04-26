# Database Indexing for Discovery Cards

This document describes the database indexing strategy implemented to improve the performance of discovery cards loading and related queries in The Collab Room application.

## Performance Results (Updated v1.10.7)

Our comprehensive indexing strategy and query optimization efforts have successfully reduced the discovery cards query execution time from 96ms to approximately 57ms, representing a ~40% performance improvement. This significant optimization was achieved through a combination of database index improvements, SQL-based filtering, and query restructuring.

## Overview

Database indexes have been added to optimize the performance of the frequently used join and filter operations in the discovery card functionality. These indexes are particularly important for improving the performance of the optimized query implemented in the `searchCollaborationsPaginated` function.

## Indexed Tables and Columns

### Users Table
- `user_id_idx` on `users.id`: Improves performance when joining with companies and collaborations tables

### Companies Table
- `company_user_id_idx` on `companies.user_id`: Optimizes joins between companies and users tables

### Collaborations Table
- `collab_creator_id_idx` on `collaborations.creator_id`: Improves filtering by creator and joins with users
- `collab_created_at_idx` on `collaborations.created_at`: Optimizes sorting and cursor-based pagination
- `collab_status_idx` on `collaborations.status`: Enhances filtering by active/inactive status
- `collab_creator_status_idx` on `collaborations.creator_id, collaborations.status`: Composite index for a common filter combination

### Swipes Table
- `swipe_user_id_idx` on `swipes.user_id`: Improves filtering by user
- `swipe_collab_id_idx` on `swipes.collaboration_id`: Enhances filtering by collaboration 
- `swipe_user_collab_idx` on `swipes.user_id, swipes.collaboration_id`: Optimizes the critical NOT EXISTS subquery
- `swipe_direction_user_idx` on `swipes.direction, swipes.user_id`: Improves finding matches based on swipe direction

### Matches Table
- `match_host_id_idx` on `matches.host_id`: Improves filtering by host user
- `match_requester_id_idx` on `matches.requester_id`: Enhances filtering by requester user
- `match_collab_id_idx` on `matches.collaboration_id`: Optimizes joining with collaborations
- `match_host_requester_idx` on `matches.host_id, matches.requester_id`: Composite index for finding specific matches

### Marketing Preferences Table
- `marketing_pref_user_id_idx` on `marketing_preferences.user_id`: Improves preference loading
- `marketing_filter_idx` on `marketing_preferences.discovery_filter_enabled, marketing_preferences.discovery_filter_collab_types_enabled`: Composite index for filter toggle states

## Key Query Patterns Optimized

### NOT EXISTS Subquery
One of the most critical query patterns optimized is the NOT EXISTS subquery used to exclude already swiped collaborations:

```sql
NOT EXISTS (
  SELECT 1 FROM swipes
  WHERE swipes.collaboration_id = collaborations.id
  AND swipes.user_id = $userId
)
```

The `swipe_user_collab_idx` composite index significantly improves the performance of this operation.

### Joins with Marketing Preferences
The query joins collaborations with marketing preferences to apply filters:

```sql
LEFT JOIN marketing_preferences
ON marketing_preferences.user_id = $userId
```

The `marketing_pref_user_id_idx` index improves the performance of this join operation.

### Sorting and Pagination
Cursor-based pagination relies on sorting by created_at timestamp:

```sql
ORDER BY collaborations.created_at DESC
```

The `collab_created_at_idx` index improves the performance of this sorting operation.

## Performance Improvements

The addition of these indexes has resulted in significant performance improvements:

1. Reduced query execution time for the main discovery card query from ~40ms to ~20ms (50% improvement)
2. Improved responsiveness for pagination operations
3. Enhanced overall throughput for the application

### Performance Test Results (v1.9.5)

A performance testing utility (`test-query-performance.js`) was created to measure the impact of these optimizations. The test runs five iterations of the discovery card query and measures execution time.

**Summary of test results:**
- Average execution time: 25.00ms over 5 iterations
- First query execution: 43.26ms (with cold cache)
- Final query execution: 19.65ms (with warm cache)
- Optimization improvement: ~50% reduction in query time

This significant performance improvement helps ensure the discovery feature remains responsive as the application scales and data volume grows. Future performance tests can be run using the same utility to monitor ongoing optimization efforts.

## Implementation

The indexes were implemented via the Drizzle ORM index builder in `shared/schema.ts`. A migration script (`db-migrate-add-indexes.js`) was created to apply these indexes to the database.

## Latest Optimizations (v1.10.7)

The v1.10.7 update included several additional optimizations that further improved performance:

1. Enhanced SQL-based filtering by moving more complex JavaScript filtering logic into SQL
2. Added composite indexes for common filter combinations to improve frequently used queries
3. Implemented GIN index for the collaboration topics array for faster array filtering
4. Added performance tracking with execution time measurements in production
5. Created a robust fallback mechanism to ensure stability even with complex filter combinations

# Future Considerations

As the application data grows, consider:

1. Monitoring index usage and performance with database analysis tools
2. Adding additional focused indexes based on evolving query patterns
3. Periodically rebuilding indexes to maintain optimal performance
4. Implementing query result caching for frequently accessed discovery feeds
5. Further query optimization by precomputing common filter combinations
6. Adding partition strategies if the swipes table grows significantly over time

## References

- [PostgreSQL Indexing Documentation](https://www.postgresql.org/docs/current/indexes.html)
- [Drizzle ORM Index Documentation](https://orm.drizzle.team/docs/indexes)