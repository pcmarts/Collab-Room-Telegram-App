# Discovery Filter Logic Update

## Summary
This document outlines the changes made to the filter logic in the discovery feature of The Collab Room app.

## Previous Implementation
Previously, filters in the discovery feature used "OR" logic within categories. This meant that:

- If a user selected multiple collaboration types (e.g., "Blog Post" and "Podcast"), any collaboration that was either a blog post OR a podcast would match
- If a user selected multiple topics (e.g., "AI" and "Blockchain"), any collaboration that had either AI OR blockchain as a topic would match
- Similarly for company tags and blockchain networks, any collaboration that matched at least one of the selected criteria would appear in the results

## Updated Implementation
The filter logic has been changed to use "AND" logic within categories, making the filtering more specific and targeted. Now:

- If a user selects multiple topics (e.g., "AI" and "Blockchain"), only collaborations that have BOTH AI AND blockchain as topics will match
- If a user selects multiple company tags, only collaborations with companies that have ALL selected tags will match
- If a user selects multiple blockchain networks, only collaborations from companies that operate on ALL selected networks will match

## Technical Implementation
The change was implemented by replacing PostgreSQL's overlap operator (`&&`) with the contains operator (`@>`) in the filter queries. The contains operator checks if the left array contains all elements of the right array, effectively implementing AND logic.

### Code Modifications
The following SQL snippets in the `searchCollaborations` method were updated:

1. Topics Filter:
```sql
/* Old implementation - OR logic */
${collaborations.topics} && ${topicsPgArray}::text[]

/* New implementation - AND logic */
${collaborations.topics} @> ${topicsPgArray}::text[]
```

2. Company Tags/Sectors Filter:
```sql
/* Old implementation - OR logic */
${collaborations.company_tags} && ${tagsPgArray}::text[]

/* New implementation - AND logic */
${collaborations.company_tags} @> ${tagsPgArray}::text[]
```

3. Blockchain Networks Filter:
```sql
/* Old implementation - OR logic */
${collaborations.company_blockchain_networks} && ${networksPgArray}::text[]

/* New implementation - AND logic */
${collaborations.company_blockchain_networks} @> ${networksPgArray}::text[]
```

## User Impact
Users will notice more refined and precise search results when applying multiple filters within a category. This change allows users to find exactly what they're looking for, rather than receiving a broader set of potentially less relevant results.

For example:
- A user looking specifically for a blog post about AI can now filter by both "Blog Post" type AND "AI" topic to get only exact matches
- Previously, this might have returned any blog posts (regardless of topic) OR any AI-related collaborations (even if not blog posts)

## Note on Funding Stages
Funding stages continue to use a different filtering mechanism because they are singular values rather than arrays. A company can only be in one funding stage at a time, so the logic remains unchanged.