# Changelog

All notable changes to the Collab Room project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Version 1.6.0] - 2025-04-04

### Added
- Implemented comprehensive security infrastructure across the application
- Created a centralized configuration module with strict environment variable validation
- Added custom rate limiting middleware to protect against brute force attacks
- Implemented production-ready session management with PostgreSQL session store
- Enhanced security headers to mitigate common web vulnerabilities

### Changed
- Improved database connection security with optimized connection pooling
- Enhanced error handling with proper sanitization in production environments 
- Updated server initialization with more robust validation and fallback warnings

### Technical Details
- Created a robust config validation system in `shared/config.ts` using Zod schemas
- Implemented custom rate limiting in `server/middleware/rate-limiter.ts` with IP-based tracking
- Enhanced database connection with proper SSL support and connection parameters in `server/db.ts`
- Added Content Security Policy headers and other security best practices to Express configuration
- Improved error handling to hide sensitive information in production environments
- Created comprehensive documentation of security features in the docs folder

## [Version 1.5.3] - 2025-04-03

### Added
- Improved UI consistency across all states in the Discovery page
- Enhanced navigation between Match and Discovery pages with smoother transitions

### Fixed
- Added consistent header to loading and empty states in DiscoverPageNew component
- Updated "Start Discovering" button in MatchesPage to use client-side routing instead of full page reload
- Fixed layout inconsistencies between different UI states in the Discovery page

### Technical Details
- Refactored DiscoverPageNew.tsx to maintain the same header and layout structure in all states (loading, empty, and active)
- Updated MatchesPage.tsx to use Wouter's useLocation hook for client-side navigation
- Implemented consistent component hierarchy across all UI states for better maintainability

## [Version 1.5.2] - 2025-04-03

### Fixed
- Fixed critical bug where already matched collaborations continued to appear in potential match cards
- Enhanced the filtering mechanism to check existing matches before showing potential matches
- Eliminated duplicate matches by filtering against both swipe history and the matches database table

### Technical Details
- Updated `getPotentialMatchesForHost` function in server/storage.ts to check for existing matches
- Added functionality to retrieve and filter based on matched collaboration IDs
- Implemented multi-layered filtering approach that ensures consistent filtering between discovery methods
- Added detailed logging for match filtering to better identify excluded collaborations

## [Version 1.5.1] - 2025-04-03

### Fixed
- Fixed the "weird card" issue when refreshing discovery page multiple times
- Enhanced server-side filtering to prevent previously excluded collaborations from reappearing
- Improved safety checks to ensure user's own collaborations never appear in search results
- Fixed company LinkedIn field reference in potential matches to properly use 'linkedin_url'

### Technical Details
- Enhanced the secondary safety filter in `searchCollaborationsPaginated` to perform more robust checks
- Added detailed debugging information to better identify filtering issues
- Improved filtering by checking both collaboration IDs and creator IDs in a single operation
- Fixed data type inconsistencies with LinkedIn URL field in company data
- Added extra validation to ensure proper field mapping between company data structures

## [Version 1.5.0] - 2025-04-03

### Added
- Created new MatchContext system with React Context API to track match creation and updates
- Implemented automatic match list refreshing when new matches are created
- Added integration between DiscoverPage and MatchesPage for seamless match updates

### Fixed
- Resolved issue where newly created matches weren't appearing in the Matches page until manual refresh
- Ensured consistent match data synchronization between Discovery and Matches pages

### Technical Details
- Implemented `MatchContext.tsx` to provide a shared state for match creation events
- Enhanced `DiscoverPage.tsx` to update the global match state when a match is created
- Modified `MatchesPage.tsx` to listen for match creation events and automatically refresh data
- Added detailed logging throughout the match creation and refresh process

## [Version 1.4.9] - 2025-04-03

### Fixed
- Fixed critical bug where potential match cards would continue appearing after a user had swiped left on them
- Enhanced server-side filtering logic to properly exclude potential matches that have already been swiped on
- Improved tracking of swipe IDs in both server and client to ensure comprehensive filtering of already-seen cards
- Added additional logging in getPotentialMatchesForHost to track filtered potential matches

