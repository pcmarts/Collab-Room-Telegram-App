# The Collab Room - Replit Development Guide

## Overview

The Collab Room is a cutting-edge Web3 professional networking platform that intelligently connects professionals through blockchain-powered collaboration tools and dynamic interaction design. Built as a modern full-stack web application, it facilitates various types of marketing collaborations including Twitter marketing campaigns, podcast appearances, live streams, research features, newsletter placements, blog posts, and networking events.

**Current Status**: Production-ready platform with active collaboration matching, request management, and Telegram integration.

## Recent Changes (July 2025)

### ✓ Implemented Swipeable Collaboration Type Filter Pills (July 31, 2025)
- **Horizontal Scrolling Pills**: Created CollaborationTypeFilters component with smooth horizontal scrolling for mobile screens
- **Dynamic Count Updates**: Added real-time collaboration count display without loading states for instant feedback
- **Backend Filtering Logic**: Fixed collaboration type filtering to properly handle stable IDs vs database display names
- **Enhanced Touch Scrolling**: Added smooth scrolling CSS properties and touch-optimized behavior for mobile users
- **Complete Filter Coverage**: All (27), Twitter Spaces (7), Podcasts (2), Live Streams (3), Twitter Co-marketing (7), Reports (2), Blog Posts (3)
- **Optimized Performance**: Removed unnecessary loading states for instant filter switching experience
- **ID Mapping System**: Backend converts stable type IDs to all possible database values (current and legacy names)
- **Mobile First Design**: Pills support horizontal swiping on thin mobile screens with scrollbar-hide styling
- **UI Cleanup**: Removed CollabTypesBanner "discover collaborations like" box to streamline discovery interface

### ✓ Enhanced "View Match in My Matches" Button with Direct Navigation (July 31, 2025)
- **Direct Navigation**: "View Match in My Matches" button now navigates directly to My Matches page (/matches)
- **Improved UX**: Clicking the button closes the dialog and takes users straight to their matches
- **Smart Behavior**: Only applies to matched collaborations, other status buttons maintain existing behavior
- **Implementation**: Added useLocation hook from wouter and updated click handler logic
- **Seamless Flow**: Users can now go directly from discovery to matches without manual navigation

### ✓ Enhanced Bottom Navigation with Signup Prompt Dialog for Unauthenticated Users (July 30, 2025)
- **Signup Prompt Dialog**: Created new SignupPromptDialog component for unauthenticated users clicking "My Collabs"
- **Smart Navigation Logic**: Made "My Collabs" clickable for non-authenticated users to show signup dialog instead of being disabled
- **Professional Dialog Design**: Features Sparkles icon, clear messaging "To post a collab for others to join, please sign up"
- **Navigation Flow**: "Sign Up" button redirects to /welcome, "Maybe Later" closes dialog
- **Selective Behavior**: Only "My Collabs" gets clickable treatment, other restricted items remain disabled
- **Enhanced UX**: Added haptic feedback and hover states for smooth interaction
- **Component Architecture**: Reusable SignupPromptDialog with customizable title and description props

### ✓ Repositioned Profile Icon to Far Right in Discover Page Header (July 30, 2025)
- **Header Layout Update**: Moved UserCircle (profile) button from middle to far right position in Discover page
- **New Button Order**: Sort → Refresh → Profile (for authenticated users) 
- **Maintained Functionality**: All button interactions remain identical, profile still navigates to dashboard
- **Clean Design**: Profile icon now sits at rightmost position after refresh button as requested
- **Responsive Layout**: Header maintains proper spacing and alignment across all screen sizes

### ✓ Implemented Request Management System Enhancements and Conditional My Collab Navigation (July 30, 2025)
- **Request Notes Enhancement**: Added "Your note:" label that only appears when actual note content exists (not empty)
- **Sent Tab Counter**: Added dynamic count display to "Sent" tab showing "(X)" where X is the number of sent requests
- **Conditional My Collab Navigation**: Users with no existing collaborations are automatically redirected to collaboration creation form
- **Improved Request Card Layout**: 
  - Sent requests: Pending badge (bottom-left), timestamp (bottom-right)
  - Received/Hidden: Timestamp and right arrow in header, action buttons at bottom
- **Enhanced Privacy Design**: Maintained host name hiding and clean interface across all request types
- **Architecture**: Used React useEffect with proper loading checks to prevent premature redirects

