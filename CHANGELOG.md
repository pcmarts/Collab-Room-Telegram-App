# Changelog

All notable changes to the Collab Room project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Version 1.9.8] - 2025-04-25

### Enhanced
- Improved collaboration request flow with a two-step dialog (Just Send or Add a Note options)
- Added success toast notifications to provide confirmation feedback when requests are sent
- Created a dedicated green "success" variant for toast notifications
- Improved toast notification styling with better spacing and text formatting

### Fixed
- Fixed overlapping text issue in toast notifications with improved styling
- Improved positioning of note dialog to prevent keyboard overlap on mobile devices
- Resolved text readability issues in toast notifications with dedicated styling for success messages

### Technical Details
- Updated AddNoteDialog.tsx to include a two-step decision flow for sending requests
- Enhanced toast component in toast.tsx to include a new "success" variant with green styling
- Improved toaster.tsx with conditional styling for better text visibility and spacing
- Positioned note dialog higher on screen to avoid keyboard overlap when typing

## [Version 1.9.7] - 2025-04-25

### Enhanced
- Added detailed logging system to investigate swipe count discrepancies
- Implemented collaboration count verification to validate available cards
- Added grouping of swipes by collaboration ID to detect potential duplicates
- Enhanced user swipe endpoint with detailed diagnostic information

### Technical Details
- Added getActiveCollaborationsCount method to storage.ts for validation
- Enhanced API logging in the user-swipes endpoint to diagnose swipe records
- Improved error recovery for edge cases with mismatched swipe counts
- Added automatic detection for duplicate swipes on the same collaboration

## [Version 1.9.6] - 2025-04-25

### Enhanced
- Improved mobile experience by removing drag/swipe behavior and using direct DOM manipulation for card interactions
- Enhanced Live Stream Guest Appearance cards to display complete information including audience size (5,000-10,000 viewers)
- Redesigned card UI to show only one card at a time, eliminating overlapping issues
- Added specific collaboration title display (e.g., "Bondex Talks") to Live Stream cards

### Fixed
- Fixed clickability issues with links on mobile Telegram by removing all drag functionality
- Removed redundant text elements from cards and dialog boxes for cleaner UI
- Enhanced info dialog to display collaboration types in consistent pill/badge style
- Improved company information visibility in dialog with highlighted "About Company" section
- Fixed missing icon imports in CollaborationDetailsDialog component

### Technical Details
- Modified SimpleCard.tsx to use direct DOM manipulation for clickable elements
- Updated CollaborationDetailsDialog.tsx to use consistent badge styling matching cards
- Removed redundant "Collaboration details" text from dialog headers
- Added FileSearch, FileText, Mic, Video, and Mail icon imports to fix dialog errors

## [Version 1.9.5] - 2025-04-24

### Performance
- Optimized database queries with strategic indexing for discovery cards
- Reduced query execution time from ~40ms to ~20ms (50% improvement)
- Added comprehensive performance testing and measurement tools

### Technical Details
- Implemented database indexing migration script (db-migrate-add-indexes.js)
- Created performance test utility (test-query-performance.js) for benchmarking
- Added detailed documentation on database indexing strategy in docs/discovery/database-indexing.md

## [Version 1.9.4] - 2025-04-24

### Performance
- Added database indexing to improve query performance for discovery cards
- Optimized database join operations with strategic indexes
- Implemented composite indexes for frequently combined filter conditions

### Technical Details
- Added indexes for key join columns: collaborations.creator_id, users.id, companies.user_id
- Created index on collaborations.created_at for better pagination performance
- Added composite indexes for swipes.user_id + swipes.collaboration_id to optimize exclusion queries
- Added index on marketing_preferences.user_id to speed up preference loading
- Created migration script (db-migrate-add-indexes.js) for applying index changes
- Added performance testing utility (test-query-performance.js) to measure improvements

## [Version 1.9.3] - 2025-04-24

### Fixed
- Fixed missing company data in collaboration details dialog when using optimized database queries
- Ensured all company information appears correctly in the details view (funding stage, token, blockchain networks, etc.)

### Enhanced
- Improved the company data mapping when displaying collaboration details
- Added comprehensive company field mapping for better data structure consistency

### Technical Details
- Updated handleViewCardDetails function in DiscoverPageNew.tsx to properly structure company data
- Enhanced collaborationResults mapping in storage.ts to include all company fields
- Implemented fallback mechanism for company data structure to ensure backward compatibility

## [Version 1.9.2] - 2025-04-24

