import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "@shared/schema";

// Configure Neon for Vercel serverless environment
neonConfig.fetchConnectionCache = true;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please add your Neon database URL to Vercel environment variables.",
  );
}

// Create connection pool optimized for Vercel
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  maxUses: 1, // Important for serverless
  max: 1, // Single connection for serverless
});

export const db = drizzle({ client: pool, schema });

// Graceful cleanup for serverless
export async function closeConnection() {
  await pool.end();
}