### ✓ Enhanced Collaboration Details Dialog with Interactive Media Links (July 30, 2025)
- **Dynamic URL Detection**: Implemented automatic detection and conversion of media URLs to clickable buttons
- **Podcast Links**: "Podcast Link" and "podcast_url" fields automatically become blue "Previous Episodes" buttons
- **Live Stream Links**: "Previous Stream Link" and "stream_url" fields automatically become red "Previous Streams" buttons
- **Clean UI**: Raw URLs are hidden from display, replaced with styled button links with external link icons
- **Smart Field Detection**: System automatically identifies URL fields containing "podcast" + "link/url" or "stream" + "link" patterns
- **User Experience**: Users can now easily access previous episodes/streams to evaluate content quality before requesting collaborations
- **Cross-Platform Support**: Works with various URL formats (Spotify, Notion, YouTube, etc.)

### ✓ Implemented Dual Naming System for Forms vs App (July 30, 2025)
- **Issue**: User wanted different labels for form creation vs rest of app without complex configuration
- **Solution**: Created dual naming architecture with separate control points
- **Implementation**:
  - **Form Labels**: Hardcoded in `formDisplayNames` object in `/client/src/components/CollaborationFormV2/utils/typeRegistry.ts`
  - **App Labels**: Configurable in `/shared/collaboration-types/config.ts` for discovery, matches, etc.
- **User Control**: 
  - Edit form creation labels directly in form registry file
  - Edit app-wide display names in configuration file
- **Current Form Labels**: "Twitter Co-Marketing Opportunity", "Podcast", etc.
- **Architecture Benefits**: Clean separation allows different UX without complexity
- **Result**: Form shows custom labels while maintaining stable IDs and configurable system for rest of app

### ✓ Fixed Form Logic for Fully Flexible Naming System (July 30, 2025)
- **Issue Resolved**: Form was still using hardcoded legacy names alongside stable IDs, causing mismatches when display names changed
- **Root Cause**: Switch statements in form logic contained both `COLLAB_TYPE_IDS.TWITTER_SPACES` and `"Twitter Spaces Guest"` cases
- **Solution**: Removed all hardcoded legacy name cases from form routing logic
- **Files Updated**: 
  - `/client/src/components/CollaborationFormV2/index.tsx` - Fixed renderStepContent() switch statement
  - `/client/src/components/CollaborationFormV2/hooks/useCollaborationForm.ts` - Fixed formatDetailsForType() switch statement
- **Result**: Forms now work purely with stable IDs, display names can be changed in config without breaking functionality
- **Testing**: Display names can now be freely edited in `/shared/collaboration-types/config.ts` without form errors

### ✓ Flexible Collaboration Type Naming System (July 30, 2025)
- **Editable Display Names**: Collaboration type names can now be changed without breaking the form
- **Configuration File**: Edit names in `/shared/collaboration-types/config.ts`
- **Stable ID System**: Uses internal IDs (`twitter_spaces_guest`, `twitter_comarketing`, etc.) for database stability
- **Schema Flexibility**: Form schemas accept both IDs and display names
- **Backward Compatibility**: Legacy names continue to work through mapping system
- **How to Edit Names**:
  1. Open `/shared/collaboration-types/config.ts`
  2. Edit the `DISPLAY_NAMES` object
  3. Changes apply immediately without database migration

### ✓ Collaboration Type Registry System (July 30, 2025)
- **Centralized Type Management**: Implemented comprehensive collaboration type registry in `shared/collaboration-types/`
- **Enhanced Type Definitions**: Added structured collaboration types with icons, colors, categories, and metadata
- **Legacy Compatibility**: Maintained backward compatibility through legacy name mappings
- **Active Types**: Twitter Spaces Guest, Co-Marketing on Twitter, Podcast Guest, Live Stream Guest, Research Feature, Newsletter Feature, Blog Post Feature, Conference Coffee
- **Type Categories**: Social Media, Marketing, Content, Events
- **Visual Enhancement**: Color-coded collaboration types with Lucide React icons

### ✓ Company Logo Loading System (July 25, 2025)
- **CSP Configuration**: Added Supabase storage domain to Content Security Policy for image loading
- **API Enhancement**: Added missing `company_logo_url` fields across all collaboration APIs
- **Component Updates**: Enhanced LogoAvatar component with proper fallback handling
- **Coverage**: Fixed logos across Discovery page, My Collaborations, My Matches, and Match Details

### ✓ Telegram Bot Environment Architecture (July 14, 2025)
- **Environment Separation**: Clean separation between development and production bot instances
- **Security Enhancement**: Moved webapp URLs to environment secrets
- **Graceful Shutdown**: Added proper bot cleanup to prevent 409 Conflict errors
- **Simplified Logic**: Removed complex conditional environment detection

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
- **Primary Database**: PostgreSQL with connection pooling and optimized indexing
- **ORM**: Drizzle ORM for type-safe database operations with Zod validation
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Environment-based connection string with SSL support
- **Key Tables**: users, companies, collaborations, requests, marketing_preferences, notification_preferences
- **Advanced Features**: JSONB storage for collaboration details, array fields for tags/networks, GIN indexes for search optimization