### Performance
- Optimized discovery cards loading by reducing database roundtrips
- Combined multiple separate queries into a single efficient query
- Implemented SQL-based filtering to reduce data processing overhead
- Added performance tracking to measure query execution time
- Created fallback mechanism to ensure stability during optimization

### Technical Details
- Enhanced `searchCollaborationsPaginated` with SQL `NOT EXISTS` subqueries
- Optimized joins to fetch marketing preferences in a single database call
- Created comprehensive documentation of query optimization in docs/discovery/query-optimization.md
- Added performance metrics logging for ongoing optimization efforts

## [Version 1.9.1] - 2025-04-24

### Changed
- Moved "Your Code" (formerly "Referrals") from bottom navigation to dashboard button
- Simplified UI by removing referrals option from main navigation menu
- Updated page header from "Invite Friends" to "Your Code" for cleaner interface
- Improved mobile navigation with 4-column layout instead of 5-column

## [Version 1.9.0] - 2025-04-24

### Enhanced
- Improved referral notification system by adding Telegram handle mentions (@username)
- Enhanced user experience by ensuring referrers receive proper notifications when their invitees are approved
- Made referral success messages more visible and engaging with proper Telegram notifications

### Fixed
- Resolved missing notifications to referrers when their referred users are approved
- Added better error handling and logging throughout the referral notification process
- Implemented fallback mechanisms for notification delivery in case of primary failures

### Technical Details
- Updated notifyReferrerAboutApproval function to include Telegram handles in messages
- Modified admin approval endpoint to properly trigger referrer notifications
- Improved logging and error handling in the notification system

## [Version 1.8.9] - 2025-04-16

### Fixed
- Resolved deployment issues by fixing SQL import statements across multiple files
- Fixed module import errors with drizzle-orm and @neondatabase/serverless packages
- Added documentation explaining the SQL import fixes for future reference

### Technical Details
- Updated import statements in server/routes/twitter-routes.js and multiple script files
- Changed `import { sql } from '@neondatabase/serverless'` to `import { sql } from 'drizzle-orm'`
- Created comprehensive documentation in docs/sql-import-fix-summary.md

## [Version 1.8.8] - 2025-04-16

### Fixed
- Fixed SwipeableCard button functionality issues (Skip and Request buttons now work properly)
- Enhanced event handling for touch and click events on card components
- Improved UI elements on Discovery page
- Changed Filter button to include text instead of just an icon for better usability
- Modified bottom panel to only show Refresh button when no cards are available
- Fixed critical deployment issue by correcting SQL function imports from @neondatabase/serverless to drizzle-orm

## [Version 1.8.7] - 2025-04-16

### Enhanced
- Improved Matches page UI to prevent text truncation issues
- Redesigned match cards with better text wrapping for company names, person names, and role titles
- Enhanced visual styling of collaboration type badges
- Optimized spacing and layout for better readability and information hierarchy
- Implemented responsive design improvements for different screen sizes

### Technical Details
- Updated card layout in MatchesPage.tsx to use break-words for proper text wrapping
- Reorganized match card content for better information presentation
- Improved badge styling with consistent color and spacing
- Added proper spacing between card elements for better visual hierarchy

## [Version 1.8.6] - 2025-04-16

### Fixed
- Fixed Twitter API integration by replacing problematic undici dependency with native fetch API
- Enhanced deployment compatibility by using standard approaches for API requests
- Improved company enrichment process with Twitter profile data (logo and description)

### Technical Details
- Removed undici dependency from Twitter API implementation in server/utils/twitter-api.js
- Updated configuration to use X_RAPIDAPI_KEY for Twitter API access
- Created optimized implementation for company profile enrichment with Twitter data
- Successfully tested the improved enrichment system on existing company profiles

## [Version 1.8.5] - 2025-04-16

### Enhanced
- Improved "My Collaborations" empty state experience with a clearer three-step explanation of how collaborations work
- Updated the step sequence to present a more logical user journey: Create, Approve, Chat
- Enhanced visual design with consistent spacing, sizing, and opacity for better focus on call-to-action

### Technical Details
- Redesigned the empty state in client/src/pages/my-collaborations.tsx with consistent styling for all elements
- Applied 65% opacity to background elements to make the primary CTA button stand out
- Updated the flow explanation to include Telegram chat integration in the final step
- Maintained consistent width of 3.5rem for all numbered steps and privacy icon for visual harmony

## [Version 1.8.4] - 2025-04-15

### Enhanced
- Improved Twitter engagement types display in CollaborationDetailsDialog to show multiple types correctly
- Added colon after "Co-Marketing on Twitter" for better readability
- Enhanced collaboration details formatting for a cleaner, more consistent user experience

