# Changelog

## [Unreleased]

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
- **Root Cause 1**: CSP blocking Supabase storage domain causing browser to reject logo image requests
- **Root Cause 2**: Backend APIs not including `company_logo_url` field in responses, causing frontend to receive `undefined` values
- **Components Affected**: `LogoAvatar`, `CollaborationListItem`, `RequestsManagementTab`, `MatchesPage`, `MatchDetail`
- **Verification**: LogoAvatar component provides debug logging to verify successful logo loading

### Breaking Changes
- None

### Migration Notes
- Server restart required for CSP changes to take effect
- No database migrations needed
- Existing logo URLs in database will automatically start working

---

## Previous Entries
[Previous changelog entries would go here...] 