### Changed
- Updated client-side swipe handling to store both card ID and swipe ID in localStorage for more robust filtering
- Enhanced the server-side filtering mechanism in getPotentialMatchesForHost to check swipe IDs as well as user/collaboration combinations
- Added more explicit error reporting when trying to filter already-swiped potential matches

### Technical Details
- Modified the getPotentialMatchesForHost function in server/storage.ts to track and filter by swipe IDs
- Added swipe ID tracking to client-side localStorage to prevent previously swiped potential matches from reappearing
- Enhanced client-side filtering to check both match IDs and swipe IDs when determining what to display
- Added debugging logs to trace the filtering process for potential matches

## [Version 1.4.8] - 2025-04-03

### Added
- Enhanced visual design for potential match cards with animated glow effects and improved badge styling
- Improved content display in potential match cards to better highlight collaboration details
- Added gradient styling to the "Match Now" button for better visual emphasis
- Created new documentation for potential matches in docs/discovery/potential-matches.md

### Fixed
- Fixed inconsistent filtering between potential match cards and regular cards
- Ensured potential match cards apply the same localStorage-based filtering as regular cards
- Resolved issues with missing or inconsistent data display in potential match cards
- Improved field mapping for potential match data to handle varied API response formats

### Technical Details
- Updated PotentialMatchCard component with enhanced UI and animations
- Applied consistent filtering logic to ensure recently swiped cards are properly excluded from both regular and potential match cards
- Implemented more robust data mapping to handle different data structures in API responses
- Added detailed field fallbacks to prevent display issues with missing data

## [Version 1.4.7] - 2025-04-03

### Fixed
- Fixed critical bug where previously swiped cards were still appearing in the discovery feed
- Resolved authentication persistence issues by implementing a fallback mechanism using Telegram user ID
- Added secondary safety check to ensure excluded cards never appear in search results

### Technical Details
- Implemented local storage caching of Telegram user ID for persistent authentication across sessions
- Added custom header 'x-telegram-user-id' that's sent with every API request as an authentication fallback
- Enhanced server authentication middleware to check for the custom header when session cookies fail
- Implemented a double filtering system in searchCollaborationsPaginated that applies filters both in SQL and in memory
- Added detailed logging that identifies when excluded cards are incorrectly returned by the database query
- Created a test page at /auth-test to verify the authentication mechanism works properly

## [Version 1.4.6] - 2025-03-31

### Fixed
- Fixed "response.json is not a function" error when updating company information
- Resolved issue with company profile form handling API responses incorrectly

### Technical Details
- Removed redundant response.ok check and response.json() call in company-info.tsx
- Modified error handling in company profile form to respect the API request function's behavior
- Added comments explaining that apiRequest already handles error checking and JSON parsing

## [Version 1.4.5] - 2025-03-31

### Changed
- Enhanced collaboration details dialog to properly display company information from database
- Improved company information section in collaboration details with more comprehensive data
- Modified social media icons to use consistent white styling for better user experience

### Fixed
- Fixed issue where company data was not properly passed to the CollaborationDetailsDialog component
- Resolved problem where company information was inconsistently displayed across different collaboration types

### Technical Details
- Modified getCompanyName function in DiscoverPage.tsx to prioritize company_data from the database
- Updated CollaborationDetailsDialog component to exclusively use data from the companies table
- Enhanced collaboration object passed to components with proper company data fields
- Added comprehensive logging to help debug company data retrieval issues
- Replaced colored social media icons with consistent white icons from Lucide for better UI coherence

## [Version 1.4.4] - 2025-03-31

### Changed
- Enhanced type safety for all specialized card components with proper TypeScript type assertions
- Improved type handling for JSON details objects in card components to provide better developer experience
- Refined card detection system to better map collaboration types to appropriate specialized cards
- Added fuzzy matching for collaboration types to handle variations in naming conventions

