# The Collab Room

A Web3 professional networking platform for marketing collaborations via Telegram.

## Quick Start

```bash
cp .env.example .env
# Fill in DATABASE_URL, SESSION_SECRET, TELEGRAM_BOT_TOKEN
npm install
npm run db:push
npm run dev
```

## Project Structure

```
├── client/           # React frontend (Vite)
│   └── src/
│       ├── components/   # UI components
│       ├── pages/        # Route pages
│       ├── hooks/        # Custom hooks
│       └── lib/          # Utilities
├── server/           # Express backend
│   ├── routes.ts     # API routes
│   ├── storage.ts    # Database layer
│   └── index.ts      # Entry point
├── shared/           # Shared code
│   ├── schema.ts     # Drizzle schema
│   └── config.ts     # Configuration
├── public/           # Static assets
└── docs/             # Documentation
```

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Telegram WebApp integration

## Key Files

- `shared/schema.ts` - Database schema and types
- `server/routes.ts` - API endpoints
- `server/storage.ts` - Database queries
- `client/src/App.tsx` - Frontend routing

## Commands

```bash
npm run dev          # Start development server
npm run db:push      # Push schema to database
npm run db:generate  # Generate migrations
npm run db:studio    # Database GUI
```

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection
- `SESSION_SECRET` - Session encryption (32+ chars)
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `WEBAPP_URL` - Production URL

Optional:
- `VITE_SUPABASE_URL` - Supabase for image storage
- `X_RAPIDAPI_KEY` - Twitter API access

See `.env.example` for all options.
