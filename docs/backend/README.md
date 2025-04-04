# Backend Documentation

The backend of The Collab Room is built with Node.js and Express. This document provides an overview of the backend architecture, components, and design patterns.

## Technology Stack

- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **TypeScript**: Type-safe JavaScript
- **PostgreSQL**: Database
- **Drizzle ORM**: Database ORM
- **Zod**: Schema validation
- **Express Session**: Session management with PostgreSQL store
- **Telegram Bot API**: Bot integration
- **Custom Rate Limiting**: Protection against abuse
- **Security Headers**: Protection against common web vulnerabilities

## Server Structure

The backend code is organized in the `server` directory with the following structure:

- `index.ts`: Entry point and server setup
- `routes.ts`: API route definitions
- `storage.ts`: Data storage implementation
- `db.ts`: Database connection setup
- `telegram.ts`: Telegram bot implementation
- `vite.ts`: Development server integration
- `telegram/`: Telegram-related functionality

## Server Initialization

The server initialization process is defined in `index.ts`:

```typescript
// Initialize Express app
const app = express();

// Configure middleware
app.use(express.json());
app.use(corsMiddleware);
app.use(sessionMiddleware);

// Register routes
await registerRoutes(app);

// Set up Vite for development
if (process.env.NODE_ENV !== 'production') {
  await setupVite(app, server);
} else {
  serveStatic(app);
}

// Start the server
server.listen(PORT, () => {
  log(`Server running on port ${PORT}`);
});
```

## Storage Layer

The storage layer abstracts database operations and is defined in `storage.ts`:

```typescript
export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Collaboration methods
  createCollaboration(collaboration: any): Promise<Collaboration>;
  getCollaboration(id: string): Promise<Collaboration | undefined>;
  getUserCollaborations(userId: string): Promise<Collaboration[]>;
  searchCollaborations(userId: string, filters: CollaborationFilters): Promise<Collaboration[]>;
  
  // Other methods...
}
```

The `DatabaseStorage` class implements this interface using Drizzle ORM:

```typescript
export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
  
  // Other method implementations...
}
```

## API Routes

API routes are defined in `routes.ts` and registered in the Express application:

```typescript
export async function registerRoutes(app: Express) {
  // User endpoints
  app.get("/api/profile", async (req: TelegramRequest, res: Response) => {
    // Implementation...
  });
  
  // Collaboration endpoints
  app.get("/api/collaborations/my", async (req: TelegramRequest, res) => {
    // Implementation...
  });
  
  // Other endpoints...
}
```

## Authentication

The application uses Telegram WebApp authentication:

1. The frontend sends Telegram user data in the `x-telegram-init-data` header
2. The backend verifies this data using the `getTelegramUserFromRequest` function
3. If valid, the user is authenticated and their profile is retrieved or created

```typescript
function getTelegramUserFromRequest(req: TelegramReq) {
  // Extract and verify Telegram user data
}
```

For development, a fallback user is provided:

```typescript
if (process.env.NODE_ENV !== 'production') {
  console.log('Using development fallback for Telegram data');
  return {
    id: '123456789',
    first_name: 'Dev',
    last_name: 'Test',
    username: 'dev_user'
  };
}
```

## Database Connection

The database connection is set up in `db.ts`:

```typescript
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

## Session Management

The application uses Express Session with a memory store:

```typescript
const sessionMiddleware = session({
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // 24 hours
  }),
  secret: process.env.SESSION_SECRET || 'development-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
});
```

## Error Handling

The application includes global error handling middleware:

```typescript
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});
```

## Telegram Bot Integration

The application integrates with the Telegram Bot API:

```typescript
export const bot = new TelegramBot(BOT_TOKEN, {
  polling: process.env.NODE_ENV !== 'test'
});

bot.onText(/\/start/, async (msg) => {
  await handleStart(msg);
});

async function handleStart(msg: TelegramBot.Message) {
  // Handle start command...
}
```

## Development Server Integration

The application integrates with Vite for development:

```typescript
export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });
  
  app.use(vite.middlewares);
  
  // Handle client-side routing...
}
```

## Discovery System Implementation

The core discovery system implementation is in the `searchCollaborations` method:

```typescript
async searchCollaborations(userId: string, filters: CollaborationFilters): Promise<Collaboration[]> {
  // Start with all active collaborations
  let query = db.select().from(collaborations)
    .where(and(
      eq(collaborations.status, 'active'),
      not(eq(collaborations.user_id, userId))
    ));
  
  // Apply additional filters...
  
  return await query;
}
```

## Debugging

The application includes debug logging at key points:

```typescript
console.log(`DEBUG: searchCollaborations: Retrieved ${collabs.length} active collaborations`);
console.log(`DEBUG: searchCollaborations: After excluding user's own, ${filteredCollabs.length} remain`);
```

## Admin Functionality

The application includes admin functionality:

```typescript
async function checkAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  // Check if user is admin...
}

app.post("/api/admin/impersonate", checkAdminMiddleware, async (req: TelegramRequest, res: Response) => {
  // Implementation...
});
```

## Related Documentation

- [Security Implementation](./security.md) - Detailed documentation about security features and best practices
- [API Documentation](../api/README.md) - API endpoints and usage
- [Authentication Documentation](../auth/README.md) - Authentication system details