# Changelog

All notable changes to the Collab Room project will be documented in this file.

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

### Changed
- Updated documentation in docs/discovery/README.md to reflect recent changes
- Modified the default behavior to exclude a user's own collaborations from discovery by default
- Improved logging messages throughout the discovery and matching process

### Technical Details
- The primary issue was in the `searchCollaborations` method in `server/storage.ts` where the `excludeOwn` parameter check had incorrect logic
- When `excludeOwn` was `undefined` (the default state), it was being incorrectly processed due to the condition `(filters.excludeOwn !== false)`
- This was fixed by changing the logic to `(filters.excludeOwn === undefined || filters.excludeOwn === true)` to properly handle undefined values
- Added detailed logging of the parameter values to assist with debugging similar issues in the future