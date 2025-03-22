# Application Architecture

## Overview

Collab Room follows a modern web application architecture with a clear separation between the frontend and backend components. The application is designed to be mobile-first and responsive, with a focus on providing a seamless user experience.

## High-Level Architecture

```
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │     │                   │
│  Client (React)   │◄───►│  Server (Express) │◄───►│  Database (PostgreSQL) │
│                   │     │                   │     │                   │
└───────────────────┘     └───────────────────┘     └───────────────────┘
        ▲                          ▲
        │                          │
        │                          │
        │                          │
        ▼                          ▼
┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │
│  Telegram WebApp  │     │   External APIs   │
│                   │     │                   │
└───────────────────┘     └───────────────────┘
```

## Client-Side Architecture

The client-side is built using React and TypeScript, with a focus on component reusability and maintainability. The application uses a number of libraries and tools to provide a rich user experience:

- **React**: Core library for building the user interface
- **TypeScript**: For type safety and improved developer experience
- **Shadcn/ui**: Component library for consistent UI design
- **Tailwind CSS**: Utility-first CSS framework for styling
- **React Query**: For data fetching, caching, and state management
- **Wouter**: Lightweight routing library
- **Framer Motion**: For animations and transitions
- **Zod**: For schema validation

The client application is organized into the following main directories:

- `client/src/components`: Reusable UI components
- `client/src/pages`: Page components that represent different routes
- `client/src/hooks`: Custom React hooks
- `client/src/lib`: Utility functions and libraries
- `client/src/types`: TypeScript type definitions
- `client/src/context`: React context providers

## Server-Side Architecture

The server-side is built using Node.js and Express, with a focus on providing a clean and efficient API for the client. The server is responsible for handling authentication, data persistence, and business logic.

Key components:

- **Express**: Web framework for building the API
- **Drizzle ORM**: For database interactions
- **PostgreSQL**: Relational database for data storage
- **Express Session**: For session management
- **Telegram Bot API**: For user authentication and notifications

The server application is organized into the following main directories:

- `server/routes.ts`: API routes definition
- `server/storage.ts`: Data access layer
- `server/db.ts`: Database connection and configuration
- `server/telegram.ts`: Telegram integration
- `server/vite.ts`: Development server integration

## Data Flow

1. **Authentication**: Users authenticate with Telegram, which provides user information to the application
2. **Data fetching**: The client uses React Query to fetch data from the server
3. **State management**: The client uses React Query's cache and local state to manage application state
4. **API communication**: The client communicates with the server using RESTful API endpoints
5. **Database persistence**: The server persists data to the PostgreSQL database using Drizzle ORM

## Shared Code

The application uses a shared codebase for type definitions and schema validation, ensuring consistency between the client and server:

- `shared/schema.ts`: Database schema definitions and Zod schemas
- `shared/supabase.ts`: Supabase client configuration (for future integration)

## Integration Points

- **Telegram WebApp**: For authentication and user information
- **PostgreSQL**: For data persistence
- **Blockchain Networks**: For Web3 integration