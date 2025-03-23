# Changelog

All notable changes to the Collab Room project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Version 1.3.3] - 2025-03-23

### Changed
- Changed filter logic in discovery feed from OR to AND operators for more specific filtering
- Modified the PostgreSQL queries for topic, company tag, and blockchain network filters to use the contains operator (@>) instead of the overlap operator (&&)
- Updated documentation with a detailed explanation of the filter logic change and its implementation

### Technical Details
- Previously, when selecting multiple filters (e.g., multiple topics), any collaboration that matched ANY of the selected criteria would appear in results (OR logic)
- New implementation requires collaborations to match ALL selected criteria within a filter category (AND logic)
- This was achieved by replacing the PostgreSQL overlap operator (&&) with the contains operator (@>) in the filter queries
- Created detailed documentation in docs/discovery/filter-logic-update.md explaining the changes
- These changes make discovery results more specific and relevant for users

## [Version 1.3.2] - 2025-03-23

### Changed
- Consolidated multiple discovery filters implementations into a single, cleaner version.
- Simplified the discovery filters file structure by keeping only the main implementation.
- Updated routing in App.tsx to use the standardized discovery filters page.

### Removed
- Removed redundant discovery filter pages (`discovery-filters-new.tsx`, `discovery-filters-new.tsx.fixed`).
- Removed unnecessary filter page redirects and routes.

### Technical Details
- Previously, the application had 4 different discovery filter implementations, causing confusion and maintenance issues.
- The `discovery-filters-new-rebuild.tsx` file was identified as the main implementation and kept as `discovery-filters.tsx`.
- All references to old filter pages were updated in App.tsx to maintain consistent navigation.
- No functional changes were made to the filters themselves, maintaining the existing user experience.

## [Version 1.3.1] - 2025-03-23

### Removed
- Removed redundant `match_requests` table from the database that was not being used by the application.

### Technical Details
- The `match_requests` table was identified as redundant as it contained no data and had no code references.
- The table was safely dropped without affecting application functionality.
- All matching functionality is properly handled by the `matches` table, which tracks relationships between hosts and requesters.


## [Version 1.3.0] - 2025-03-23

### Fixed
- Fixed critical bug in the matching system where swipes weren't creating matches in the database.
- Resolved foreign key constraint violation in matches table by recreating it with correct references.
- Fixed Telegram notification system to properly send alerts when matches occur.

### Changed
- Improved logging throughout the matching process for better debugging.
- Enhanced match detection logic in storage.ts to correctly identify when both users swipe right.

### Technical Details
- The primary issue was a mismatch between the database schema and the code references:
  1. The database used "opportunity_id" referencing "collaboration_opportunities" while the code expected "collaboration_id" referencing "collaborations"
  2. This mismatch caused foreign key constraint violations when trying to create match records
- Fixed by:
  1. Creating a migration script (db-migrate-fix-matches.cjs) to drop and recreate the matches table with proper foreign key references
  2. Ensuring the swipes table already contained the necessary 'details' column
  3. Verifying the complete match creation flow from frontend swipe to backend processing and notification

## [Version 1.0.1] - 2025-03-23

### Changed
- Standardized all API requests to use the apiRequest function for consistent Telegram authentication headers
- Removed all development fallbacks and test user generation to enforce strict authentication

### Fixed
- Fixed "Error Loading Collaborations" issue in the /discover page by ensuring proper Telegram authentication
- Resolved authentication issues in /my-collaborations page by standardizing API request handling
- Removed DUMMY_CARDS array in DiscoverPage.tsx that was interfering with real API responses
- Fixed syntax errors in server/routes.ts by removing unexpected character sequences

## [Unreleased]

### Added
- Swipe functionality in the Discovery page with left/right swipe gestures
- Database storage for user swipe actions with appropriate foreign key constraints
- API endpoint for recording user swipes on collaborations
- Enhanced logging throughout the discovery and swipe process for better debugging
- Documentation structure with comprehensive sections for architecture, frontend, backend, database, API, Telegram integration, user flows, and discovery system
- Changelog to track all modifications to the application
- Implemented bidirectional matching system showing potential matches directly in discovery feed
- Added dedicated card UI for potential matches with UserCheck icon and distinctive styling
- Enhanced swipe handling to process both regular collaborations and potential matches
- Created reusable BaseCollabCard component as foundation for all card types
- Added specialized card components for each collaboration type (Podcast, Blog Post, Twitter Spaces, Live Stream, Research Report, Newsletter, Marketing)

### Fixed
- Fixed collaboration visibility in Discovery page where users could only see their own collaborations
- Corrected the logic for the `excludeOwn` parameter in the `searchCollaborations` method
- Fixed PostgreSQL array formatting for proper filtering by topics, blockchain networks, and funding stages
- Enhanced error handling in the swipe recording process with better validation and error messages
- Fixed issue where previously swiped collaborations would reappear when refreshing the Discovery page
- Fixed critical bug where user's own collaborations could appear in Discovery page after swiping on all other cards
- Identified why only certain collaborations (specifically research reports) were showing up in the discovery feed
- Added detailed debug logging to the `searchCollaborations` and `getDiscoveryCards` methods for better visibility
- Resolved duplicate route conflict for `/api/collaborations/search` endpoint that was causing API errors
- Updated client-side API fetch in DiscoverPage to use standard React Query configuration
- Improved error handling and debug logging in API requests
- Fixed inconsistent variable naming in server-side collaboration filtering

### Changed
- Updated documentation in docs/discovery/README.md to reflect recent changes
- Modified the default behavior to exclude a user's own collaborations from discovery by default
- Improved logging messages throughout the discovery and matching process
- Modified collaboration filtering logic in the discovery feed to only exclude collaborations created by the user themselves, removing all other filtering criteria
- Updated match notification system to show appropriate information for different match types
- Refactored card components into dedicated directory structure for better organization
- Extracted collaboration type icon functionality into a separate utility function for reusability

### Technical Details
- The primary issue was in the `searchCollaborations` method in `server/storage.ts` where the filtering logic didn't properly exclude some collaborations
- Two problems were identified:
  1. Previously swiped collaborations weren't being excluded from search results when refreshing the Discovery page
  2. In some edge cases, the user's own collaborations could incorrectly appear in the feed after swiping on all other cards
- These issues were fixed by:
  1. Combining both user's own collaborations and swiped collaborations into a single exclusion list
  2. Using the `not(inArray())` filter to ensure both sets of IDs are properly excluded in a single query
  3. Implementing a fallback mechanism for when the exclusion list is empty
- Added detailed logging of the filtering process to assist with debugging similar issues in the future

## [Version 1.0.0] - 2025-03-22

### Added
- Initial release of The Collab Room platform
- User authentication via Telegram
- Collaboration creation interface
- Discovery feed with swipeable cards
- Matching system for connecting users
- Company profile management
- Detailed filtering options for discovery
- Support for multiple blockchain networks
- Admin dashboard for user management