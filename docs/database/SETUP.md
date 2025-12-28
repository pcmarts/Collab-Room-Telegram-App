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

### Quick Setup (Development)

Push the schema directly to your database:

```bash
npm run db:push
```

This is fast but doesn't create migration files.

### Production Setup

Generate and apply migrations:

```bash
# Generate migration files from schema
npm run db:generate

# Apply pending migrations
npm run db:migrate
```

### View Database

Use Drizzle Studio to browse your data:

```bash
npm run db:studio
```

Opens at `https://local.drizzle.studio`

## Schema Structure

The database schema is defined in `shared/schema.ts`. Main tables:

### Users
```typescript
users: {
  id: uuid (primary key)
  telegram_id: text (unique)
  telegram_username: text
  first_name: text
  last_name: text
  role: text
  company_id: uuid (foreign key)
  // ... preferences and settings
}
```

### Companies
```typescript
companies: {
  id: uuid (primary key)
  name: text
  description: text
  logo_url: text
  website: text
  twitter_handle: text
  // ... company details
}
```

### Collaborations
```typescript
collaborations: {
  id: uuid (primary key)
  creator_id: uuid (foreign key -> users)
  collab_type: text
  status: text
  description: text
  topics: text[]
  // ... collaboration details
}
```

### Swipes & Matches
```typescript
swipes: {
  id: uuid (primary key)
  user_id: uuid
  collaboration_id: uuid
  direction: text ('left' | 'right')
}

matches: {
  id: uuid (primary key)
  requester_id: uuid
  owner_id: uuid
  collaboration_id: uuid
  status: text
}
```

## Making Schema Changes

1. **Edit the schema** in `shared/schema.ts`

2. **Generate migration**:
   ```bash
   npm run db:generate
   ```

3. **Review** the generated SQL in `drizzle/` folder

4. **Apply migration**:
   ```bash
   npm run db:migrate
   ```

## Common Commands

```bash
# Push schema (dev only)
npm run db:push

# Generate migrations
npm run db:generate

# Apply migrations
npm run db:migrate

# Open database GUI
npm run db:studio
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

### Migration Conflicts

If migrations are out of sync:
```bash
# Drop and recreate (DESTROYS DATA - dev only!)
npm run db:push --force
```

## Seeding Data

For development, you can seed sample data:

```bash
# Run seed script (if available)
npm run db:seed
```

Or manually insert via Drizzle Studio.

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
