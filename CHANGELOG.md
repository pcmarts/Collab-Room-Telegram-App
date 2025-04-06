# Changelog

All notable changes to the Collab Room project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
