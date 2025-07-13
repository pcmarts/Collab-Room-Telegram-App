# The Collab Room - Replit Development Guide

## Overview

The Collab Room is a Web3 professional networking platform built as a full-stack web application. It connects professionals for various types of marketing collaborations including podcast appearances, Twitter Spaces, blog posts, and other content partnerships. The platform features Telegram WebApp integration for authentication and notifications.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: Shadcn/ui components with Radix UI primitives
- **Styling**: TailwindCSS with light theme (professional variant)
- **State Management**: TanStack React Query for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite with custom plugins for theme management

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Telegram WebApp integration with session fallback
- **API Design**: RESTful endpoints with comprehensive error handling

### Database Architecture
- **Primary Database**: PostgreSQL with connection pooling
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Environment-based connection string with SSL support

## Key Components

### Authentication System
- **Primary Method**: Telegram WebApp initData validation
- **Fallback Method**: Express sessions with memory store
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **Authorization**: Role-based access with admin privileges

### Discovery System
- **Current Interface**: Card-based swiping (pending conversion to list view)
- **Filtering**: Multi-parameter filtering (collaboration types, company tags, funding stages)
- **Pagination**: Cursor-based pagination with server-side optimization
- **Matching Logic**: Bidirectional swipe-based matching system

### Collaboration Management
- **Types**: 7 predefined collaboration types (Podcast Guest, Twitter Spaces, etc.)
- **Creation**: Form-based collaboration posting with rich filtering options
- **Status Tracking**: Active/inactive collaboration lifecycle management
- **Applications**: User application system with status tracking

### External Integrations
- **Telegram Bot**: Notifications, user approval workflow, admin management
- **Twitter API**: Company profile data enrichment via RapidAPI
- **Supabase**: Additional data storage and authentication support

## Data Flow

### User Registration Flow
1. User accesses application via Telegram WebApp
2. New users redirected to welcome/application form
3. Application data stored with pending approval status
4. Admin notification sent via Telegram bot
5. Admin approval updates user status and enables platform access

### Discovery Flow
1. Authenticated users access discovery interface
2. Filters applied to collaboration search with cursor-based pagination
3. User interactions (swipes) tracked in database
4. Mutual positive swipes create matches
5. Match notifications sent via Telegram

### Collaboration Creation Flow
1. Approved users create collaborations via form interface
2. Rich metadata captured (topics, audience size, requirements)
3. Collaboration published with active status
4. Integration with discovery system for visibility
5. Application tracking and match facilitation

## External Dependencies

### Core Dependencies
- **Database**: PostgreSQL (environment-provided)
- **Authentication**: Telegram Bot API
- **UI Framework**: Radix UI components and TailwindCSS
- **State Management**: TanStack React Query
- **Form Handling**: React Hook Form with Zod validation

### Optional Dependencies
- **Twitter Integration**: RapidAPI Twitter241 service
- **Image Processing**: Company logo download and storage
- **Session Storage**: PostgreSQL-backed session management
- **Logging**: Custom logging utility with configurable levels

### Development Dependencies
- **Build Tools**: Vite, ESBuild for production builds
- **Type Checking**: TypeScript with strict configuration
- **Database Tools**: Drizzle Kit for schema management
- **Testing**: Manual testing scripts and utilities

## Deployment Strategy

### Platform Configuration
- **Deployment Target**: Google Cloud Run (configured in .replit)
- **Build Process**: Vite build for frontend, ESBuild for backend bundling
- **Environment**: Multi-environment support (development, production)
- **Port Configuration**: Port 5000 for backend, 5001 for frontend development

### Environment Variables
- **Database**: `DATABASE_URL` for PostgreSQL connection
- **Authentication**: `TELEGRAM_BOT_TOKEN` and test token variants
- **External APIs**: `X_RAPIDAPI_KEY` for Twitter integration
- **Security**: `SESSION_SECRET` for session encryption
- **Configuration**: `LOG_LEVEL` for logging control

### Production Considerations
- **Logging**: Configurable logging levels with silent mode support
- **Security**: HTTPS enforcement, security headers, rate limiting
- **Performance**: Connection pooling, query optimization, caching strategies
- **Monitoring**: Admin logging, error tracking, performance metrics

## Changelog