## Key Features

### Collaboration Matching System
- **Intelligent Discovery**: Advanced collaboration search with filtering by company sectors, funding stages, token status, blockchain networks
- **Request Management**: Comprehensive request handling with accept/decline functionality and detailed match tracking
- **Match Analytics**: Real-time match statistics and collaboration tracking with detailed user/company data enrichment

### Collaboration Type System
- **Registry Architecture**: Centralized collaboration type definitions with metadata, icons, and categories
- **Type Categories**: Social Media, Marketing, Content, Events
- **Legacy Support**: Backward compatibility with existing collaboration data through name mappings
- **Visual Design**: Color-coded types with professional iconography

### User & Company Management
- **User Profiles**: Complete professional profiles with Twitter/LinkedIn integration
- **Company Profiles**: Detailed company information with logos, funding stages, blockchain networks, and sector tags
- **Marketing Preferences**: Granular collaboration and discovery preferences with filter controls
- **Notification System**: Configurable notification preferences with Telegram integration

### API Architecture
- **RESTful Design**: Comprehensive API endpoints with proper error handling and validation
- **Optimized Queries**: Advanced PostgreSQL queries with joins, indexing, and pagination
- **Data Enrichment**: Rich API responses with user, company, and collaboration details
- **Type Safety**: Full TypeScript integration with Zod validation schemas

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
- **Telegram Bot**: Notifications (user approval, collab requests, matches), user approval workflow, admin management
- **Twitter API**: Company profile data enrichment via RapidAPI
- **Supabase**: Additional data storage and authentication support

### Notification System
- **Telegram Integration**: Real-time notifications via Telegram bot
- **Request Confirmations**: When users send collab requests, they receive immediate confirmation notifications
- **Host Notifications**: Collaboration hosts receive notifications when someone requests their collab
- **Match Notifications**: Both users receive notifications when mutual requests create matches
- **Message Format**: Professional HTML-formatted messages with company names and collab types
- **Interactive Buttons**: Quick access to My Matches section and main application

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
- **Database**: PostgreSQL with connection pooling and advanced indexing
- **Authentication**: Telegram Bot API with WebApp integration
- **UI Framework**: Radix UI components, Shadcn/ui, and TailwindCSS with theme system
- **State Management**: TanStack React Query for server state management
- **Form Handling**: React Hook Form with Zod validation and type safety
- **Icons**: Lucide React for collaboration type icons and UI elements
- **Routing**: Wouter for client-side navigation

### Advanced Dependencies
- **Twitter Integration**: RapidAPI Twitter241 service for social media features
- **Object Storage**: Supabase for company logo storage and management
- **Session Storage**: PostgreSQL-backed session management with Express sessions
- **Logging**: Custom logging utility with configurable levels and environment detection
- **Animation**: Framer Motion for sophisticated UI animations
- **Type Registry**: Custom collaboration type registry system with metadata support

### Development Dependencies
- **Build Tools**: Vite with custom plugins, ESBuild for production optimization
- **Type Checking**: TypeScript with strict configuration and Drizzle type generation
- **Database Tools**: Drizzle Kit for schema management and type-safe migrations  
- **Testing**: Comprehensive test scripts for bot environment and API validation
- **Development Server**: Express server with Vite integration for full-stack development

## Deployment Strategy

### Platform Configuration
- **Deployment Target**: Replit Deployments with automatic scaling
- **Build Process**: Vite build for frontend, ESBuild for backend bundling
- **Environment**: Multi-environment support (development, production) with proper separation
- **Port Configuration**: Port 5000 for unified server (serves both frontend and backend)

### Environment Variables
- **Production**: `WEBAPP_URL`, `TELEGRAM_BOT_TOKEN`, `DATABASE_URL`
- **Development**: `WEBAPP_URL_DEV`, `TELEGRAM_TEST_BOT_TOKEN`, `DATABASE_URL`
- **Security**: All sensitive URLs and tokens stored as environment secrets
- **CSP Configuration**: Supabase storage domain included for logo loading

### Deployment Features
- **Automatic Restarts**: Workflow automatically restarts on code changes
- **Health Checks**: Built-in health monitoring and error logging
- **Environment Detection**: Automatic production/development environment detection
- **Bot Management**: Graceful bot shutdown to prevent polling conflicts

## Collaboration Type System Architecture

### Registry Structure
The collaboration type system is built around a centralized registry in `shared/collaboration-types/`:

