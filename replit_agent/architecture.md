# Architecture Overview

## Overview

CollabRoom is a web application that facilitates collaboration between Web3/crypto companies. It's built as a Telegram mini-app that allows users to create profiles, manage company information, discover collaboration opportunities, and participate in marketing collaborations and conference networking.

The application follows a modern web architecture with a clear separation between frontend and backend components. It uses TypeScript throughout the stack for type safety and employs a PostgreSQL database for data persistence.

## System Architecture

The system follows a client-server architecture with the following high-level components:

1. **Frontend**: React-based single-page application (SPA) built with Vite
2. **Backend**: Node.js server using Express
3. **Database**: PostgreSQL database with Drizzle ORM for schema management
4. **External Integrations**: Telegram Bot API, Supabase

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│               │     │               │     │               │
│   Frontend    │────►│   Backend     │────►│   Database    │
│   (React)     │     │   (Express)   │     │ (PostgreSQL)  │
│               │     │               │     │               │
└───────────────┘     └───────────────┘     └───────────────┘
                             │
                             │
                             ▼
                      ┌───────────────┐
                      │  External     │
                      │  Services     │
                      │ (Telegram,    │
                      │  Supabase)    │
                      └───────────────┘
```

## Key Components

### Frontend

The frontend is built with React and uses the following key technologies and patterns:

- **React**: Core UI library
- **Vite**: Build tool and development server
- **TanStack Query (React Query)**: Data fetching and state management
- **Wouter**: Lightweight routing library
- **React Hook Form + Zod**: Form handling with schema validation
- **Shadcn UI**: Component library based on Radix UI
- **Tailwind CSS**: Utility-first CSS framework

The application follows a page-based architecture with the main pages including:
- Dashboard
- Profile management
- Collaboration creation and management
- Marketing collaboration discovery
- Conference networking

### Backend

The backend is built with Node.js and Express and uses the following technologies:

- **Express**: Web framework for handling HTTP requests
- **Drizzle ORM**: SQL toolkit and ORM
- **Zod**: Schema validation
- **Telegram Bot API**: Integration with Telegram for user authentication and messaging

The server follows a modular structure with:
- Route handlers for API endpoints
- Database adapter layer
- External service integrations (Telegram, Supabase)

### Database

The database is a PostgreSQL instance with the following main tables:

- **users**: Store user information
- **companies**: Company profiles associated with users
- **collaborations**: Collaboration opportunities
- **collab_applications**: Applications to collaborations
- **notification_preferences**: User notification settings
- **marketing_preferences**: Marketing collaboration preferences
- **conference_preferences**: Conference networking preferences
- **events**: Conference events
- **user_events**: Mapping of users to events they're attending

The schema uses UUID primary keys and maintains relationships through foreign keys.

## Data Flow

### Authentication Flow

1. Users access the application through Telegram
2. Telegram provides initial user data via WebApp API
3. The server validates the Telegram data
4. If the user doesn't exist, they're prompted to complete registration
5. Once authenticated, the user is given access to the application

### Collaboration Creation Flow

1. User creates a new collaboration opportunity specifying details like type, audience, topics
2. Server validates the data and stores it in the database
3. The collaboration becomes visible to other users based on their preferences

### Collaboration Discovery and Application Flow

1. Users see collaborations matching their preferences
2. Users can apply to participate in collaborations
3. Collaboration creators review and approve/reject applications
4. Notifications are sent based on user preferences

## External Dependencies

The application relies on the following external services:

1. **Telegram Bot API**: Used for authentication and notifications
2. **Supabase**: Appears to be used for additional storage or authentication
3. **Neon Database**: Serverless PostgreSQL provider
4. **Replit**: Development and hosting environment

## Deployment Strategy

The application is deployed on Replit with the following configuration:

- The build process uses Vite to bundle the frontend and esbuild for the server
- The application is configured to run on Cloud Run (Google Cloud Platform)
- Port 5000 is used for the local development server
- Environment variables are used for configuration (DATABASE_URL, TELEGRAM_BOT_TOKEN, etc.)

The deployment flow is as follows:
1. Code is pushed to the repository
2. Build process runs (`npm run build`)
3. The server is started (`npm run start`)
4. The application is accessible through the configured port

## Database Migration Strategy

The application uses Drizzle ORM's migration tools to manage database schema changes:

1. Schema is defined in TypeScript in the `shared/schema.ts` file
2. The `drizzle-kit` tool is used to generate and apply migrations
3. Migration scripts exist to handle specific migrations (e.g., adding columns)

## Development Workflow

The development setup includes:

1. A dev server that watches for changes and rebuilds as needed
2. TypeScript for type checking
3. ESLint for code quality
4. Integration with Replit's workflow tools

The development workflow is optimized for Replit, with configuration for both local development and production deployment.