- July 13, 2025. Comprehensive refactoring of swipe-related terminology to use requests table format
  - Updated rate limiter from "swipeLimiter" to "requestLimiter" 
  - Created new storage methods for handling action-based requests (createCollaborationRequest, acceptCollaborationRequest, hideCollaborationRequest)
  - Server now properly accepts "action" parameter ("request" or "skip") instead of "direction" ("left" or "right")
  - Client-side code already properly sends "action" parameter - no changes needed
  - Updated error messages and logs to use collaboration request terminology
  - Legacy createSwipe method still available for backward compatibility but converted to use requests table
  - **IN PROGRESS**: Completing refactoring of remaining "direction" references in server code
- July 13, 2025. Fixed discover page database consistency issues and migrated legacy data
  - Resolved anomaly where user had match status but wasn't appearing in requests table
  - The discover page was using the requests table correctly, but legacy data remained in old swipes/matches tables
  - Added missing `/api/user-requests` and `/api/requests` endpoints to support frontend calls
  - Fixed `createSwipe` function to properly handle both left (skip) and right (request) swipes in requests table
  - Updated `getUserSwipes` function to return all swipes including skipped ones with proper direction mapping
  - Created and ran migration script to transfer 185 swipes and 12 matches from legacy tables to requests table
  - Successfully migrated user 2075c43e-aae9-4826-b9b6-5341112518b9 data: 2 requests now properly stored in requests table
  - Added "skipped" status to requests table schema for left swipes (joins existing "pending", "accepted", "hidden")
  - Discover page now fully uses requests table with proper filtering and excludes swiped collaborations correctly
  - **FINAL CLEANUP**: Deleted legacy swipes and matches tables from database after successful migration
  - Removed legacy table definitions from schema file and updated all import statements
  - Fixed stats endpoint to use requests table with status='accepted' instead of deleted matches table
  - Database now exclusively uses unified requests table with 35 total requests (7 accepted, 1 hidden, 27 pending)
- July 12, 2025. Fixed collaboration requests display and notification badge issues
  - Resolved duplication in request titles by using collaboration type instead of description as title
  - Fixed API mismatch where summary endpoint returned `pendingCount` but frontend expected `totalPendingCount`
  - Enabled proper loading of requests when switching tabs by updating query enablement logic
  - Added comprehensive cache invalidation for notification badges to update in real-time
  - Fixed hidden requests tab loading by ensuring queries are enabled when switching between tabs
  - Notification badges now properly display on bottom navigation and requests tab
- July 12, 2025. Successfully resolved all database query issues in requests management system
  - Fixed multiple SQL query errors in collaboration requests endpoints
  - Converted problematic Drizzle ORM queries to properly formatted raw SQL queries
  - Resolved "Cannot convert undefined or null to object" errors and "there is no parameter $1" errors
  - All collaboration requests API endpoints now working correctly with both "hidden" and "all" filters
  - Hidden requests tab properly shows 2 hidden requests, All requests tab shows 4 pending requests
  - Collaboration requests management system fully functional with proper data structure
- July 12, 2025. Removed all enrichment scripts and Twitter-related utilities
  - Deleted all Twitter enrichment log files from ./logs/ directory
  - Removed ./scripts/utils/update-company-with-twitter.js script
  - Removed ./scripts/tests/test-create-twitter-collab.ts test file
  - Removed Twitter schema files from collaboration form components
  - Eliminated company logo downloading and Twitter data enrichment functionality
  - Completed removal of all Twitter/enrichment infrastructure from codebase
- July 12, 2025. Fixed duplicate matches issue in requests table
  - Identified and removed 13 duplicate records from requests table that were causing double matches
  - Database migration had created duplicates when merging data from old swipes and matches tables
  - Removed duplicate prefetch API calls in MatchesPage.tsx that were causing redundant requests
  - Matches page now shows correct, deduplicated list of collaboration matches
  - Verified backend is correctly querying only the requests table with status='accepted'
- July 12, 2025. Enhanced collaboration requests management with improved UX
  - Fixed backend filtering to properly separate hidden vs active requests between tabs
  - Hidden requests now correctly disappear from "All" tab and only appear in "Hidden" tab
  - Accept button now redirects to messages tab (/my-matches) after accepting requests
  - Simplified details modal to match Messages tab style - focused on collaboration and essential info
  - Removed extensive company analytics and complex sections for cleaner user experience
  - Fixed tab visibility to always show "All" and "Hidden" options to prevent navigation issues
