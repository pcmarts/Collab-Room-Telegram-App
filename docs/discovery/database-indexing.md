# Database Indexing Strategy

## Overview
This document outlines the database indexing strategy implemented to improve the performance of discovery cards queries in the Collab Room application. Proper indexing is critical for ensuring efficient query execution, especially as the database grows in size.

## Problem Statement
The join queries in `searchCollaborationsPaginated` involve multiple tables and filtering conditions which can become slow without proper indexes, especially as the database scales. The following operations were identified as potential bottlenecks:

1. Joining across multiple tables (`collaborations`, `users`, `companies`, `marketing_preferences`)
2. Filtering by various conditions (collaboration status, creator, etc.)
3. Cursor-based pagination using the `created_at` timestamp
4. Exclusion of already swiped collaborations using `NOT EXISTS` subqueries

## Implemented Indexes

### Single-Column Indexes
These indexes improve lookup performance for individual columns used in WHERE clauses and join conditions:

1. **collaborations.creator_id**
   - Improves performance of joining collaborations with users
   - Accelerates filtering to exclude user's own collaborations

2. **collaborations.created_at (DESC)**
   - Optimizes sorting by recency (ORDER BY created_at DESC)
   - Improves cursor-based pagination performance

3. **collaborations.status**
   - Enhances filtering by active/inactive status
   - Common filter applied to all discovery queries

4. **users.telegram_id**
   - Speeds up user lookups by Telegram ID
   - Critical for authentication and user identification

5. **companies.user_id**
   - Accelerates joins between users and companies
   - Essential for retrieving company information for collaborations

6. **marketing_preferences.user_id**
   - Improves performance of left joins with marketing preferences
   - Essential for personalized discovery card filtering

### Compound Indexes
These indexes improve performance for queries that filter or sort by multiple columns simultaneously:

1. **swipes (user_id, collaboration_id)**
   - Optimizes the NOT EXISTS subquery that excludes already swiped collaborations
   - Significantly improves filtering performance by eliminating full table scans

2. **collaborations (status, created_at DESC)**
   - Accelerates the common query pattern of filtering by status and sorting by recency
   - Improves pagination performance

3. **collaborations (creator_id, status)**
   - Optimizes the combined filtering of excluding user's own collaborations and status filtering
   - Improves query performance for active collaborations not created by the current user

## Performance Impact

The addition of these indexes is expected to provide the following performance benefits:

1. **Reduced Query Execution Time**: 
   - Faster execution of join operations
   - More efficient filtering and sorting

2. **Improved Scalability**:
   - Better performance as the database grows in size
   - Prevents degradation of user experience with increased data volume

3. **Decreased Database Load**:
   - Reduced CPU and I/O utilization on the database server
   - Lower resource consumption during peak usage periods

4. **Enhanced User Experience**:
   - Faster loading of discovery cards
   - More responsive pagination and filtering

## Implementation Details

The indexes were added using a dedicated migration script (`db-migrate-add-indexes.js`) that creates each index with appropriate naming conventions:

```sql
-- Example of single-column index
CREATE INDEX IF NOT EXISTS idx_collaborations_creator_id 
ON collaborations (creator_id);

-- Example of compound index
CREATE INDEX IF NOT EXISTS idx_collaborations_status_created_at 
ON collaborations (status, created_at DESC);
```

## Maintenance Considerations

1. **Index Size**: 
   - Indexes increase database size
   - Regular monitoring of database size is recommended

2. **Write Performance**:
   - Indexes slightly impact INSERT/UPDATE operations
   - The performance trade-off heavily favors read operations in this discovery feature

3. **Index Analysis**:
   - Periodic review of index usage statistics is recommended
   - Unused indexes should be considered for removal

## Future Optimization Opportunities

1. **Partial Indexes**:
   - Create partial indexes for specific common filter combinations
   - Example: Index only active collaborations to reduce index size

2. **Index Only Scans**:
   - Restructure queries to leverage index-only scans where possible
   - Include all required columns in indexes for frequently used queries

3. **BRIN Indexes**:
   - Consider BRIN indexes for timestamp columns as data grows
   - Especially useful for the created_at column used in pagination