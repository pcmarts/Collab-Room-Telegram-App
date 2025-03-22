# Changelog

All notable changes to The Collab Room will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Documentation structure with comprehensive sections for architecture, frontend, backend, database, API, Telegram integration, user flows, and discovery system
- Changelog to track all modifications to the application
- Implemented bidirectional matching system showing potential matches directly in discovery feed
- Added dedicated card UI for potential matches with UserCheck icon and distinctive styling
- Enhanced swipe handling to process both regular collaborations and potential matches

### Changed
- Modified collaboration filtering logic in the discovery feed to only exclude collaborations created by the user themselves, removing all other filtering criteria
- Updated match notification system to show appropriate information for different match types

### Fixed
- Identified why only certain collaborations (specifically research reports) were showing up in the discovery feed
- Added detailed debug logging to the `searchCollaborations` and `getDiscoveryCards` methods for better visibility
- Resolved duplicate route conflict for `/api/collaborations/search` endpoint that was causing API errors
- Updated client-side API fetch in DiscoverPage to use standard React Query configuration
- Improved error handling and debug logging in API requests
- Fixed inconsistent variable naming in server-side collaboration filtering

## [1.0.0] - 2025-03-22

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