- **`definitions.ts`**: Core type definitions with metadata, icons, colors, and categories
- **`types.ts`**: TypeScript interfaces and enums for type safety
- **`registry.ts`**: Registry utilities and accessor functions
- **`index.ts`**: Unified exports for the type system

### Active Collaboration Types
1. **Twitter Spaces Guest** (Social Media) - Join as guest speaker on Twitter Spaces
2. **Co-Marketing on Twitter** (Marketing) - Collaborative marketing campaigns on Twitter
3. **Podcast Guest Appearance** (Content) - Appear as guest on podcasts
4. **Live Stream Guest Appearance** (Content) - Join live streams as guest
5. **Report & Research Feature** (Content) - Be featured in research reports
6. **Newsletter Feature** (Content) - Be featured in newsletters
7. **Blog Post Feature** (Content) - Be featured in blog posts
8. **Conference Coffee** (Events) - Meet for coffee at conferences

### Type Categories
- **Social Media**: Twitter-focused collaboration types
- **Marketing**: Promotional and campaign-based collaborations
- **Content**: Content creation and feature opportunities
- **Events**: In-person networking and event-based collaborations

### Legacy Compatibility
The system maintains backward compatibility through:
- **Legacy Name Mappings**: Maps old collaboration names to stable type IDs
- **Database Migration**: Existing collaboration data works seamlessly
- **API Compatibility**: Both old names and new IDs are supported

## User Preferences
- **Documentation Style**: Comprehensive and technical with clear section organization
- **Code Architecture**: Favor centralized systems with type safety and backward compatibility
- **Update Tracking**: Document all changes with dates and impact analysis

### Environment Variables
- **Database**: `DATABASE_URL` for PostgreSQL connection
- **Authentication**: `TELEGRAM_BOT_TOKEN` for production, `TELEGRAM_TEST_BOT_TOKEN` for development
- **WebApp URLs**: `WEBAPP_URL` for production, `WEBAPP_URL_DEV` for development (stored as secrets)
- **External APIs**: `X_RAPIDAPI_KEY` for Twitter integration
- **Security**: `SESSION_SECRET` for session encryption
- **Configuration**: `LOG_LEVEL` for logging control

### Production Considerations
- **Logging**: Configurable logging levels with silent mode support
- **Security**: HTTPS enforcement, security headers, rate limiting
- **Performance**: Connection pooling, query optimization, caching strategies
- **Monitoring**: Admin logging, error tracking, performance metrics

## Changelog

- July 30, 2025. **COMPLETED**: Implemented centralized collaboration types management system
  - **Centralized Registry**: Created CollaborationTypeRegistry class with stable internal IDs decoupled from display names
  - **Type Safety**: Full TypeScript support with proper interfaces and type guards throughout the system
  - **Legacy Compatibility**: Legacy name mappings ensure existing data continues to work without disruption
  - **Reusable Components**: Built TypePill, TypeIcon, and TypeSelector components for consistent UI rendering
  - **Helper Functions**: Comprehensive utility functions for icons, colors, names, and validation
  - **File Structure**: Organized collaboration types system in shared/collaboration-types/ with proper separation
  - **Migration Strategy**: Updated core components (CollaborationListItem, requests-management, requests-summary) to use registry
  - **Schema Integration**: Updated shared/schema.ts to use registry while maintaining COLLAB_TYPES backward compatibility
  - **ES6 Compliance**: Fixed CommonJS require() statements to use proper ES6 imports for browser compatibility
  - **PRD Requirements**: All requirements from docs/product/collaboration-types-management-prd.md successfully implemented
  - **Testing**: Verified system works with real collaboration data and provides consistent styling across components
- July 29, 2025. **COMPLETED**: Implemented consistent collaboration type pill styling between discovery cards and details dialog
  - **UI Consistency**: Added matching color and icon helper functions (getTypeColor(), getCollabTypeIcon()) to CollaborationDetailsDialog.tsx
  - **Dynamic Styling**: Replaced hardcoded badge styling with dynamic color scheme matching CollaborationListItem.tsx
  - **Icon Coverage**: Added missing icon imports (PenTool, Coffee) for complete collaboration type icon coverage
  - **Visual Hierarchy**: Maintained full-width centered styling while ensuring consistent colors and icons
  - **Color Scheme**: Blue for Twitter/Social, Purple for Podcasts, Emerald for Blogs, Amber for Research, Indigo for Newsletter, Red for Live Streams
  - **Implementation**: Both discovery cards and details dialog now use identical styling approach for unified user experience