- July 12, 2025. Changed collaboration requests tabs from "All | This Week" to "All | Hidden"
  - Updated frontend tabs to show "All" and "Hidden" options
  - Backend now filters requests based on match status (hidden vs non-hidden)
  - All tab shows pending requests that haven't been hidden
  - Hidden tab shows previously hidden collaboration requests
  - Filter state managed in parent component for proper API integration
- July 12, 2025. UX improvements for collaboration requests interface
  - Removed collaboration details section from details modal to focus on company information
  - Removed topic pills from request cards for cleaner design
  - Made company names clickable links to Twitter profiles
  - Removed redundant website and Twitter links section from request cards
- July 12, 2025. Redesigned collaboration requests interface to infinite list format
  - Changed from grouped cards to individual request cards for better visibility
  - Removed ScrollArea max-height constraint that was hiding action buttons
  - Each request now gets its own dedicated card with full button visibility
  - Flattened request structure eliminates UI issues with multiple requests per collaboration
  - Improved user experience by ensuring all Hide/Accept buttons are always accessible
- July 12, 2025. Updated collaboration request terminology from "decline" to "hide"
  - Changed button text from "Decline" to "Hide" in requests management interface
  - Updated API route from `/decline` to `/hide` and backend method names
  - Modified Telegram bot buttons from "❌ Pass" to "❌ Hide" 
  - Updated confirmation messages to use "hid" instead of "declined"
  - Hidden requests no longer appear in My Collabs - Requests section
  - Added "hidden" status to match records for better request filtering
- July 12, 2025. Fixed matches page filtering to show only active matches
  - Added `AND m.status = 'active'` condition to `getUserMatchesWithDetails` SQL query
  - Resolved issue where declined matches were appearing in matches page
  - Matches page now properly displays only mutually agreed (active) matches
  - Maintained proper note display functionality from requester's swipe record
- July 11, 2025. Fixed swipe note display in matches page
  - Corrected SQL JOIN condition in `getUserMatchesWithDetails` to retrieve notes from requester's swipe
  - Updated JOIN logic to use `s.user_id = m.requester_id` instead of `s.user_id = ${userId}`
  - Fixed issue where collaboration request notes were not appearing in matches page
  - Notes now properly display original messages from swipes.note field when viewing matches
  - Confirmed working with multiple note types and null values handled correctly
- July 11, 2025. Fixed collaboration request note saving functionality
  - Corrected `createCollabApplication` method to save notes in `swipes.note` field instead of `swipes.details`
  - Updated parameter type from `details: any` to `message: string` for better type safety
  - Maintained backward compatibility by still populating `details` field with message for legacy support
  - Ensured proper note-adding flow works consistently across both list and card discovery interfaces
- July 11, 2025. Fixed Telegram bot user approval functionality
  - Resolved database schema error preventing admin approval buttons from working
  - Fixed `handleApproveUserCallback` function attempting to update non-existent `approved_by` field
  - Enhanced callback query handling with comprehensive debugging logs (`[CALLBACK]` and `[APPROVAL]` tags)
  - Improved error handling and validation in Telegram bot approval workflow
  - Added test scripts for validation of approval functionality and bot status monitoring
- July 11, 2025. Temporarily disabled discovery filters functionality
  - Hidden filters button on both discover pages (card view and list view) due to lazy loading issues
  - Filters button commented out in `client/src/pages/DiscoverPageList.tsx` and `client/src/pages/DiscoverPageNew.tsx`
  - Discovery page now works without filter-related errors
  - Filters functionality to be restored after resolving lazy loading and constants import issues
- July 10, 2025. Implemented backend webhook system for new company signups
  - Added GET webhook call to n8n endpoint with company ID after successful registration
  - Webhook fires automatically from `/api/onboarding` endpoint after company creation
  - Removed frontend webhook code to prevent duplication and race conditions
  - Webhook URL: `https://paulsworkspace.app.n8n.cloud/webhook/f4798a20-63b4-41e5-b799-749ca660caa4?id=[company_id]`
  - Expected response: `{"message":"Workflow was started"}`
- June 23, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.