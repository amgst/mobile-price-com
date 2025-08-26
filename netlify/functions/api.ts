import { Handler } from '@netlify/functions';
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../../shared/schema.js";
import { eq, like, or, and, sql } from "drizzle-orm";
import { brands, mobiles, users } from "../../shared/schema.js";

// Database connection
const createDbConnection = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  return drizzle(pool, { schema });
};

// Response helper
const response = (statusCode: number, body: any) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  },
  body: JSON.stringify(body),
});

export const handler: Handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  const path = event.path.replace('/.netlify/functions/api', '');
  const method = event.httpMethod;
  
  try {
    const db = createDbConnection();

    // Routes
    if (path === '/brands' && method === 'GET') {
      const allBrands = await db.select().from(brands);
      return response(200, allBrands);
    }

    if (path === '/mobiles' && method === 'GET') {
      const allMobiles = await db.select().from(mobiles);
      return response(200, allMobiles);
    }

    if (path.startsWith('/brands/') && method === 'GET') {
      const brandSlug = path.split('/')[2];
      const brand = await db.select().from(brands).where(eq(brands.slug, brandSlug)).limit(1);
      
      if (brand.length === 0) {
        return response(404, { message: 'Brand not found' });
      }
      
      return response(200, brand[0]);
    }

    if (path.startsWith('/mobiles/brand/') && method === 'GET') {
      const brandSlug = path.split('/')[3];
      const brandMobiles = await db.select().from(mobiles).where(eq(mobiles.brand, brandSlug));
      return response(200, brandMobiles);
    }

    if (path.startsWith('/mobiles/') && path.split('/').length === 4 && method === 'GET') {
      const [, , brandSlug, mobileSlug] = path.split('/');
      const mobile = await db.select().from(mobiles)
        .where(and(eq(mobiles.brand, brandSlug), eq(mobiles.slug, mobileSlug)))
        .limit(1);
      
      if (mobile.length === 0) {
        return response(404, { message: 'Mobile not found' });
      }
      
      return response(200, mobile[0]);
    }

    if (path === '/search' && method === 'GET') {
      const query = event.queryStringParameters?.q || '';
      
      if (!query) {
        return response(400, { message: 'Query parameter q is required' });
      }

      const searchResults = await db.select().from(mobiles)
        .where(
          or(
            like(mobiles.name, `%${query}%`),
            like(mobiles.brand, `%${query}%`),
            like(mobiles.model, `%${query}%`)
          )
        );

      return response(200, searchResults);
    }

    if (path === '/featured' && method === 'GET') {
      const featuredMobiles = await db.select().from(mobiles).limit(6);
      return response(200, featuredMobiles);
    }

    // Auth endpoints (simplified for Netlify)
    if (path === '/auth/status' && method === 'GET') {
      return response(200, { isAuthenticated: false, username: null });
    }

    if (path === '/auth/login' && method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      
      // Simple auth for demo (in production, use proper JWT/sessions)
      if (body.username === 'admin' && body.password === 'admin123') {
        return response(200, { success: true, message: 'Login successful' });
      }
      
      return response(401, { success: false, message: 'Invalid credentials' });
    }

    return response(404, { message: 'Not found' });

  } catch (error) {
    console.error('API Error:', error);
    return response(500, { message: 'Internal server error' });
  }
};