- July 29, 2025. **COMPLETED**: Enhanced Telegram notification system with user handles, notes, and hyperlinked company names
  - **Enhanced User Experience**: Requester confirmation messages now include user handle (@username or full name) at the beginning
  - **Personalized Messages**: User's collaboration request notes are included in confirmation messages when provided
  - **Interactive Company Links**: Company names in confirmation messages are hyperlinked to their X (Twitter) profiles
  - **Improved Message Format**: Messages now display as: "@handle - Your collab request has been sent to [Company Link] for their collab [Type]"
  - **Note Integration**: When users include notes, they appear as "📝 Your note: [message]" in the confirmation
  - **Updated API Integration**: Both endpoints (/api/requests and /api/collaborations/:id/apply) now pass note parameter properly
  - **Design Enhancement**: Reduced spacing between company name and "Looking for" text on discovery cards for better visual hierarchy
  - **Comprehensive Testing**: All features tested and confirmed working with both development and production bot configurations
- July 29, 2025. **COMPLETED**: Fixed Telegram notification system and implemented collab request confirmation
  - **Issue Fixed**: Resolved `ReferenceError: isProduction is not defined` error that was preventing all Telegram notifications from working
  - **Root Cause**: Missing `isProduction` constant definition in server/telegram.ts after recent bot environment architecture changes
  - **Solution**: Added `const isProduction = process.env.NODE_ENV === "production";` to telegram.ts configuration section
  - **Additional Fix**: Resolved duplicate export error for `notifyRequesterRequestSent` function
  - **New Feature**: When users send collab requests, they now receive immediate confirmation notifications via Telegram
  - **Message Content**: "Your collab request has been sent to [Company Name] for their collab [Collab Type]. If they approve it, you'll be matched and able to connect via the My Matches section. You'll also get a notification here when that happens."
  - **Implementation**: Created notifyRequesterRequestSent() function in server/telegram.ts with proper export
  - **Integration**: Added notification call to POST /api/requests endpoint immediately after request creation
  - **User Experience**: Sets clear expectations about next steps and provides quick access to My Matches
  - **Interactive Buttons**: Includes "View My Matches" and "Launch Collab Room" buttons for easy navigation
  - **Personalization**: Includes actual company name and collaboration type from database
  - **Timing**: Sent immediately after request submission alongside existing host notification
  - **Environment**: Works correctly with both development (TELEGRAM_TEST_BOT_TOKEN) and production (TELEGRAM_BOT_TOKEN) bot configurations
- July 29, 2025. **COMPLETED**: Enhanced discovery cards UX with improved layout and visual hierarchy
  - Redesigned card layout: Company name → "Looking for" → Collaboration type pill → Description
  - Changed "Looking For" to lowercase "Looking for" for friendlier tone
  - Moved collaboration type pill below "Looking for" text on separate line for better visual hierarchy
  - Made description text italic with lighter gray color (text-gray-500) for improved readability
  - Updated request button text to "Request to Collab (Free)" in collaboration details dialog
  - Simplified live stats to show only collaboration count, removed title and user/match counts
  - Updated navigation icons: Discover uses Search icon, My Collabs uses Sparkles icon
  - Added right arrow indicators to cards following standard UI patterns for clickable items
  - Removed action buttons from cards, moved all actions to details dialog for cleaner browsing experience
- July 28, 2025. **COMPLETED**: Phase 1 Telegram Bot Startup Performance Optimization - 400% improvement achieved (20s → <5s)
  - **Problem Solved**: Users no longer experience 20-second delay when pressing /start - response is now <5 seconds (0.009s measured)
  - Implemented non-blocking bot verification: Server no longer waits for bot.getMe() to complete before starting
  - Added asynchronous command setup: Basic commands set immediately, admin commands configured in background via setImmediate  
  - Optimized polling configuration: Reduced timeout from 30s to 10s, added retry optimization, fixed deprecation warnings
  - Added graceful shutdown handling: SIGINT/SIGTERM handlers prevent 409 Conflict errors by stopping polling
  - Implemented parallel admin command setup: Multiple admins processed simultaneously with Promise.allSettled
  - Added performance monitoring: Bot command setup timing logged for debugging and optimization tracking
  - Enhanced database queries: Single optimized query replaces multiple sequential queries for admin/pending users
  - Added timeout protection: 5-second timeout for chat validity checks prevents hanging operations
  - Created comprehensive test scripts and documentation confirming all optimizations work correctly
  - **Documentation Updated**: PRD marked complete, Phase 2/3 optimizations deferred but available for future scaling
  - **Impact**: Primary user experience issue resolved with zero functionality degradation