### Technical Details
- Modified client/src/components/CollaborationDetailsDialog.tsx to properly handle array and string data formats
- Implemented join method to display multiple Twitter engagement types with proper comma separation
- Added consistent formatting with appropriate spacing and punctuation for improved information hierarchy

## [Version 1.8.3] - 2025-04-15

### Fixed
- Fixed Twitter handle display in match details view to show user's personal Twitter handle instead of company Twitter handle
- Improved data extraction for Twitter handles from stored Twitter URLs
- Enhanced consistency of user profile information display in the matches interface

### Technical Details
- Updated Twitter handle extraction logic in user matches API endpoint
- Fixed the data format for user social media information in match details views
- Maintained proper separation between user and company social media information

## [Version 1.8.2] - 2025-04-15

### Fixed
- Fixed blank discovery page issue when the app is first loaded in Telegram WebApp
- Improved authentication timing during initial data loading in discovery interface

### Technical Details
- Added delayed initialization to ensure Telegram authentication completes before data fetching begins
- Standardized data loading approach between initial page load and refresh button action
- Enhanced error handling for authentication state detection and recovery

## [Version 1.8.1] - 2025-04-15

### Fixed
- Fixed database timeout issues in admin broadcast functionality when sending to large user lists
- Resolved command visibility issues for admin users in Telegram bot interface
- Enhanced batch data processing for improved scalability in notifications

### Technical Details
- Replaced individual database queries with efficient batch operations in broadcast system
- Optimized user detail retrieval using separate batched queries instead of JOIN operations
- Fixed Telegram bot command scopes to properly show admin commands to authorized users only
- Added comprehensive logging for better tracking of broadcast message processing

## [Version 1.8.0] - 2025-04-15

### Enhanced
- Enhanced admin broadcast message system to disable link previews in all messages
- Improved HTML formatting support in broadcast messages while maintaining clean message appearance
- Added detailed logging for broadcast messages to assist with troubleshooting

### Technical Details
- Modified server/telegram.ts to set disable_web_page_preview to true for all broadcast messages
- Updated preview messages to inform admins about disabled link previews
- Enhanced error handling for HTML parsing issues in broadcast messages
- Maintained hyperlink functionality without showing link previews

## [Version 1.7.9] - 2025-04-14

### Fixed
- Fixed authentication refresh loop issues when opening the app outside of Telegram
- Disabled all automatic refresh mechanisms that triggered authentication errors
- Removed automatic page reload that caused repeated auth attempts on the Discover page

### Enhanced
- Improved authentication error handling with more informative error messages
- Implemented global React Query configuration updates to prevent auto-refresh loops
- Disabled background Telegram WebApp re-initialization to prevent unnecessary auth attempts

### Technical Details
- Modified queryClient.ts to use staleTime: Infinity to prevent automatic query refreshes
- Completely rewrote waitForTelegramInitData to eliminate automatic retries
- Disabled React Query's refetch on mount, focus, reconnect, and interval refresh behaviors
- Removed automatic page reload on Telegram initData availability check
- Disabled onSuccess handlers that were triggering profile data refreshes

## [Version 1.7.8] - 2025-04-12

### Fixed
- Fixed scrolling issues on signup pages for users with small devices
- Implemented scrollable containers on all onboarding forms to ensure full form accessibility
- Resolved problems with content being hidden below the viewport on smaller screens

### Enhanced
- Added consistent scroll behavior across all signup steps (personal-info, company-basics, company-sector, company-details, referral-code)
- Improved mobile usability with responsive scrollable areas in the application flow
- Maintained fixed position of submit buttons while allowing form content to scroll

### Technical Details
- Implemented overflow-y-auto with calculated height (calc(100vh - 120px)) for consistent scrolling experience
- Maintained pb-32 padding for content to ensure visibility when scrolling to bottom
- Kept TelegramFixedButtonContainer positioned at the bottom for consistent button access
- Updated all signup flow pages to follow the same scrolling pattern and layout structure

## [Version 1.7.7] - 2025-04-10

### Fixed
- Fixed data bleeding issue in podcast guest appearance form where description text appeared in podcast link field
- Fixed data bleeding issue in newsletter form where subscriber count appeared in newsletter URL field
- Improved form field validation to prevent cross-field value contamination

### Enhanced
- Added space detection to prevent description text showing in URL input fields
- Enhanced field type checking to ensure URL fields only contain URL-like values
- Implemented explicit field clearing between form steps to maintain data integrity

### Technical Details
- Updated create-collaboration-steps.tsx with improved field validation logic
- Enhanced nextStep method to explicitly clear URL fields when transitioning from description fields
- Implemented type-checking for URL fields to ensure appropriate values
- Added documentation on form field data isolation in docs/frontend/form-field-isolation.md

