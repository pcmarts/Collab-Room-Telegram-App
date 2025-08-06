# The Collab Room - Replit Development Guide

## Overview
The Collab Room is a Web3 professional networking platform designed to intelligently connect professionals. It facilitates various marketing collaborations, including Twitter campaigns, podcast appearances, live streams, research features, newsletter placements, blog posts, and networking events. The platform aims to be production-ready, featuring active collaboration matching, request management, and Telegram integration.

## User Preferences
Preferred communication style: Simple, everyday language.

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
- **Collaboration Type System**: Centralized registry with metadata, icons, colors, categories (Social Media, Marketing, Content, Events), and legacy compatibility.
- **User & Company Management**: Professional profiles (Twitter/LinkedIn integration), detailed company info (logos, funding, blockchain networks), granular marketing and notification preferences.
- **Authentication**: Telegram WebApp initData validation, Express sessions with PostgreSQL storage.
- **Discovery**: Card-based (transitioning to list view), multi-parameter filtering, cursor-based pagination, bidirectional swipe matching.
- **Collaboration Management**: Form-based creation, 7 predefined types, lifecycle management, application tracking.
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