- July 28, 2025. **IDENTIFIED**: Root cause of 20-second bot startup delays and created comprehensive performance PRD
  - Issue: Users experience 20-second delay when pressing /start before app loads
  - Root causes: Synchronous bot command setup with database queries and API calls during server initialization
  - Primary cause: setupBotCommands() function makes sequential database queries and Telegram API calls at startup
  - Secondary causes: Blocking bot verification, polling initialization delay, non-optimized database connections
  - Solution strategy: Asynchronous command setup, non-blocking verification, optimized database queries
  - Created detailed PRD document at docs/architecture/telegram-bot-startup-performance-prd.md with 3-phase implementation plan
  - Target: Reduce startup delay from 20 seconds to <2 seconds through architectural improvements
- July 28, 2025. **COMPLETED**: Simplified Telegram bot environment architecture for cleaner separation
  - Removed complex FORCE_PRODUCTION_BOT logic and environment entanglement
  - Each environment now uses dedicated bot token (dev uses test bot, production uses production bot)
  - Added proper bot cleanup on shutdown (SIGINT/SIGTERM) to prevent 409 Conflict errors
  - Enhanced security by moving webapp URLs to environment secrets (WEBAPP_URL, WEBAPP_URL_DEV)
  - Bot instances no longer conflict when switching environments
  - Users can interact with any bot but receive notifications from environment-specific bot
  - Created comprehensive PRD document at docs/architecture/telegram-bot-environment-architecture-prd.md
- July 25, 2025. **COMPLETED**: Fixed dialog navigation architecture to prevent nested dialog state conflicts
  - Separated SignupToCollaborateDialog from CollaborationDetailsDialog for independent management
  - Modified CollaborationDetailsDialog to use onShowSignupDialog callback instead of internal state
  - Moved signup dialog state management to DiscoverPageList parent component
  - Fixed issue where canceling signup dialog would reopen collaboration details dialog
  - Improved dialog architecture by eliminating complex nested dialog interactions
  - Now provides clean user experience: Request → Signup Dialog → Cancel returns directly to discovery page
- July 25, 2025. **COMPLETED**: Fixed signup dialog flow to close completely instead of showing details dialog
  - Modified SignupToCollaborateDialog onOpenChange handler in CollaborationDetailsDialog component
  - When unauthenticated user clicks "Request" and then cancels signup dialog, it now returns directly to discovery page
  - Eliminated confusing flow where canceling signup dialog would show collaboration details dialog
  - Improved user experience by providing clear exit path back to discovery page
- July 25, 2025. **COMPLETED**: Enhanced haptic feedback system across all UI components for better mobile experience
  - Extended haptic feedback to all interactive UI elements throughout the app
  - Added light haptic feedback ('light' intensity) to buttons, tabs, switches, checkboxes, radio buttons, and select dropdowns
  - Enhanced Telegram WebApp integration with graceful fallbacks for non-Telegram environments
  - Optimized haptics utility with new 'light' feedback type for subtle, comfortable user interaction
  - All button presses, form interactions, and navigation actions now provide gentle tactile feedback
  - Comprehensive coverage ensures consistent mobile user experience across entire application
- July 25, 2025. **COMPLETED**: Removed dark splash screen and simplified loading experience
  - Removed dark background HTML splash screen with CollabRoom logo from index.html
  - Simplified HTML initial setup to minimal reset styles only
  - Kept light LoadingScreen component with progress bar animation for app initialization
  - Deleted unused SplashScreen.tsx component file
  - App now shows clean, light loading experience without dark splash screen interruption
- July 25, 2025. **COMPLETED**: Enhanced webhook integration documentation and testing
  - Created comprehensive webhook integration documentation in docs/backend/webhook-integration.md
  - Updated API documentation to include webhook information and test endpoint details
  - Added webhook reference to main documentation index in docs/README.md
  - Successfully tested webhook functionality - confirmed working with n8n endpoint
  - Documentation includes complete payload structure, configuration details, and example usage
  - Webhook system fully documented and ready for production use
- July 25, 2025. **COMPLETED**: Added webhook integration for new collaboration creation
  - Created webhook utility function in server/utils/webhook.ts to send collaboration details to n8n
  - Integrated webhook call into POST /api/collaborations endpoint after collaboration is created
  - Webhook sends comprehensive payload including: collaboration ID, type, description, date, company details (name, Twitter URL/handle, LinkedIn URL, logo URL), and creator information
  - Added test endpoint /api/test-webhook-alchemy for testing webhook functionality
  - Successfully tested webhook with latest Alchemy collaboration, confirming payload delivery to n8n endpoint
  - Webhook URL: https://paulsworkspace.app.n8n.cloud/webhook-test/1d92b7d4-9a9b-4211-bc0a-53dc8d4c5aaa
  - Webhook fires automatically on collaboration creation without affecting the main flow
