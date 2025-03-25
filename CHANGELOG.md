# Changelog

All notable changes to the Collab Room project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Version 1.3.9] - 2025-03-25

### Changed
- Simplified notification handling by removing frequency selection dropdown
- Set all notification settings to use "Instant" as the default and only frequency option
- Improved error handling in notification toggle functionality

### Fixed
- Fixed "response.json is not a function" error that occurred when toggling collaborations
- Resolved error handling in notification settings to avoid double-processing API responses

### Technical Details
- Modified the Dashboard component to hide the notification frequency dropdown
- Simplified API response handling in apiRequest function to prevent double parsing JSON
- Updated notification toggle UI to only show "Instant" label when notifications are enabled
- Improved error handling throughout dashboard.tsx to properly catch and display errors

## [Version 1.3.8] - 2025-03-23

### Changed
- Reverted PotentialMatchCard to match regular card styling instead of full-container styling
- Made GlowEffect more subtle and less expansive on potential match cards

### Fixed
- Fixed inconsistency between PotentialMatchCard and regular cards
- Resolved visual layout issues with potential match cards taking up too much space

### Technical Details
- Removed `w-full h-full` styling that forced PotentialMatchCard to expand to fill the parent container
- Changed GlowEffect opacity and scale to be more subtle with `opacity-70` and `scale={1.0}`
- Added standard border with `border border-border/40` to match regular card styling
- Reverted text coloring from hardcoded values like `text-[#FAFAFA]` to use theme variables
- Changed badge styling to use standard Shadcn Badge components for topics instead of custom spans

## [Version 1.3.7] - 2025-03-23

### Added
- Enhanced API documentation with detailed authentication best practices
- Added comprehensive onboarding endpoint documentation explaining dual-purpose behavior (create/update)
- Included clear examples of success and error responses in API documentation

### Fixed
- Improved error handling in the profile update process to correctly display success messages
- Resolved issue where successful profile updates were incorrectly showing error messages

### Technical Details
- Updated `/docs/api/README.md` with authentication best practices section highlighting proper ways to handle Telegram auth
- Enhanced the onboarding endpoint documentation to clearly explain how it handles both new users and profile updates
- Added proper success/error response examples to API documentation for better developer guidance

## [Version 1.3.6] - 2025-03-23

### Fixed
- Fixed profile update functionality in the user profile page by resolving issues with error handling
- Corrected authentication issues in React Query that were causing false-negative error messages during profile updates
- Resolved nested try/catch block issues in profile-overview.tsx that were causing syntax errors

### Technical Details
- Completely rewrote the profile-overview.tsx component to remove nested try/catch blocks and improve error handling
- Properly included Telegram authentication headers in API requests by removing duplicate 'initData' in request bodies
- Implemented proper response handling to correctly process success and error states from the server
- Fixed client-side caching to immediately update the UI after successful profile updates without requiring a refresh
- Added proper form validation with clear error messages for required fields

## [Version 1.3.5] - 2025-03-23

### Changed
- Improved UI design of PotentialMatchCard with a modern glowing effect
- Removed white border from card containers in DiscoverPage
- Enhanced card components to utilize full container space

### Technical Details
- Updated PotentialMatchCard component with a more prominent glowing effect replacing the previous colored border
- Set GlowEffect component to fill the entire card with `className="absolute inset-0 w-full h-full"`
- Removed `border-2 border-blue-200` styling from the parent Card element in DiscoverPage
- Restructured flex layouts in card components to use full height and width
- Adjusted padding strategy from outer containers to inner content elements
- Applied consistent #FAFAFA text color for better readability against dark backgrounds

## [Version 1.3.4] - 2025-03-23

### Changed
- Improved filter logic implementation for more consistent and intuitive results
- Updated all array-type filters to use the PostgreSQL `&&` (overlap) operator for OR logic
- Added detailed code comments explaining the purpose of each filter operator

### Technical Details
- For array-type filters (topics, company tags, blockchain networks):
  - Consistently using the PostgreSQL `&&` (overlap) operator to implement OR logic within each category
  - This ensures that if an item is related to any of the selected values (e.g., on either Ethereum OR Solana), it will be shown
- For non-array fields (collaboration types, funding stages):
  - Using appropriate operators (`inArray()` or `= ANY()`) to implement the same OR logic
- All filter categories continue to use AND logic between them, ensuring more specific results
- Added detailed documentation in docs/discovery/filter-logic-update.md explaining the filter logic
- These changes make discovery results more relevant and consistent with user expectations

## [Version 1.3.3] - 2025-03-23

### Changed
- Changed filter logic for different filter categories to use AND operators for more specific filtering
- Modified the PostgreSQL queries to use OR logic within each filter category and AND logic between different filter categories
- Updated documentation with a detailed explanation of the filter logic change and its implementation

### Technical Details
- For array-type filters (topics, company tags, blockchain networks):
  - Within a single filter category (e.g., blockchain networks), we use OR logic: if you select Ethereum and Solana, we'll show items on either network
  - Between different filter categories (e.g., blockchain networks AND topics), we use AND logic: if you select Ethereum + AI topic, we only show AI items on Ethereum
- The implementation uses the && operator for OR logic within a category and combines with AND logic between different categories
- This was achieved by replacing the PostgreSQL contains operator (@>) with the overlap operator (&&) in the filter queries
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