# Changelog

All notable changes to the Collab Room project will be documented in this file.

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

## [Unreleased]

### Added
- Swipe functionality in the Discovery page with left/right swipe gestures
- Database storage for user swipe actions with appropriate foreign key constraints
- API endpoint for recording user swipes on collaborations
- Enhanced logging throughout the discovery and swipe process for better debugging

### Fixed
- Fixed collaboration visibility in Discovery page where users could only see their own collaborations
- Corrected the logic for the `excludeOwn` parameter in the `searchCollaborations` method
- Fixed PostgreSQL array formatting for proper filtering by topics, blockchain networks, and funding stages
- Enhanced error handling in the swipe recording process with better validation and error messages
- Fixed issue where previously swiped collaborations would reappear when refreshing the Discovery page
- Fixed critical bug where user's own collaborations could appear in Discovery page after swiping on all other cards

### Changed
- Updated documentation in docs/discovery/README.md to reflect recent changes
- Modified the default behavior to exclude a user's own collaborations from discovery by default
- Improved logging messages throughout the discovery and matching process

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