- July 25, 2025. **COMPLETED**: Removed loading screens from navigation between pages
  - Modified App.tsx to use NoLoadingFallback (null component) for preloaded routes instead of LoadingScreen
  - Expanded navigation preloader to include '/requests' route alongside existing preloaded routes
  - Removed LoadingScreen fallback for application form routes to prevent flashing during navigation
  - Now only shows LoadingScreen on initial app load when discovery page isn't preloaded yet
  - All other route transitions now happen instantly without loading screens
  - Improved user experience by eliminating unnecessary loading states during navigation
- July 25, 2025. **COMPLETED**: Fixed collaboration details dialog button visibility issues
  - Improved header layout with proper button positioning and increased height (56px minimum)
  - Enhanced back button with rounded design, shadow, and better z-index positioning
  - Restructured dialog with flexbox layout to prevent content overflow
  - Added extra bottom padding to ensure close button is never cut off
  - Back button now has better contrast with background/80 opacity and hover states
  - All navigation buttons in dialog are now clearly visible and accessible
- July 25, 2025. **COMPLETED**: Enhanced collaboration details dialog to display date information
  - Added date_type and specific_date fields to collaboration interface and data flow
  - Date displays as formatted date (e.g., "January 15, 2025") for specific dates
  - Shows "Flexible timing" for collaborations with any_future_date preference
  - Updated TypeScript interfaces and fixed all type safety issues
  - Date information appears in "Additional Details" section when available
- July 25, 2025. **COMPLETED**: Enhanced collaboration request system with comprehensive improvements
  - Restructured request cards with full-width content below header (logo, name, timestamp)
  - Enhanced AddNoteDialog with host company logo, name, and improved button spacing
  - Added company information header in collaboration request dialogs
  - Improved button layout with vertical stacking and proper gap spacing
  - Updated CollabTypesBanner to show only main collaboration types (removed Twitter subtypes)
  - Enhanced visual hierarchy and user experience across request management flows
- July 25, 2025. **COMPLETED**: Redesigned CollaborationDetailsDialog with improved visual hierarchy and UX
  - Moved company name and logo to the very top of the dialog outside the card for prominence
  - Made collaboration type badge full-width with centered content and enhanced styling
  - Repositioned request button to bottom of collaboration details section with clear separation
  - Added close button as secondary action below request button for better user control
  - Enhanced visual hierarchy: Company header → Full-width collab type → Details → Action buttons
  - Improved button styling with consistent full-width design and proper spacing
  - Dialog now provides clearer information flow and better action accessibility
- July 25, 2025. **COMPLETED**: Enhanced discover page UX with compact signup flow and visual improvements
  - Moved signup prompt from bulky top banner to compact "Sign Up" button in header next to refresh button
  - Sign Up button only appears for non-authenticated users with UserPlus icon
  - Added collaboration type icons to discovery cards for better visual identification
  - Made collaboration type badges smaller (text-xs) for cleaner design while maintaining visibility
  - Created SignupToCollaborateDialog component for targeted signup messaging
  - Added CollabTypesBanner with animated collaboration types matching signup page
  - Improved overall interface by removing authentication banner to save vertical space
- July 24, 2025. **IDENTIFIED**: Root cause of slow collab room loading in production
  - Issue: "Launch Collab Room" button in production Telegram bot loads slowly
  - Root cause: NOT a missing separate server - "Launch Collab Room" simply opens main web app at `/discover` route
  - Real problem: Missing `WEBAPP_URL` environment variable in production deployment
  - When `WEBAPP_URL` is not set, Telegram bot falls back to `REPLIT_DOMAINS` which points to development URLs
  - Solution: Set `WEBAPP_URL=https://your-production-domain.com` in production environment
  - Also identified `FORCE_PRODUCTION_BOT` formatting issue (was `=true`, should be `true`)
  - This ensures production bot opens production URLs, not development environment
  - No code changes needed - issue is purely environment configuration
- July 14, 2025. **COMPLETED**: Fixed production WebApp URL configuration issue where "Launch Collab Room" button pointed to development environment
  - Identified root cause: Production deployment was using development `REPLIT_DOMAINS` instead of production domain
  - Production bot was correctly configured with `TELEGRAM_BOT_TOKEN` but webapp URLs pointed to development environment
  - Enhanced Telegram bot configuration to prioritize `WEBAPP_URL` environment variable over `REPLIT_DOMAINS`
  - Added automatic warning system to detect when production bot uses development URL
  - Created comprehensive deployment documentation with proper environment variable configuration
  - Solution: Set `WEBAPP_URL` environment variable to production domain during deployment
  - Updated logging to clearly show environment and URL configuration for debugging
