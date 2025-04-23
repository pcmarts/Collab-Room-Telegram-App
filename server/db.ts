import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { config } from "../shared/config";

const { Pool } = pg;

// Re-export the schema tables
export * from "@shared/schema";

// Create a PostgreSQL connection pool with connection retries and error handling
export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  ssl: config.NODE_ENV === 'production',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000 // Increased timeout for better reliability
});

// Add error handler to prevent pool crashes
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

// Create the Drizzle ORM instance with the schema
export const db = drizzle(pool, { schema });