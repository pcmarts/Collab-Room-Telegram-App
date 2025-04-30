# Discovery Cards Loading Speed Optimization

This document outlines optimization strategies to improve the loading speed of discovery cards in The Collab Room. The recommendations are ordered by their potential impact on performance.

## High-Impact Optimizations

### 1. Optimize Database Queries
**Current Issue:** The `searchCollaborationsPaginated` function makes multiple separate database queries that could be combined:
- One query to get user marketing preferences
- One query to get user swipes
- One query to get user collaborations
- One query to get cursor collaboration (for pagination)
- The main query with multiple joins

**Recommendations:**
- Combine the first three queries into a single transaction to reduce database roundtrips
- Use subqueries instead of separate queries for exclusion lists
- Consider query optimization:
```typescript
// Example: Combine swipes and collaborations into a single subquery for exclusion list
let query = db
  .select({
    collaboration: collaborations,
    company: companies,
    user: users
  })
  .from(collaborations)
  .innerJoin(users, eq(collaborations.creator_id, users.id))
  .innerJoin(companies, eq(users.id, companies.user_id))
  .where(
    and(
      eq(collaborations.status, 'active'),
      not(inArray(collaborations.id, 
        db.select({ id: swipes.collaboration_id })
          .from(swipes)
          .where(eq(swipes.user_id, userId))
          .union(
            db.select({ id: collaborations.id })
              .from(collaborations)
              .where(eq(collaborations.creator_id, userId))
          )
      )),
      not(eq(collaborations.creator_id, userId))
    )
  );
```

### 2. Implement Database Indexing
**Current Issue:** The join queries in `searchCollaborationsPaginated` may be slow without proper indexes, especially as the database grows.

**Recommendations:**
- Add indexes for the most used join columns and filter conditions:
  - `collaborations.creator_id`
  - `users.id`
  - `companies.user_id`
  - `collaborations.created_at` (used for ordering and pagination)
  - Add composite indexes for frequently filtered columns

### 3. Implement Data Caching Strategy
**Current Issue:** Every discovery page load requires multiple database queries, even when data may not have changed.

**Recommendations:**
- Implement Redis or in-memory caching for:
  - User marketing preferences (rarely change)
  - User's own collaborations list (changes infrequently)
  - User's swipe history (append-only)
  - Recent discovery card results (with short TTL)
- Add cache invalidation triggers when relevant data changes

## Medium-Impact Optimizations

### 4. Optimize Front-End Data Loading
**Current Issue:** The DiscoverPageNew.tsx makes multiple API calls during initialization that block rendering:
- Fetches user swipe history
- Fetches potential matches
- Makes POST request to /api/collaborations/search

**Recommendations:**
- Implement a single unified API endpoint that returns all necessary data in one request
- Use React Query's parallel queries for independent data (with lower priority for less critical data)
- Implement a staged loading approach:
```typescript
// Example: Staged loading with React Query
const { data: essentialData, isLoading: isEssentialLoading } = useQuery({
  queryKey: ['/api/discovery-essential'], // Endpoint that returns minimum data to show first card
  enabled: !authError
});

const { data: extendedData } = useQuery({
  queryKey: ['/api/discovery-extended'], // Additional card data loaded in background
  enabled: !isEssentialLoading && !authError,
});
```

### 5. Optimize Data Transfer Size
**Current Issue:** The collaboration and company data may include fields not needed for card display.

**Recommendations:**
- Implement field selection in API endpoints to only return necessary fields
- Compress API responses with gzip/brotli
- Trim payload of unnecessary nested objects and duplicate data
- Consider implementing GraphQL to allow front-end to specify exactly what fields it needs

### 6. Implement Virtualization for Card Rendering
**Current Issue:** All cards in the array are processed by React even though only the top few are visible.

**Recommendations:**
- Implement React windowing/virtualization to only render the visible cards
- Limit CardStack rendering to maximum 3 visible cards plus 1-2 preloaded cards
- Use React.memo and useMemo for card components to prevent unnecessary re-renders

## Lower-Impact Optimizations

### 7. Optimize Authentication Flow
**Current Issue:** Authentication timing issues can cause delays or failures in loading discovery cards.

**Recommendations:**
- Further optimize the Telegram authentication check (currently has a 300ms delay)
- Implement a stateful authentication token system to reduce auth overhead
- Cache auth tokens securely to eliminate re-authentication on page refresh

### 8. Implement Progressive Loading UI
**Current Issue:** Users experience a blank state or spinner during initial loading.

**Recommendations:**
- Implement skeleton loaders that match card dimensions for better perceived performance
- Add progressive image loading for company logos
- Show a partially populated card while remaining data loads

### 9. Optimize Multi-layered Filtering
**Current Issue:** The multiple layers of filtering (server, in-memory, client) may be redundant.

**Recommendations:**
- Consolidate filtering to primarily happen at the database level
- Replace client-side secondary filtering with a more efficient algorithm
- Consider Bloom filters for large exclusion lists to improve memory usage

### 10. Network and Infrastructure Optimizations
**Current Issue:** Network latency and infrastructure limitations can impact overall performance.

**Recommendations:**
- Implement HTTP/2 for multiplexed connections
- Add edge caching for static resources
- Monitor and optimize the PostgreSQL database performance
- Consider database read replicas for scaling query capacity

## Technical Implementation Plan

For immediate implementation, prioritize these tasks:

1. Optimize the `searchCollaborationsPaginated` database query by combining queries
2. Add proper database indexes for join conditions and filtering
3. Implement a basic Redis caching layer for user preferences and swipe history
4. Remove redundant API calls on the discovery page
5. Optimize the payload size of card data

These changes should provide significant performance improvements while requiring moderate effort and carrying minimal risk of disruption.

## Monitoring Success

To verify the effectiveness of these optimizations:

1. Implement performance metrics tracking:
   - Time to first card display
   - Total discovery page load time
   - API response time for card data
   - Database query execution time

2. Set up A/B testing to measure the impact of changes

3. Collect user feedback on perceived performance improvements

## Long-term Considerations

1. Consider transitioning to a more efficient database access layer or ORM
2. Explore event-driven architecture for real-time updates
3. Implement a background job system for expensive operations
4. Consider database sharding strategy if scale becomes an issue

These recommendations aim to balance immediate performance gains with sustainable long-term improvements to the discovery card loading experience.