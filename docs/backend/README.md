# Backend Documentation

## Overview

The Collab Room backend is built using Node.js and Express, with a focus on providing a clean and efficient API for the client. The server is responsible for handling authentication, data persistence, and business logic.

## Technology Stack

- **Node.js**: JavaScript runtime
- **Express**: Web framework for building the API
- **Drizzle ORM**: For database interactions
- **PostgreSQL**: Relational database for data storage
- **Express Session**: For session management
- **Telegram Bot API**: For user authentication and notifications

## Project Structure

```
server/
├── db.ts              # Database connection setup
├── index.ts           # Server entry point
├── routes.ts          # API routes definition
├── storage.ts         # Data access layer
├── telegram.ts        # Telegram integration
└── vite.ts            # Development server integration
```

## Server Setup

The server is set up in `server/index.ts`:

```typescript
import express from 'express';
import { registerRoutes } from './routes';
import { setupVite, serveStatic } from './vite';
import { Server } from 'http';

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON request bodies
app.use(express.json());

// Register API routes
registerRoutes(app);

// In production, serve static files
if (process.env.NODE_ENV === 'production') {
  serveStatic(app);
}

// Create HTTP server
const server = new Server(app);

// In development, setup Vite middleware
if (process.env.NODE_ENV !== 'production') {
  setupVite(app, server);
}

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Database Connection

The database connection is set up in `server/db.ts`:

```typescript
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/pg-pool';
import * as schema from '../shared/schema';

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

## API Routes

API routes are defined in `server/routes.ts` and registered using the `registerRoutes` function:

```typescript
export async function registerRoutes(app: Express) {
  // Profile API endpoint
  app.get("/api/profile", async (req: TelegramRequest, res: Response) => {
    try {
      // Get user from Telegram data
      const telegramUser = getTelegramUserFromRequest(req);
      
      // If no Telegram user, return error
      if (!telegramUser) {
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }
      
      // Get user from database
      const user = await storage.getUserByTelegramId(telegramUser.id.toString());
      
      // If user not found, return error
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Get company information
      const company = await getCompanyByUserId(user.id);
      
      // Get preferences
      const notificationPreferences = await storage.getUserNotificationPreferences(user.id);
      const marketingPreferences = await storage.getUserMarketingPreferences(user.id);
      const conferencePreferences = await storage.getUserConferencePreferences(user.id);
      
      // Return profile data
      return res.json({
        user,
        company,
        notificationPreferences,
        marketingPreferences,
        conferencePreferences
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });
  
  // More API endpoints...
}
```

## Data Access Layer

The data access layer is implemented in `server/storage.ts` using the repository pattern. It provides an interface for accessing and manipulating data in the database:

```typescript
export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  setUserAdminStatus(id: string, isAdmin: boolean): Promise<User | undefined>;
  
  // Collaboration methods
  createCollaboration(collaboration: any): Promise<Collaboration>;
  getCollaboration(id: string): Promise<Collaboration | undefined>;
  getUserCollaborations(userId: string): Promise<Collaboration[]>;
  searchCollaborations(userId: string, filters: CollaborationFilters): Promise<Collaboration[]>;
  updateCollaborationStatus(id: string, status: string): Promise<Collaboration | undefined>;
  
  // More methods...
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }
  
  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.telegram_id, telegramId));
    return results[0];
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const results = await db.insert(users).values(insertUser).returning();
    return results[0];
  }
  
  // More implementations...
}

export const storage = new DatabaseStorage();
```

## Authentication

Authentication is handled via Telegram WebApp. The user's Telegram information is parsed from the `x-telegram-init-data` header:

```typescript
function getTelegramUserFromRequest(req: TelegramReq) {
  // Check if we already parsed the Telegram data
  if (req.telegramData) {
    return req.telegramData;
  }
  
  // Get init data from header
  const initData = req.headers?.['x-telegram-init-data'] as string;
  
  // If no init data, use development fallback if in development
  if (!initData) {
    console.log('No Telegram init data found in request headers');
    console.log('Available headers:', req.headers);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Using development fallback for Telegram data');
      return {
        id: '1211030693', // Example ID
        username: 'test_user',
        first_name: 'Test',
        last_name: 'User'
      };
    }
    
    return null;
  }
  
  try {
    // Parse init data
    const params = new URLSearchParams(initData);
    const user = JSON.parse(params.get('user') || '{}');
    
    // Log parsed user
    console.log('Parsed Telegram user data:', user);
    
    // Cache parsed user in request
    if (req.telegramData === undefined) {
      req.telegramData = user;
    }
    
    return user;
  } catch (error) {
    console.error('Error parsing Telegram init data:', error);
    return null;
  }
}
```

## Session Management

Session management is handled using Express Session:

```typescript
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
```

## Telegram Bot

A Telegram bot is used for sending notifications to users:

```typescript
export const bot = new TelegramBot(BOT_TOKEN, {
  polling: false
});

export async function sendApplicationConfirmation(chatId: number) {
  try {
    await bot.sendMessage(
      chatId,
      `✅ Your application has been received!\n\nWe'll review it soon and get back to you.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Check Status",
                web_app: {
                  url: `${WEB_APP_URL}/application-status`
                }
              }
            ]
          ]
        }
      }
    );
  } catch (error) {
    console.error('Error sending application confirmation:', error);
  }
}
```

## Error Handling

The server includes global error handling middleware:

```typescript
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Global error handler:', err);
  
  const statusCode = err.statusCode || 500;
  const errorMessage = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: errorMessage,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});
```

## Admin Impersonation

The server includes functionality for admin users to impersonate other users:

```typescript
interface ImpersonationSession extends Session {
  impersonating?: {
    originalUser: any;
    impersonatedUser: {
      id: string;
      first_name: string;
      last_name?: string;
      username?: string;
    }
  }
}

app.post("/api/admin/impersonate", checkAdminMiddleware, async (req: TelegramRequest, res: Response) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const userToImpersonate = await storage.getUser(userId);
    
    if (!userToImpersonate) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Store original user and impersonated user in session
    const telegramUser = getTelegramUserFromRequest(req);
    
    req.session.impersonating = {
      originalUser: telegramUser,
      impersonatedUser: {
        id: userToImpersonate.id,
        first_name: userToImpersonate.first_name,
        last_name: userToImpersonate.last_name,
        username: userToImpersonate.handle
      }
    };
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error impersonating user:', error);
    res.status(500).json({ error: 'Failed to impersonate user' });
  }
});
```

## Database Migrations

Database migrations are handled using custom migration scripts in the root of the project:

- `db-migrate-add-description.js`: Adds a description column to the collaborations table
- `db-migrate-blockchain-filters.js`: Adds blockchain filters
- `db-migrate-blockchain-networks-field.js`: Adds blockchain networks field
- `db-migrate-blockchain-networks.js`: Adds blockchain networks
- `db-migrate-collab-fields.js`: Removes title and description fields from collaborations table
- `db-migrate-fill-descriptions.js`: Updates existing collaborations with descriptions
- `db-migrate-new-fields.js`: Adds new fields
- `db-migrate-preferences.js`: Adds preferences tables
- `db-migrate-swipes.js`: Creates the swipes table

These migrations can be run using Node.js:

```bash
node db-migrate-swipes.js
```

## Development Server Integration

The server integrates with Vite for development, providing a seamless development experience:

```typescript
export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  log('Vite middleware setup complete');
}
```

This allows the frontend and backend to run on the same port during development.