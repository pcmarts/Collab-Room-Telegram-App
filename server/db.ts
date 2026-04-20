// Import from system packages
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { config } from "../shared/config";

// Get Pool constructor from pg
const { Pool } = pg;

// Create a PostgreSQL connection pool.
// Importing from ../shared/config ensures DATABASE_URL is validated at startup
// (throws early instead of producing a pool with an undefined connection string).
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