## [Version 1.7.6] - 2025-04-09

### Fixed
- Fixed blockchain networks filtering to correctly use company data instead of cached collaboration data
- Fixed company tags/sectors filtering to use up-to-date company data
- Fixed company Twitter followers filtering to use accurate company follower counts
- Fixed funding stages filtering to use current company funding stage data
- Fixed token status filtering to use current company token status
- Fixed user Twitter followers filtering to use current user data

### Enhanced
- Implemented join-based filtering system to ensure all filters use the most up-to-date data
- Improved filter logic to pull company-related fields directly from the companies table
- Added detailed logging for all filtering operations
- Enhanced error detection with additional safety checks

### Technical Details
- Updated `searchCollaborationsPaginated` in server/storage.ts to use table joins for all filtering operations
- Modified database query structure to use a three-table join (collaborations → users → companies)
- Created new documentation in docs/discovery/join-based-filter-fix.md explaining the implementation
- Maintained backwards compatibility with existing frontend code

## [Version 1.7.5] - 2025-04-09

### Fixed
- Fixed HTML formatting issues in Telegram notifications when company names contain website links
- Fixed invisible buttons in Telegram mobile browser across the application form (personal-info, company-sector, company-details)
- Corrected button colors in the application form to maintain brand consistency (#4034B9)

### Enhanced
- Improved notification messages to include more comprehensive collaboration details
- Enhanced button visibility in Telegram mobile browser with explicit styling properties
- Removed glow effects from buttons that were causing visibility issues in mobile browsers

### Technical Details
- Updated server/telegram.ts to properly handle HTML formatting when URLs are present in company names
- Modified personal-info.tsx, company-details.tsx, and company-sector.tsx to use explicit button styling
- Applied consistent button styling with backgroundColor, color, boxShadow and border properties across all form pages

## [Version 1.7.4] - 2025-04-08

### Added
- Completed comprehensive security audit resulting in identification and remediation of 13 vulnerabilities
- Created security documentation including security implementation guide and developer checklist
- Added detailed security audit report with findings and remediations

### Enhanced
- Implemented proper rate limiting across all critical endpoints
- Added secure HTTP headers including Content-Security-Policy
- Enhanced cookie security with httpOnly, secure, and SameSite attributes
- Improved environment variable handling with validation and secure defaults
- Enhanced session management with PostgreSQL store for production
- Improved Telegram authentication with proper cryptographic verification

### Technical Details
- Created server/middleware/rate-limiter.ts with endpoint-specific rate limits
- Added security headers middleware in server/index.ts
- Enhanced shared/config.ts with secure configuration validation
- Added docs/backend/security.md, docs/backend/security-checklist.md, and docs/security-audit-report.md
- Updated session configuration for enhanced security and proper storage
- Added sanitization for all user inputs and error messages

## [Version 1.7.3] - 2025-04-08

### Added
- Implemented comprehensive structured logging system with environment-specific log levels
- Created a configurable LOG_LEVEL environment variable for fine-grained control over logging verbosity

### Enhanced
- Created server/utils/logger.ts with automatic redaction of sensitive data in logs
- Implemented HTTP request logging middleware with context-aware logging levels
- Enhanced error handling with detailed, production-safe error logging

### Technical Details
- Added LogLevel enum with ERROR, WARN, INFO, HTTP, and DEBUG levels following standard severity levels
- Created requestLogger and errorLogger middleware for consistent HTTP request and error logging
- Implemented automatic redaction of sensitive information for security (passwords, tokens, keys, etc.)
- Added environment-specific formatting (one-line in production, multi-line in development)
- Modified shared/config.ts to support the new LOG_LEVEL configuration option

## [Version 1.7.2] - 2025-04-08

### Added
- Implemented mobile-specific haptic feedback for improved user experience in the Telegram WebApp
- Added tactile feedback to improve the swipe experience on touchscreen devices

### Enhanced
- Added distinctive haptic patterns: soft vibration for button presses, stronger vibration for swipes
- Implemented different vibration patterns to differentiate between accept (right) and pass (left) swipes
- Enhanced touch experience with tactile feedback aligned with visual and toast notifications

### Technical Details
- Created client/src/lib/haptics.ts utility module with reusable haptic feedback functions
- Added Telegram WebApp HapticFeedback API integration with device-appropriate fallbacks
- Implemented graceful degradation for non-mobile or non-Telegram environments
- Added intelligent checks to prevent errors when haptic feedback isn't available

## [Version 1.7.1] - 2025-04-08

### Added
- Implemented haptic feedback for button presses and swipe actions in the mobile app
- Created a reusable haptic feedback utility system for consistent tactile experience

### Enhanced
- Added vibration feedback when users press the pass or request buttons for improved mobile interaction
- Implemented different haptic patterns for accepting (right swipe) vs passing (left swipe)
- Enhanced the overall mobile experience with tactile feedback for key user actions

### Technical Details
- Created new haptics utility module with specialized functions for different feedback types
- Integrated haptic feedback into SwipeableCard component for both button clicks and swipe gestures
- Implemented fallback handling for environments where haptic feedback isn't available

## [Version 1.7.0] - 2025-04-07

### Added
- Added confirmation toast notifications when collaboration requests are sent
- Implemented visual feedback for both regular swipes and personalized note requests

### Enhanced
- Improved AddNoteDialog component to properly close before executing actions
- Fixed "Just send" button functionality for more consistent behavior
- Enhanced user experience with clear success feedback after sending collaboration requests

### Technical Details
- Updated SwipeableCard to show toast notifications for all successful right swipes
- Modified AddNoteDialog component to use proper handlers for closing and action execution
- Added different toast messages for requests with and without personalized notes
- Improved visual styling of the "Just send" button for better visibility

## [Version 1.6.9] - 2025-04-07

### Added
- Implemented LinkedIn-style "Add a note to your invitation" feature for collaboration requests
- Added dialog prompt when users request a collaboration, allowing personalized notes
- Created AddNoteDialog component with both initial prompt and note composition states

### Enhanced
- Modified swipe creation system to include optional personalized notes
- Updated Telegram notification messages to display personalized notes in collaboration requests
- Enhanced match creation logic to preserve notes from swipes to matches for later reference
- Improved card UI to display personalized notes directly on potential match cards

### Technical Details
- Added AddNoteDialog.tsx component with note composition interface
- Updated SwipeableCard component to intercept right swipes and show note dialog first
- Modified createSwipe and createMatch methods to handle the optional note field
- Enhanced Telegram notification template to include the personalized note when available
- Improved database integration to ensure notes persist through the entire collaboration lifecycle
- Added note display to potential match cards for better visibility of personalized messages

## [Version 1.6.8] - 2025-04-07

### Fixed
- Fixed notification toggle functionality in dashboard
- Resolved issue where notification preferences weren't persisting after page refresh
- Implemented comprehensive cache-busting to ensure fresh data on every profile load

### Enhanced
- Improved Profile API endpoint to include notification preferences in response
- Added detailed debugging logs for notification preference values
- Enhanced API responses with stronger cache control headers

### Technical Details
- Updated server/routes.ts to include notification preferences in Profile API response
- Added cache-control headers to prevent 304 responses when preferences change
- Updated API documentation with dedicated notification preferences endpoint
- Expanded frontend documentation with latest notification toggle implementation
- Fixed preference state synchronization between API and UI components
- Updated API documentation with dedicated notification preferences endpoint
- Expanded frontend documentation with latest notification toggle implementation

## [Version 1.6.7] - 2025-04-06

### Added
- Implemented Server-Sent Events (SSE) for real-time application status updates
- Created dedicated application status page with dark theme support
- Added immediate push notifications when application status changes

### Enhanced
- Improved UI by removing application status card from dashboard for a cleaner interface
- Reduced console logging to improve mobile performance
- Optimized application status update system to eliminate polling

### Technical Details
- Created new `/api/status-updates` SSE endpoint for real-time status updates
- Used `activeStatusConnections` map to track and manage client connections
- Modified approval endpoint to trigger immediate status updates to connected clients
- Enhanced status page with responsive dark-themed design per user request

## [Version 1.6.6] - 2025-04-05

### Enhanced
- Optimized the matches endpoint to significantly improve page load performance
- Implemented JOIN queries to fetch all match data in a single database request
- Reduced API response time for matches, especially for users with many matches

### Technical Details
- Created new `getUserMatchesWithDetails` method in storage.ts using advanced SQL JOIN queries
- Modified the matches endpoint to use the optimized method instead of multiple separate queries
- Maintained backward compatibility with existing client interfaces while improving performance
- Enhanced error handling and robust data mapping for the optimized match response format

## [Version 1.6.5] - 2025-04-05

### Added
- Implemented comprehensive Telegram notification system for collaboration requests
- Added interactive buttons in notifications for quick "Match" or "Pass" actions
- Implemented system to respect user notification preferences by checking notification_preferences table

### Enhanced
- Designed notifications with Twitter hyperlinks for company names
- Fixed Telegram API's 64-byte callback_data limitation by implementing shortened IDs
