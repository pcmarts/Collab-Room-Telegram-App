# Database Setup Guide

This guide explains how to set up the PostgreSQL database for The Collab Room.

## Overview

The Collab Room uses PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/) for database management. This gives you:

- Type-safe database queries
- Easy schema migrations
- Support for any PostgreSQL provider

## Prerequisites

- PostgreSQL 14+ (any provider)
- Node.js 18+

## Database Providers

### Local PostgreSQL

For local development:

```bash
# macOS (Homebrew)
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt-get install postgresql

# Create database
createdb collabroom
```

Set your connection string:
```env
DATABASE_URL=postgres://localhost:5432/collabroom
```

### Managed Providers

Any PostgreSQL provider works. Popular options:

| Provider | Best For | Free Tier |
|----------|----------|-----------|
| [Neon](https://neon.tech) | Serverless, branching | 512MB |
| [Supabase](https://supabase.com) | Full backend suite | 500MB |
| [Railway](https://railway.app) | Simple deployment | $5/month |
| [PlanetScale](https://planetscale.com) | MySQL (not recommended) | N/A |
| [AWS RDS](https://aws.amazon.com/rds/) | Enterprise | N/A |

## Schema Setup

### Setup

Push the schema directly to your database:

```bash
npm run db:push
```

`drizzle-kit push` diffs `shared/schema.ts` against the live database and applies the necessary `ALTER`s. This project currently uses push-based workflow only — there are no migration files checked in.

### View Database

`drizzle-kit` ships Drizzle Studio; you can run it directly:

```bash
npx drizzle-kit studio
```

Opens at `https://local.drizzle.studio`.

## Schema Structure

The database schema is defined in `shared/schema.ts`. Main tables:

### Users
```typescript
users: {
  id: uuid (primary key)
  telegram_id: text (unique, not null)
  handle: text                  // Telegram username if any
  first_name: text (not null)
  last_name: text
  email: text
  linkedin_url: text
  twitter_url: text
  twitter_followers: text
  referral_code: text
  referred_by: uuid             // self-reference to users.id
  applied_at: timestamp
  // ... other profile fields
}
```

### Companies
```typescript
companies: {
  id: uuid (primary key)
  user_id: uuid (foreign key -> users, unique)   // one company per user
  name: text (not null)
  job_title: text (not null)
  website: text (not null)
  logo_url: text
  twitter_handle: text
  twitter_followers: text
  linkedin_url: text
  funding_stage: text
  has_token: boolean
  token_ticker: text
  blockchain_networks: text[]
  tags: text[]
  short_description: text
  long_description: text
}
```

### Collaborations
```typescript
collaborations: {
  id: uuid (primary key)
  creator_id: uuid (foreign key -> users)
  collab_type: text (not null)
  status: text (default 'active')
  title: text
  description: text
  has_compensation: boolean
  compensation_details: text
  additional_requirements: text
  topics: text[]
  date_type: text ('any_future_date' | 'specific_date')
  specific_date: text             // YYYY-MM-DD
  details: jsonb (not null)       // type-specific fields per collab_type
  // ... filter criteria for matching
}
```

### Requests (unified table)

The app previously used separate `swipes` and `matches` tables. Both were merged
into a single `requests` table — a row represents a user asking to join a
collaboration and the host's response.

```typescript
requests: {
  id: uuid (primary key)
  collaboration_id: uuid (foreign key -> collaborations)
  requester_id: uuid (foreign key -> users)
  host_id: uuid (foreign key -> users)
  status: text           // 'pending' | 'accepted' | 'hidden' | 'skipped'
  note: text
  created_at: timestamp
}
```

An accepted request is conceptually a "match" — the legacy `createMatch`
helper in `server/storage.ts` wraps accepted-request lookups.

### Collab applications
```typescript
collab_applications: {
  id: uuid (primary key)
  collaboration_id: uuid (foreign key -> collaborations)
  applicant_id: uuid (foreign key -> users)
  status: text (default 'pending')
  details: jsonb (not null)
}
```

## Making Schema Changes

1. **Edit the schema** in `shared/schema.ts`.
2. **Push** to the live database:
   ```bash
   npm run db:push
   ```
3. `drizzle-kit` prints the proposed SQL before running it. Review and confirm.

Migration-file workflow (`db:generate` + `db:migrate`) is not currently configured in `package.json` — if you need auditable migrations, add those scripts and the `drizzle/` migration folder.

## Common Commands

```bash
# Push schema to database
npm run db:push

# Open database GUI
npx drizzle-kit studio
```

## Troubleshooting

### Connection Refused

Check that PostgreSQL is running:
```bash
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql
```

### Permission Denied

Ensure your user has database access:
```sql
GRANT ALL PRIVILEGES ON DATABASE collabroom TO your_user;
```

### SSL Required

Some providers require SSL. Add to your connection string:
```
?sslmode=require
```

### Schema Drift

If `db:push` reports a conflict it can't resolve automatically (e.g., dropping a column with data, or renaming that looks like drop+add), it will prompt or require a flag. When in doubt, back up first:

```bash
pg_dump DATABASE_URL > backup.sql
```

## Seeding Data

There is no seed script in this repo. For development, insert sample rows manually via Drizzle Studio or `psql`.

## Backups

### Manual Backup
```bash
pg_dump DATABASE_URL > backup.sql
```

### Restore
```bash
psql DATABASE_URL < backup.sql
```

Most managed providers offer automatic backups.
