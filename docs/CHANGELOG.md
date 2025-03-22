# Changelog

All notable changes to The Collab Room will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Documentation structure with comprehensive sections for architecture, frontend, backend, database, API, Telegram integration, user flows, and discovery system
- Changelog to track all modifications to the application

### Changed
- Modified collaboration filtering logic in the discovery feed to only exclude collaborations created by the user themselves, removing all other filtering criteria

### Fixed
- Identified why only certain collaborations (specifically research reports) were showing up in the discovery feed
- Added detailed debug logging to the `searchCollaborations` and `getDiscoveryCards` methods for better visibility

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