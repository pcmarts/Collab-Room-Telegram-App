# The Collab Room

A professional networking platform for Web3 marketers, enabling collaboration discovery and matching through Telegram integration.

## Features

- **Discovery Feed**: Swipeable cards showing collaboration opportunities
- **Matching System**: Intelligent matching based on user preferences
- **Collaboration Creation**: Create various types of collaboration opportunities (podcasts, Twitter spaces, newsletters, etc.)
- **Telegram Integration**: Seamless login and notifications via Telegram bot
- **Twitter Integration**: Fetch company data and engagement metrics

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Telegram WebApp integration
- **Storage**: Supabase (optional, for company logos)

See the [Architecture Overview](./docs/ARCHITECTURE.md) for system design and data flow diagrams.

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Telegram Bot (create via [@BotFather](https://t.me/BotFather))

### 1. Clone and Install

```bash
git clone https://github.com/your-username/collab-room.git
cd collab-room
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required
DATABASE_URL=postgres://user:password@localhost:5432/collabroom
SESSION_SECRET=your-32-character-secret-here
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
WEBAPP_URL=https://your-domain.com

# Optional (for image storage)
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-key
```

### 3. Setup Database

```bash
# Generate and run migrations
npm run db:generate
npm run db:migrate

# Or push schema directly (for development)
npm run db:push
```

### 4. Run the Application

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

The app will be available at `http://localhost:5000`.

## Database Setup

The app uses PostgreSQL with Drizzle ORM. You can use any PostgreSQL provider:

### Option 1: Local PostgreSQL

```bash
# Install PostgreSQL locally
# Create a database
createdb collabroom

# Set DATABASE_URL in .env
DATABASE_URL=postgres://localhost:5432/collabroom
```

### Option 2: Managed PostgreSQL (Recommended for Production)

Supported providers:
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [Supabase](https://supabase.com) - PostgreSQL with extras
- [Railway](https://railway.app) - Simple deployment
- [AWS RDS](https://aws.amazon.com/rds/) - Enterprise-grade

### Schema Management

```bash
# Generate migrations from schema changes
npm run db:generate

# Apply migrations
npm run db:migrate

# Push schema directly (development only)
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## Telegram Bot Setup

See the complete [Telegram Setup Guide](./docs/TELEGRAM_SETUP.md) for step-by-step instructions.

Quick overview:
1. Create a bot with [@BotFather](https://t.me/BotFather)
2. Get your bot token and save it as `TELEGRAM_BOT_TOKEN`
3. Configure the WebApp menu button to point to your deployed URL
4. Set `WEBAPP_URL` to your production domain

## Image Storage (Optional)

Company logos can be stored in Supabase Storage:

1. Create a Supabase project
2. Create a public bucket named `logos`
3. Configure environment:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your-service-key
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_STORAGE_BUCKET=logos
   ```

Alternatively, you can use any S3-compatible storage by modifying `shared/utils/image-url.ts`.

## Project Structure

```
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Route pages
│   │   ├── hooks/        # Custom hooks
│   │   └── lib/          # Utilities
├── server/               # Express backend
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data access layer
│   └── index.ts          # Server entry
├── shared/               # Shared code
│   ├── schema.ts         # Database schema
│   └── config.ts         # Configuration
└── docs/                 # Documentation
```

## API Endpoints

### Authentication
- `GET /api/auth/telegram` - Telegram authentication callback

### Users
- `GET /api/users/:id` - Get user profile
- `PATCH /api/users/:id` - Update user profile

### Collaborations
- `GET /api/collaborations` - List collaborations
- `POST /api/collaborations` - Create collaboration
- `GET /api/collaborations/:id` - Get collaboration details

### Discovery
- `GET /api/discover` - Get discovery feed
- `POST /api/swipe` - Record swipe action

### Matches
- `GET /api/matches` - Get user matches
- `GET /api/matches/:id` - Get match details

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Session encryption key (32+ chars) |
| `TELEGRAM_BOT_TOKEN` | Yes | Telegram bot token |
| `WEBAPP_URL` | Yes | Production URL for Telegram WebApp |
| `SUPABASE_URL` | No | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | No | Supabase service key |
| `VITE_SUPABASE_URL` | No | Supabase URL (frontend) |
| `X_RAPIDAPI_KEY` | No | RapidAPI key for Twitter data |
| `LOG_LEVEL` | No | Logging level (0-4) |

See `.env.example` for all configuration options.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md) - System design and data flow
- [Telegram Setup](./docs/TELEGRAM_SETUP.md) - Bot configuration guide
- [Database Setup](./docs/database/SETUP.md) - Database configuration and migrations
- [Contributing](./CONTRIBUTING.md) - Development guidelines
