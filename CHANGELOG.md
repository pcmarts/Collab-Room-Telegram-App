# Changelog

## [1.0.2] - 2025-03-22

### Fixed
- Fixed API parameter mismatch in swipe functionality (client was sending 'collaboration_id' but server expected 'collaborationId')
- Resolved server port conflict by disabling Telegram bot polling mode
- Switched Telegram bot to use webhook instead of polling to prevent conflicts

## [1.0.1] - 2025-03-22

### Fixed
- Discovery cards not displaying in the swipe interface due to caching and response handling issues
- Added debug endpoint for bypassing cache when fetching discovery cards
- Enhanced API response handling to prevent empty result issues when server returns 304 responses
- Fixed mutation functions in DiscoverPage to properly handle API communications
- Improved error and response logging throughout the discovery system
- Added cache control headers on server to prevent stale data

## [1.0.0] - 2025-03-22

### Added
- Initial application release
- Telegram WebApp integration for authentication
- User and company profile management
- Dashboard and discovery interface
- Collaboration creation and management system
- Advanced filtering and discovery system for collaborations
- Swipe-based discovery interface for collaboration matching
- Application system for collaborations
- Notification system for collaboration activities
- Admin panel for user management and application review
- Support for multiple blockchain networks
- Network statistics API endpoint
- Marketing preferences management
- PostgreSQL database integration
- Responsive mobile-first design
- UI components using Shadcn/ui and Tailwind CSS

### Technical Implementations
- React + TypeScript frontend with Vite
- Express backend with REST API
- Drizzle ORM with PostgreSQL
- User authentication via Telegram
- React Query for data fetching
- Wouter for client-side routing
- Schema validations with Zod
- Notification system
- Admin impersonation functionality
- Interactive UI components with Framer Motion