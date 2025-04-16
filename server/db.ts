import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { config } from "../shared/config";

// Re-export the schema tables
export * from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Database connection is now validated through the config module
export const pool = new Pool({ 
  connectionString: config.DATABASE_URL,
  // Add additional security parameters
  ssl: config.NODE_ENV === 'production',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection
});

export const db = drizzle(pool, { schema });