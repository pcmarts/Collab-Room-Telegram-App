# Changelog

## [Unreleased]

### Added
- **Collaboration Type Registry System** (July 30, 2025) - Comprehensive centralized collaboration type management
  - **Registry Architecture**: Implemented centralized type definitions in `shared/collaboration-types/`
  - **Visual Enhancement**: Added color-coded collaboration types with professional Lucide React icons
  - **Type Categories**: Organized types into Social Media, Marketing, Content, and Events categories
  - **Legacy Compatibility**: Maintained backward compatibility through legacy name mappings
  - **Metadata System**: Rich type metadata including descriptions, keywords, and estimated durations
  - **Active Types**: Twitter Spaces Guest, Co-Marketing on Twitter, Podcast Guest, Live Stream Guest, Research Feature, Newsletter Feature, Blog Post Feature, Conference Coffee
  - **Documentation**: Created comprehensive documentation in `/docs/collaboration-types/`

- **Telegram Bot Environment Architecture Overhaul** - Complete redesign of bot environment management
  - **Environment Separation**: Clean separation between development and production bot instances
  - **Security Enhancement**: Moved webapp URLs to environment secrets (`WEBAPP_URL`, `WEBAPP_URL_DEV`)
  - **Graceful Shutdown**: Added proper bot cleanup on SIGINT/SIGTERM to prevent 409 Conflict errors
  - **Simplified Logic**: Removed complex `FORCE_PRODUCTION_BOT` conditional logic
  - **Test Script**: Added `scripts/tests/test-bot-environment.ts` for configuration verification
  - **Documentation**: Created comprehensive PRD and implementation guides in `/docs/architecture/`

### Fixed
- **Company Logo Loading Issues** - Fixed company logos not displaying across the application
  - **CSP Configuration**: Added Supabase storage domain (`*.supabase.co`) to Content Security Policy in `server/index.ts` to allow logo images and API requests
  - **Discovery Page API**: Added missing `logo_url` field selection and `company_logo_url` field mapping in `server/storage.optimized.ts` for the `searchCollaborationsPaginated` function
  - **Collaboration Requests API**: Added missing `logo_url` field mapping in `server/storage.ts` for both `getCollaborationRequestsSummary` and `getCollaborationRequests` methods
  - **My Matches API**: Added missing `logo_url` field selection and `company_logo_url` field mapping in `server/storage.ts` for `getUserMatchesWithDetails` method and API response mapping in `server/routes.ts`
  - **Frontend TypeScript**: Updated interfaces in `requests-management-tab.tsx`, `MatchesPage.tsx`, and `MatchDetail.tsx` to include `logo_url`/`companyLogoUrl` fields  
  - **Affected Pages**: Company logos now display properly on Discovery page, My Collaborations requests section, My Matches page, and Match Details dialog
  - **Related Issue**: Resolves fallback letter avatars appearing instead of actual company logos stored in Supabase storage

### Technical Details
- **Telegram Bot Environment Issues**:
  - **Root Cause**: Multiple bot instances attempting to poll same token causing 409 Conflict errors
  - **Solution**: Environment-specific bot token selection with proper cleanup handlers
  - **Security**: Webapp URLs moved from hardcoded values to environment secrets
  - **Files Modified**: `server/telegram.ts`, `scripts/tests/test-bot-environment.ts`
  - **Environment Variables**: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_TEST_BOT_TOKEN`, `WEBAPP_URL`, `WEBAPP_URL_DEV`

- **Company Logo Loading Issues**:
  - **Root Cause 1**: CSP blocking Supabase storage domain causing browser to reject logo image requests
  - **Root Cause 2**: Backend APIs not including `company_logo_url` field in responses, causing frontend to receive `undefined` values
  - **Components Affected**: `LogoAvatar`, `CollaborationListItem`, `RequestsManagementTab`, `MatchesPage`, `MatchDetail`
  - **Verification**: LogoAvatar component provides debug logging to verify successful logo loading

### Breaking Changes
- None

### Migration Notes
- **Telegram Bot Environment Changes**:
  - Configure `WEBAPP_URL_DEV` environment secret for development
  - Configure `WEBAPP_URL` environment secret for production deployments
  - Development environment now uses `TELEGRAM_TEST_BOT_TOKEN` automatically
  - Production environment uses `TELEGRAM_BOT_TOKEN`
  - Server restart required to apply bot configuration changes

- **Company Logo Fixes**:
  - Server restart required for CSP changes to take effect
  - No database migrations needed
  - Existing logo URLs in database will automatically start working

---

## Previous Entries
[Previous changelog entries would go here...] 