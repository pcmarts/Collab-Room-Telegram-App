# Contributing to The Collab Room

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL (local or remote)
- A Telegram bot token (for testing auth flows)

### Getting Started

1. **Fork and clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/collab-room.git
cd collab-room
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment**

```bash
cp .env.example .env
```

Edit `.env` with your local configuration. At minimum, you need:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Any 32+ character string for development
- `TELEGRAM_BOT_TOKEN` - Your test bot token

4. **Set up the database**

```bash
# Push schema to database
npm run db:push
```

5. **Start development server**

```bash
npm run dev
```

The app runs at `http://localhost:5000`.

## Project Structure

```
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and helpers
│   │   └── contexts/       # React contexts
│   └── index.html
│
├── server/                 # Express backend
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database access layer
│   ├── index.ts            # Server entry point
│   └── vite.ts             # Vite integration (don't modify)
│
├── shared/                 # Shared between frontend/backend
│   ├── schema.ts           # Drizzle database schema
│   ├── config.ts           # Configuration validation
│   └── collaboration-types/ # Type definitions
│
└── docs/                   # Documentation
```

## Code Style

### TypeScript

- Use TypeScript for all new code
- Define types in `shared/schema.ts` for database models
- Use Zod for runtime validation

### React Components

- Use functional components with hooks
- Use shadcn/ui components from `@/components/ui`
- Follow existing patterns for forms and data fetching

### API Routes

- Keep routes thin - business logic goes in storage layer
- Validate request bodies with Zod schemas
- Return consistent error responses

### Database

- Define schema in `shared/schema.ts` using Drizzle
- Run `npm run db:generate` after schema changes
- Never commit migrations with sensitive data

## Making Changes

### Branching Strategy

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add podcast collaboration type
fix: resolve match notification timing issue
docs: update API documentation
refactor: simplify discovery filtering logic
```

### Testing

Before submitting a PR:

1. Ensure the app runs without errors
2. Test the features you've changed
3. Check for TypeScript errors: `npm run check`

### Pull Requests

1. Update documentation if needed
2. Describe your changes clearly
3. Link any related issues
4. Ensure CI checks pass

## Database Migrations

### Development

For quick iteration during development:

```bash
# Push schema changes directly
npm run db:push
```

### Production

For production deployments:

```bash
# Generate a migration file
npm run db:generate

# Review the generated migration in drizzle/

# Apply migrations
npm run db:migrate
```

## Environment Variables

- Never commit `.env` files
- Update `.env.example` when adding new variables
- Use `VITE_` prefix for frontend-accessible variables
- Document all new variables in README.md

## Common Tasks

### Adding a New Page

1. Create component in `client/src/pages/`
2. Add route in `client/src/App.tsx`
3. Add navigation link if needed

### Adding an API Endpoint

1. Add route in `server/routes.ts`
2. Add storage method in `server/storage.ts`
3. Define types in `shared/schema.ts`

### Adding a Database Table

1. Define schema in `shared/schema.ts`
2. Create insert/select types
3. Run `npm run db:push` or generate migration
4. Add CRUD methods to `server/storage.ts`

## Troubleshooting

### Common Issues

**Port 5000 already in use**
```bash
lsof -i :5000  # Find process
kill -9 <PID>  # Kill it
```

**Database connection errors**
- Check DATABASE_URL format
- Ensure PostgreSQL is running
- Verify credentials

**Telegram auth not working**
- Ensure WEBAPP_URL is accessible
- Check bot token is correct
- Use ngrok for local testing with Telegram

## Getting Help

- Check [docs/troubleshooting](./docs/troubleshooting/README.md)
- Open an issue for bugs
- Discuss features in discussions

## Code of Conduct

Be respectful and inclusive. We're all here to build something great together.
