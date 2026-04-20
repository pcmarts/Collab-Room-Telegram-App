// Import from system packages
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema";
import { config } from "../shared/config";

// Get Pool constructor from pg
const { Pool } = pg;

// Create a PostgreSQL connection pool.
// Importing from ../shared/config ensures DATABASE_URL is validated at startup
// (throws early instead of producing a pool with an undefined connection string).
// Supabase's pgBouncer pooler uses a cert that isn't in Node's default CA bundle,
// so strict TLS verification fails with SELF_SIGNED_CERT_IN_CHAIN. The connection
// is still encrypted — we just skip the chain-validation step, same as Supabase's
// official docs recommend for serverless clients.
const isProduction = config.NODE_ENV === 'production';
export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  // Low max for serverless — each invocation gets its own short-lived connection.
  max: isProduction ? 1 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Add error handler to prevent pool crashes
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

// Create the Drizzle ORM instance with the schema
export const db = drizzle(pool, { schema });