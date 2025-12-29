# The Collab Room

**Find & Host Web3 Brand Collaborations.**

Collab on Twitter Spaces, podcasts, and co-marketing campaigns, right inside Telegram.

---

## Why Open Source?

After launching 57 marketing partnerships in two years, I built the tool I wish I had. Now I'm opening it up to the community.

**This isn't just code — it's a foundation.** The Collab Room solves a real problem for Web3 teams, but there's so much more it could become. New collaboration types, better matching algorithms, integrations with other platforms, mobile apps — the possibilities are endless.

I'm open-sourcing this because:

- **Builders build better together.** The best ideas come from people actually using the product.
- **Web3 is about community.** It only makes sense that a Web3 networking tool is built by the community.
- **Innovation needs iteration.** Fork it, improve it, make it your own. Build the version your community needs.

Whether you want to contribute a feature, fix a bug, spin up your own instance, or take it in an entirely new direction — this codebase is yours to build on.

**Let's make finding collaborations as easy as swiping right.**

> **Try it live:** [t.me/collab_Room_bot](https://t.me/collab_Room_bot) | **Learn more:** [collabroom.xyz](https://collabroom.xyz)

---

## What is The Collab Room?

The Collab Room is a professional networking platform for Web3 marketers. Think "Tinder for partnerships" — browse opportunities, request to join, and connect instantly via Telegram. No contact info is shared until both parties match.

### How It Works

1. **Browse Opportunities** — Scroll through live requests from verified Web3 brands. Filter by Twitter Spaces, podcasts, AMAs, newsletters, and more.

2. **Request to Join** — See a match? Tap to request. Your profile is sent to the host. No contact info shared until approved.

3. **Connect Instantly** — Once approved, a private Telegram chat opens automatically. Start planning immediately.

### Collaboration Types

| Type | Description |
|------|-------------|
| **Twitter Spaces** | Find guests or co-hosts for your next audio event |
| **Podcast Guest** | Get featured on top Web3 podcasts |
| **Newsletters** | Swap shoutouts in email blasts |
| **Co-Marketing** | Joint campaigns, giveaways & threads |
| **Research Reports** | Get featured in industry deep-dives |
| **Live Streams** | Join YouTube or Twitch panels |

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
# Push schema directly (recommended for development)
npm run db:push

# Or generate and run migrations
npm run db:generate
npm run db:migrate
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

## Telegram Bot Setup

See the complete [Telegram Setup Guide](./docs/TELEGRAM_SETUP.md) for step-by-step instructions.

Quick overview:
1. Create a bot with [@BotFather](https://t.me/BotFather)
2. Get your bot token and save it as `TELEGRAM_BOT_TOKEN`
3. Configure the WebApp menu button to point to your deployed URL
4. Set `WEBAPP_URL` to your production domain

## Database Options

The app uses PostgreSQL with Drizzle ORM. You can use any PostgreSQL provider:

**Local Development:**
```bash
createdb collabroom
DATABASE_URL=postgres://localhost:5432/collabroom
```

**Managed PostgreSQL (Recommended for Production):**
- [Neon](https://neon.tech) — Serverless PostgreSQL
- [Supabase](https://supabase.com) — PostgreSQL with extras
- [Railway](https://railway.app) — Simple deployment
- [AWS RDS](https://aws.amazon.com/rds/) — Enterprise-grade

See [Database Setup](./docs/database/SETUP.md) for detailed configuration.

## Image Storage (Optional)

Company logos can be stored in Supabase Storage:

1. Create a Supabase project
2. Create a public bucket named `logos`
3. Configure environment variables (see `.env.example`)

The app works without image storage — logos will fall back to initials.

## Project Structure

```
├── client/               # React frontend
│   └── src/
│       ├── components/   # UI components
│       ├── pages/        # Route pages
│       ├── hooks/        # Custom hooks
│       └── lib/          # Utilities
├── server/               # Express backend
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data access layer
│   └── index.ts          # Server entry
├── shared/               # Shared code
│   ├── schema.ts         # Database schema
│   └── config.ts         # Configuration
└── docs/                 # Documentation
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Session encryption key (32+ chars) |
| `TELEGRAM_BOT_TOKEN` | Yes | Telegram bot token from BotFather |
| `WEBAPP_URL` | Yes | Production URL for Telegram WebApp |
| `VITE_SUPABASE_URL` | No | Supabase project URL for logos |
| `SUPABASE_SERVICE_KEY` | No | Supabase service key |
| `X_RAPIDAPI_KEY` | No | RapidAPI key for Twitter data |
| `LOG_LEVEL` | No | Logging verbosity (0-4) |

See `.env.example` for all options with descriptions.

## Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md) — System design and data flow
- [Telegram Setup](./docs/TELEGRAM_SETUP.md) — Bot configuration guide
- [Database Setup](./docs/database/SETUP.md) — Database configuration and migrations
- [Contributing](./CONTRIBUTING.md) — Development guidelines

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines, coding standards, and how to submit pull requests.

## License

MIT License — see [LICENSE](./LICENSE) for details.

---

Built by [Paul Martin](https://twitter.com/paul_web3) | [Website](https://collabroom.xyz) | [Telegram Bot](https://t.me/collab_Room_bot)
