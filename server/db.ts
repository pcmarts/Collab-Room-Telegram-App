import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { config } from "../shared/config";

// Re-export the schema tables
export * from "@shared/schema";

// Configure Neon to use WebSocket
neonConfig.webSocketConstructor = ws;

// Use the HTTP connection method instead of WebSockets
const sql = neon(config.DATABASE_URL);

// Create the Drizzle client with the schema
export const db = drizzle(sql, { schema });