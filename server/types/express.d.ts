import type { Session } from 'express-session';

// Define the structure for impersonation data within the session
interface ImpersonationData {
  originalUser: any; // Consider defining a User type if available
  impersonatedUser: {
    id: string;
    first_name: string;
    last_name?: string;
    username?: string;
  };
}

// Define the structure for cached Telegram user data within the session
interface TelegramSessionUser {
  id: string;
  username?: string;
  first_name: string;
  last_name?: string;
  cachedAt: number;
}

// Extend the existing Express SessionData interface
declare module 'express-session' {
  interface SessionData {
    impersonating?: ImpersonationData;
    telegramUser?: TelegramSessionUser;
    // Add isAdmin? - Consider if caching admin status is desired (See Finding #10)
    // isAdmin?: boolean;
  }
}

// Extend the existing Express Request interface
declare global {
  namespace Express {
    interface Request {
      // session is already added by express-session types, now with our extended SessionData
      // Add userId, attached by our temporary middleware
      userId?: string; 
      // Body, params, query are already part of the base Request type, 
      // often typed generically or inferred by middleware.
      // No need to redefine them as `any` here unless strictly necessary.
    }
  }
}

// Export {} to make this file a module and ensure declarations are merged.
export {}; 