### Technical Details
- Added explicit TypeScript interfaces and type assertions for all card components
- Implemented properly typed details objects for each specialized card (PodcastCard, TwitterSpacesCard, BlogPostCollabCard, etc.)
- Enhanced the debug section with strict type handling and better error reporting
- Fixed type errors by adding comprehensive type assertions throughout components
- Improved maintainability of the codebase through consistent type handling
- Created a robust system for mapping incoming collaboration types to the correct card components

## [Version 1.4.3] - 2025-03-31

### Changed
- Enhanced the TwitterSpacesCard component with clickable company name linking to company website
- Made the Twitter handle in TwitterSpacesCard clickable, directing to the Twitter profile
- Improved the follower count display in TwitterSpacesCard for better visibility
- Added "View Twitter profile" external link to TwitterSpacesCard for easier navigation

### Technical Details
- Updated TwitterSpacesCard interface to support companyWebsite field paralleling PodcastCard
- Added proper URL formatting for Twitter handles, ensuring they work whether prefixed with @ or not
- Enhanced follower count display with bold styling and dedicated Users icon
- Added FiExternalLink icon integration for consistency with PodcastCard design
- Improved UI with consistent spacing and organization of metadata

## [Version 1.4.2] - 2025-03-31

### Changed
- Improved Discovery page card components by replacing generic BaseCollabCard with standalone specialized cards
- Modified searchCollaborations function to join with companies table for proper company name display
- Enhanced collaboration API responses to include company names with each collaboration
- Extended Collaboration type in frontend to properly handle company names

### Fixed
- Fixed issue where company names were displaying as "company" instead of real company names
- Resolved database schema field reference errors in collaboration filtering system
- Corrected SQL syntax in token status and funding stage filtering

### Technical Details
- Completely removed BaseCollabCard.tsx, replacing with standalone card components for each collaboration type
- Added company information enhancement to searchCollaborations in server/storage.ts
- Modified API to include creator_company_name in collaboration objects
- Updated Typescript types in DiscoverPage to handle the enhanced collaboration objects
- Fixed database field references to use the correct schema field names (funding_stage, twitter_followers)

## [Version 1.4.1] - 2025-03-25

### Added
- Added a new animated TextLoop component on the welcome page to showcase different collaboration types with smooth transitions
- Implemented glowing effect button for the "Submit Application" button on the final onboarding page

### Changed
- Enhanced the welcome page UI by removing the containing box, making text white with regular weight, and changing CTA to "Apply"
- Improved all onboarding pages (/personal-info, /company-basics, /company-sector, /company-details) with better UI and usability
- Removed subtitles and step count indicators from all onboarding pages for cleaner appearance
- Added proper scrollable containers with fixed height to all onboarding pages to enable better navigation on smaller screens
- Adjusted button positions on all pages to improve user experience
- Fixed gap issues beneath buttons by ensuring consistent black background

### Technical Details
- Created new TextLoop UI component in `client/src/components/ui/text-loop.tsx` for rotating text display
- Modified OnboardingHeader component to support a cleaner design without subtitles
- Implemented scrollable containers using `overflow-y-auto` with calculated height
- Added glowing button effect using CSS gradients and animations
- Fixed visual inconsistencies by standardizing button container backgrounds across all pages
- Created comprehensive documentation in `docs/frontend/ui-components.md` describing all specialized UI components

## [Version 1.4.0] - 2025-03-25

### Added
- Implemented comprehensive admin message logging system to track all admin actions
- Added enhanced Telegram notifications for new user applications
- Implemented direct approval functionality through Telegram inline buttons

### Changed
- Improved new user notification format with hyperlinked company information
- Added Telegram handle to user identification in admin notifications
- Updated notification buttons to include "Approve Application" and "View Application" options
- Modified "View Application" button to direct to pending applications page

### Technical Details
- Created a structured logging system in `server/telegram.ts` that saves admin actions to `logs/admin_messages.log`
- Updated `notifyAdminsNewUser` function to include hyperlinks to company websites when available
- Implemented `handleApproveUserCallback` function to process inline button approvals
- Added Telegram callback handlers to support button-based user approval
- Enhanced message formatting with HTML to improve readability of notifications
- Added logging across all notification functions to track message delivery and admin actions

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