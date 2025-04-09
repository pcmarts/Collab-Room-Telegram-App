# Filter Logic Update Guide

## Overview
This guide explains how the filtering system has been updated to ensure all company and user-related filters query source data directly rather than using potentially outdated cached data in the collaborations table.

## Filter Field Mapping

| Filter Type | Previous Field | Updated Field | Notes |
|-------------|---------------|--------------|-------|
| **Company-Related Filters** |
| Blockchain Networks | `collaborations.company_blockchain_networks` | `companies.blockchain_networks` | Companies directly specify which blockchains they work with |
| Company Tags/Sectors | `collaborations.company_tags` | `companies.tags` | Company sectors are now queried from source |
| Twitter Followers | `collaborations.company_twitter_followers` | `companies.twitter_followers` | Follower ranges now pulled from company table |
| Funding Stages | `collaborations.funding_stage` | `companies.funding_stage` | Company funding stage pulled from source |
| Token Status | `collaborations.company_has_token` | `companies.has_token` | Token existence status from company table |
| **User-Related Filters** |
| User Followers | `collaborations.twitter_followers` | `users.twitter_followers` | Creator's actual follower count used |
| **Collaboration-Specific Filters** (unchanged) |
| Collaboration Types | `collaborations.collab_type` | `collaborations.collab_type` | No change - inherent to collaboration |
| Content Topics | `collaborations.topics` | `collaborations.topics` | No change - inherent to collaboration |

## Code Examples

### Before

```typescript
if (filters.blockchainNetworks && filters.blockchainNetworks.length > 0) {
  // Using duplicate/cached data in the collaborations table
  whereConditions.push(sql`${collaborations.company_blockchain_networks} && ${filters.blockchainNetworks}`);
}
```

### After

```typescript
if (filters.blockchainNetworks && filters.blockchainNetworks.length > 0) {
  // Directly querying from company table via JOIN
  whereConditions.push(sql`${companies.blockchain_networks} && ${filters.blockchainNetworks}`);
}
```

## Join Implementation

The key to this approach is using SQL joins to access data across tables:

```typescript
let query = db
  .select({
    collaboration: collaborations,
    company: companies,
    user: users
  })
  .from(collaborations)
  .innerJoin(
    users,
    eq(collaborations.creator_id, users.id)
  )
  .innerJoin(
    companies, 
    eq(users.id, companies.user_id)
  )
  .where(
    eq(collaborations.status, 'active')
  );
```

## Frontend Compatibility

The join-based approach maintains full compatibility with existing frontend code by:

1. Properly mapping the joined results back to the expected collaboration format
2. Preserving the pagination interface with `nextCursor` and `hasMore` fields
3. Using the same filter parameter names in the API interface

## Testing the Changes

To verify this fix:
1. Use the filter panel to select a blockchain network like "Polygon"
2. You'll now see collaborations from companies on Polygon, even if the collaboration itself doesn't have the network specified
3. The same applies to other company-related filters (tags, followers, funding stage, etc.)