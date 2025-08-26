import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "../shared/schema.js";

// Configure Neon for serverless environments
neonConfig.fetchConnectionCache = true;

// Set WebSocket constructor for Node.js environments
if (
  typeof window === "undefined" &&
  !process.env.VERCEL &&
  !process.env.REPLIT_DEPLOYMENT
) {
  import("ws")
    .then(({ WebSocket }) => {
      neonConfig.webSocketConstructor = WebSocket;
    })
    .catch(() => {
      console.warn("WebSocket constructor not available, using HTTP fallback");
    });
}

// Get database URL from environment variables
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Add your Neon database URL to environment variables.",
  );
}

// Connection pool configuration optimized for serverless
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  // Vercel serverless optimizations
  ...(process.env.VERCEL && {
    maxUses: 1,
    max: 1,
  }),
};

export const pool = new Pool(poolConfig);

export const db = drizzle({ client: pool, schema });
