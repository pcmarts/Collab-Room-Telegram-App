# Filter Logic Update

## Overview

This document outlines the changes made to the discovery filter logic in the Collab Room platform. The update improves the way collaborations are filtered when users apply multiple filter criteria.

## Implementation History

### Initial Implementation
The original discovery filter system used inconsistent logic for different filter types, sometimes using the PostgreSQL `@>` (contains) operator and other times using the `&&` (overlap) operator.

### First Optimization (Version 1.3.3)
In this phase, we standardized the logic to:
- Use OR logic within each filter category
- Use AND logic between different filter categories
- Consistently use appropriate operators for the intended logic

### Latest Enhancement (Version 1.3.4)
The current implementation:
- Uses the PostgreSQL `&&` (overlap) operator consistently for all array-type filters
- Applies matching logic consistently across all filter categories
- Improves code organization and documentation

## Previous Behavior

In earlier implementations, when a user selected:
- Multiple items within the same filter category (e.g., multiple blockchain networks like Ethereum and Solana)
- Multiple filter categories (e.g., blockchain networks + content topics)

The results would sometimes use AND logic for array fields, requiring that items match ALL selected values instead of ANY. This inconsistency resulted in unpredictable behavior and fewer matches than expected.

## New Behavior

The new implementation uses:
1. **OR logic within each filter category**: Selecting multiple items within the same category (e.g., Ethereum and Solana) will return collaborations on either network.
2. **AND logic between different filter categories**: Selecting criteria across different categories (e.g., Ethereum + Content Topic: AI) will only return collaborations that match BOTH criteria.

### Example Scenarios

**Scenario 1: Multiple selections within a single filter category**
- User selects: Blockchain Networks = [Ethereum, Solana]
- Results: Shows collaborations that are on either Ethereum OR Solana

**Scenario 2: Selections across different filter categories**
- User selects: Blockchain Networks = [Ethereum] AND Content Topics = [AI]
- Results: Only shows collaborations that are both on Ethereum AND about AI

**Scenario 3: Multiple selections within multiple filter categories**
- User selects: Blockchain Networks = [Ethereum, Solana] AND Content Topics = [AI, DeFi]
- Results: Shows collaborations that are on (Ethereum OR Solana) AND about (AI OR DeFi)

## Technical Implementation

This behavior change was implemented by modifying the SQL queries in the `searchCollaborations` method in `server/storage.ts`:

1. For array-type filters (topics, company tags, blockchain networks):
   - We use the PostgreSQL `&&` (overlap) operator, which returns true if the arrays have any elements in common
   - This implements the OR logic within a category

2. For non-array fields with multiple selections (collaboration types, funding stages):
   - We use `inArray()` or `= ANY()` to implement the same OR logic
   - This ensures consistent filtering behavior across all filter categories

3. Between different filter categories:
   - We combine the filters with AND by chaining them in the query
   - Each filter is only applied if enabled by the user

### PostgreSQL Operators Used

- `&&` (overlap): Returns true if the arrays have at least one element in common (OR logic)
- `@>` (contains): Returns true if the left array contains all elements of the right array (AND logic)

The implementation now consistently uses the `&&` operator for array-type filters to implement OR logic within categories. We've standardized the approach across all filter types to ensure intuitive and consistent filtering behavior.

### Code Example

Here's an example of how the filter logic is implemented for blockchain networks:

```typescript
// IF blockchain networks filter is enabled AND networks are selected
if (
  filters.blockchainNetworks?.length &&
  filters.blockchainNetworks.length > 0
) {
  console.log('Applying blockchain networks filter with networks:', filters.blockchainNetworks);
  // Using && (overlap) operator to implement OR logic within blockchain networks
  query = query.where(sql`${collaborations.blockchain_networks} && ${filters.blockchainNetworks}`);
}
```

This ensures that if a collaboration is associated with any of the selected blockchain networks, it will be included in the results.

## Benefits

- More intuitive filtering logic for users
- More specific and relevant collaboration matches
- Better performance by reducing the number of irrelevant matches
- Enhanced discoverability by focusing on the most relevant collaborations
- Consistent behavior across all filter types
- Improved user experience with filtering interactions

## Interactive Filter UI Improvements

Along with the backend filter logic changes, we've also enhanced the user interface for filters:

1. **Automatic Toggle Behavior**: When a user expands a filter card (such as Blockchain Networks), the toggle for that filter category automatically turns on. This creates a more intuitive experience where expanding a section implies intent to use that filter.

2. **Smart Toggle States**: 
   - If a user collapses a filter card with no options selected, the toggle automatically turns off
   - If they collapse it with options selected, the toggle remains on
   - This prevents wasted database queries on empty filter selections

3. **Refresh on Return**: When users apply filters and return to the discovery feed, the content automatically refreshes to reflect their new filter settings

## Validation

The changes have been tested with various filter combinations to ensure:
1. A company active on multiple blockchains (e.g., Ethereum and Solana) will appear in results when the user selects just one of them
2. When combining filters across categories, only collaborations matching all selected categories are shown
3. The system still properly excludes the user's own collaborations