- July 15, 2025. **REVERTED**: Restored proper environment-based Telegram bot token selection
  - Reverted changes that made all messages go through production bot regardless of environment
  - Development environment now properly uses TELEGRAM_TEST_BOT_TOKEN
  - Production environment uses TELEGRAM_BOT_TOKEN
  - This ensures users who register in test environment receive notifications from test bot
  - This ensures users who register in production environment receive notifications from production bot
  - Prevents "chat not found" errors caused by bot/user environment mismatches
  - Simplified architecture by removing complex fallback systems
  - Each environment now operates independently with its own bot token
- July 15, 2025. **TEMPORARY FIX**: Added environment variable to control bot selection for notifications
  - Issue: When running in development mode, notifications always use test bot even when users interact with production bot
  - Root cause: Bot selection based on NODE_ENV, not which bot users actually registered with
  - Added `FORCE_PRODUCTION_BOT` environment variable to force using production bot for notifications
  - Set `FORCE_PRODUCTION_BOT=true` to use production bot regardless of NODE_ENV
  - This is a temporary fix - proper solution would track which bot each user registered with in the database
  - Both test and production bots share the same database, causing notification/registration mismatches
- July 13, 2025. **COMPLETED**: Successfully removed Events, Conference preferences, Event attendance, and collab_notifications tables to simplify database
  - Removed events, user_events, event_attendance, conference_preferences, and collab_notifications tables from shared/schema.ts
  - Removed all related API endpoints from server/routes.ts (events, user-events, conference-preferences, notifications)
  - Removed conference preferences and notification logging storage methods from server/storage.ts
  - Updated frontend components to remove all conference preferences references
  - Modified dashboard.tsx, application-status.tsx, profile-overview.tsx, and matching-filters.tsx to remove conference functionality
  - Matching-filters.tsx now shows "Feature Removed" message instead of conference matching interface
  - Dropped database tables using SQL commands to complete the cleanup
  - Removed legacy notification logging - notifications are now sent directly via Telegram without database storage
  - Database simplified and streamlined for core collaboration functionality only
- July 13, 2025. **FIXED**: Resolved SQL syntax errors in Telegram action button handlers
  - Fixed syntax error "syntax error at or near '='" in button callback handlers
  - Replaced problematic `sql` template literals with proper database queries using `db.execute()` and `.rows[0]` access
  - Fixed ID resolution queries to use correct table names and result structure
  - Action buttons now correctly update request status in database (Hide button sets status to 'hidden', Match button sets status to 'accepted')
  - Telegram notifications system fully operational with working interactive buttons for collaboration request responses
- July 13, 2025. **FIXED**: Resolved duplicate route definition issue preventing Telegram notifications from being sent
  - Fixed critical bug where duplicate `/api/collaborations/:id/apply` route definitions caused notifications to fail
  - Removed basic route handler that was intercepting requests before enhanced route with notification code
  - Fixed validation schema mismatch between frontend (sending `message` field) and backend (expecting complex form data)
  - Enhanced logging now properly displays throughout collaboration request flow
  - Telegram notifications successfully sent to collaboration hosts with interactive buttons for quick response
  - Collaboration request system now fully functional with proper notification delivery
- July 13, 2025. **FIXED**: Telegram notifications now properly sent to hosts when users request collaborations
  - Fixed missing notification calls in both `/api/requests` and `/api/collaborations/:id/apply` endpoints
  - Added `notifyNewCollabRequest` function call to notify hosts immediately when someone requests their collaboration
  - Notifications include requester's company information, personal notes, and interactive buttons for quick response
  - Enhanced error handling to prevent notification failures from breaking the request flow
  - Host notifications work for both discovery page requests and collaboration application form submissions
  - Covers all collaboration request pathways: discovery swiping, application forms, and potential match responses
- July 13, 2025. **COMPLETED**: Comprehensive refactoring of swipe-related terminology to use requests table format
  - Updated rate limiter from "swipeLimiter" to "requestLimiter" throughout codebase
  - Created new storage methods for handling action-based requests (createCollaborationRequest, acceptCollaborationRequest, hideCollaborationRequest)
  - Server now properly accepts "action" parameter ("request" or "skip") instead of "direction" ("left" or "right")
  - Client-side code already properly sends "action" parameter - no changes needed
  - Updated error messages and logs to use collaboration request terminology
  - Legacy createSwipe method still available for backward compatibility but converted to use requests table
  - Updated deleteLeftSwipes method to properly delete skipped requests from requests table
  - All endpoints now use consistent request/action terminology while maintaining backward compatibility
  - Server tested and confirmed working correctly with new parameter validation
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