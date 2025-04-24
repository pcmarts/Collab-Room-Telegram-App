# Front-End Data Loading Optimization

## Problem Statement

The current DiscoverPageNew.tsx component makes multiple separate API calls during page load:
- GET /api/user-swipes
- GET /api/potential-matches
- POST /api/collaborations/search

This results in:
- Multiple network roundtrips
- Sequential loading (waterfall pattern)
- Increased total page load time
- More complex front-end state management

## Solution

We've implemented a unified API endpoint that combines these three data sources into a single request:

```
POST /api/discovery/unified
```

### Endpoint Details

**Request:**
- Method: POST
- Query Parameters: Same as the existing collaboration search endpoint
- Body: Same as the existing collaboration search endpoint (excludeIds, etc.)

**Response:**
```json
{
  "userSwipes": [ ... ],
  "potentialMatches": [ ... ],
  "collaborations": {
    "items": [ ... ],
    "hasMore": true,
    "nextCursor": "..."
  }
}
```

### Implementation

The unified endpoint performs the following operations:
1. Authenticates the user via Telegram ID
2. Runs three database queries in parallel using Promise.all:
   - User swipes
   - Potential matches
   - Filtered collaborations
3. Returns all data in a single JSON response

### Performance Benefits

- **Reduced Network Overhead**: Only one HTTP request instead of three
- **Parallel Query Execution**: All three database queries run simultaneously
- **Simplified Front-End Code**: Single request/response pattern instead of multiple state variables and useQuery hooks
- **Improved Loading Time**: Single network roundtrip and parallel database queries reduce total page load time

### Front-End Implementation Guidelines

To use this unified endpoint in the DiscoverPageNew.tsx component:

1. Replace the three separate useQuery hooks with a single one:

```tsx
const { data: discoveryData, isLoading } = useQuery({
  queryKey: ['/api/discovery/unified', filters],
  queryFn: async () => {
    const params = new URLSearchParams();
    // Add filter parameters to params...
    
    return apiRequest(`/api/discovery/unified?${params.toString()}`, 'POST', {
      excludeIds: swipedCardIds
    });
  },
  staleTime: Infinity,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchInterval: false,
  retry: false
});

// Destructure the response data
const userSwipes = discoveryData?.userSwipes || [];
const potentialMatches = discoveryData?.potentialMatches || [];
const collaborations = discoveryData?.collaborations?.items || [];
const hasMore = discoveryData?.collaborations?.hasMore || false;
const nextCursor = discoveryData?.collaborations?.nextCursor;
```

2. Update the fetchNextBatch function to use the unified endpoint for subsequent page loads.

## Implementation Code

To add the unified endpoint to the application:

1. Add the following route in server/routes.ts:

```javascript
app.post("/api/discovery/unified", async (req: TelegramRequest, res: Response) => {
  try {
    console.log('============ DEBUG: Unified Discovery Data Endpoint ============');
    
    // Get Telegram user from request
    const telegramUser = getTelegramUserFromRequest(req);
    if (!telegramUser) {
      console.error('No Telegram user ID found in request');
      return res.status(401).json({ error: 'Unauthorized - No Telegram user ID' });
    }
    
    // Find the database user by Telegram ID
    const user = await storage.getUserByTelegramId(telegramUser.id.toString());
    if (!user) {
      console.error(`No database user found for Telegram ID: ${telegramUser.id}`);
      return res.status(401).json({ error: 'Unauthorized - User not found' });
    }
    
    // Parse filters from query parameters
    const filters = {
      collabTypes: req.query.collabTypes ? (req.query.collabTypes as string).split(',') : undefined,
      companyTags: req.query.companyTags ? (req.query.companyTags as string).split(',') : undefined,
      minCompanyFollowers: req.query.minCompanyFollowers as string,
      minUserFollowers: req.query.minUserFollowers as string,
      hasToken: req.query.hasToken === 'true',
      fundingStages: req.query.fundingStages ? (req.query.fundingStages as string).split(',') : undefined,
      blockchainNetworks: req.query.blockchainNetworks ? (req.query.blockchainNetworks as string).split(',') : undefined,
      excludeOwn: req.query.excludeOwn === 'true',
      cursor: req.query.cursor as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      excludeIds: req.body && req.body.excludeIds ? req.body.excludeIds : []
    };
    
    // Execute all database queries in parallel
    const startTime = Date.now();
    const [userSwipes, potentialMatches, collaborations] = await Promise.all([
      storage.getUserSwipes(user.id),
      storage.getPotentialMatchesForHost(user.id),
      storage.searchCollaborationsPaginated(user.id, filters)
    ]);
    
    const executionTime = Date.now() - startTime;
    console.log(`Unified discovery data fetched in ${executionTime}ms`);
    
    // Return combined data
    return res.json({
      userSwipes,
      potentialMatches,
      collaborations
    });
  } catch (error) {
    console.error('Error fetching unified discovery data:', error);
    return res.status(500).json({ error: 'Failed to fetch discovery data' });
  }
});
```

## Future Improvements

1. **Caching**: Implement response caching for the unified endpoint
2. **Rate Limiting**: Add rate limiting to prevent abuse
3. **Pagination for All Data Types**: Extend pagination to the swipes and potential matches
4. **Data Compression**: Implement response compression for reduced bandwidth