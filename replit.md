# The Collab Room - Replit Development Guide

## Overview
The Collab Room is a Web3 professional networking platform designed to intelligently connect professionals. It facilitates various marketing collaborations, including Twitter campaigns, podcast appearances, live streams, research features, newsletter placements, blog posts, and networking events. The platform aims to be production-ready, featuring active collaboration matching, request management, and Telegram integration.

## User Preferences
Preferred communication style: Simple, everyday language.
UX preferences: Clean interfaces without excessive validation text, rely on UX rather than text guidance.

## System Architecture

### Frontend
- **Framework**: React with TypeScript
- **UI**: Shadcn/ui components (Radix UI primitives), TailwindCSS (light theme)
- **State Management**: TanStack React Query
- **Routing**: Wouter
- **Build**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **ORM**: Drizzle ORM (PostgreSQL)
- **Authentication**: Telegram WebApp integration, session fallback
- **API**: RESTful with error handling

### Database
- **Primary**: PostgreSQL (connection pooling, optimized indexing)
- **ORM**: Drizzle ORM (type-safe, Zod validation)
- **Schema Management**: Drizzle Kit (migrations)
- **Key Tables**: users, companies, collaborations, requests, marketing_preferences, notification_preferences
- **Advanced Features**: JSONB for collaboration details, array fields for tags/networks, GIN indexes

### Core Features
- **Collaboration Matching**: Intelligent discovery with filtering, comprehensive request handling, match analytics.
- **Collaboration Type System**: Centralized registry with metadata, icons, colors, categories (Social Media, Marketing, Content, Events), and legacy compatibility. Features CollaborationTypePill component for consistent type display.
- **User & Company Management**: Professional profiles (Twitter/LinkedIn integration), detailed company info (logos, funding, blockchain networks), granular marketing and notification preferences.
- **Authentication**: Telegram WebApp initData validation, Express sessions with PostgreSQL storage.
- **Discovery**: Card-based (transitioning to list view), multi-parameter filtering, cursor-based pagination, bidirectional swipe matching.
- **Collaboration Management**: Form-based creation with multi-step wizard, 7 predefined types, clean UX without cluttering validation text, lifecycle management, application tracking.
- **Notification System**: Real-time Telegram integration for request confirmations, host notifications, and match notifications.

## External Dependencies

### Core
- **Database**: PostgreSQL
- **Authentication**: Telegram Bot API
- **UI**: Radix UI, Shadcn/ui, TailwindCSS
- **State Management**: TanStack React Query
- **Form Handling**: React Hook Form, Zod
- **Icons**: Lucide React
- **Routing**: Wouter

### Advanced
- **Twitter Integration**: RapidAPI (Twitter241 service)
- **Object Storage**: Supabase (company logos)
- **Session Storage**: PostgreSQL-backed Express sessions

## Recent Changes (August 2025)

### Form UX Improvements
- **Validation Consistency**: Fixed critical validation bug where description field backend validation (200 chars) didn't match frontend limit (280 chars). Updated to consistently allow 280 characters across all components.
- **Clean Interface Design**: Removed cluttering validation text from Co-Marketing forms. Hidden "(min 1, max 3)" text, "0/3" selection counters, and red validation error messages to create cleaner user experience.
- **CollaborationTypePill Component**: Created reusable component displaying selected collaboration type with icon, colors, and short name in form headers.

### Architecture Updates
- **Type System Enhancement**: Improved collaboration type registry with flexible lookup and legacy compatibility.
- **Form Validation**: Unified validation approach using hideDetails prop in LimitedTopicSelector to control UI verbosity.
- **Component Consistency**: Enhanced StepContainer component to integrate collaboration type pills across all form steps.

### New Collab Broadcast Feature (Completed August 2025)
- **Implementation Complete**: Successfully implemented and deployed the `/broadcastcollab` command for admin-driven collaboration promotion via Telegram bot. Feature extends existing broadcast system with collaboration-specific targeting, smart CTA buttons, and automated request processing.

#### Feature Components:
- **Admin Command**: `/broadcastcollab` command with collaboration selection interface
- **Interactive Flow**: Multi-step workflow with collaboration selection → message composition → preview → confirmation
- **Smart CTA Buttons**: Context-aware buttons based on user relationship to collaboration:
  - Host users: "You are the host" informational button + "View More Collabs"
  - Already requested: "Request Already Sent" + "View Details" + "View More Collabs" 
  - Eligible users: "Request Collab" + "View Details" + "View More Collabs"
  - Inactive collaborations: Unavailable status + "View More Collabs"
- **Message Personalization**: Support for dynamic placeholders (first_name, last_name, company_name, role_title, handle)
- **Request Automation**: Direct collaboration requests through broadcast buttons with full validation
- **State Management**: Extended existing broadcast state system for collaboration-specific flows

#### Technical Implementation:
- **Enhanced Telegram Bot**: Added collaboration broadcast handlers in `server/telegram.ts`
- **Callback System**: New callback handlers for collaboration selection and request processing
- **Database Integration**: Leverages existing schemas (collaborations, requests, users, notification_preferences)
- **Schema Compatibility**: Updated legacy code to use `requests` table (replaced deprecated `matches` table)
- **Type Safety**: Full TypeScript implementation with proper error handling and null safety
- **Admin Logging**: Comprehensive logging for audit and debugging purposes

#### Deployment Status:
- **Production Ready**: Feature fully tested with all TypeScript errors resolved
- **Server Status**: Successfully running with no LSP diagnostics
- **Integration**: Seamlessly integrated with existing platform architecture

The feature is production-ready and ready for admin use through the Telegram bot interface.