# Changelog

All notable changes to the Collab Room project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
