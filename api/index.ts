import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { registerRoutes } from '../server/routes.js';

// Create Express app for Vercel
const app = express();

// Configure middleware for Vercel
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register all routes
let routesRegistered = false;

async function initializeRoutes() {
  if (!routesRegistered) {
    try {
      await registerRoutes(app);
      routesRegistered = true;
      console.log('Routes registered successfully for Vercel');
    } catch (error) {
      console.error('Failed to register routes:', error);
      throw error;
    }
  }
}

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Initialize routes if not already done
    await initializeRoutes();
    
    // Handle the request using app as middleware
    return new Promise<void>((resolve, reject) => {
      app(req as any, res as any, (err: any) => {
        if (err) {
          console.error('Express app error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Vercel handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}