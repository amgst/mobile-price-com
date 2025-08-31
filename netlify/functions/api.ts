import { Handler } from '@netlify/functions';
import pkg from "pg";
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../../shared/schema.ts";
import { eq, like, or, and, sql } from "drizzle-orm";
import { brands, mobiles, users } from "../../shared/schema.ts";
import { generateSitemapEntries, generateSitemapXML } from "../../client/src/components/seo/sitemap-generator.js";
import jwt from 'jsonwebtoken';

// Database connection
const createDbConnection = () => {
  console.log('Checking DATABASE_URL...');
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set in environment variables');
    throw new Error("DATABASE_URL must be set");
  }
  
  console.log('DATABASE_URL found, length:', process.env.DATABASE_URL.length);
  console.log('Creating connection pool...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    acquireTimeoutMillis: 10000,
    createTimeoutMillis: 10000,
  });
  
  console.log('Pool created, initializing drizzle...');
  return drizzle(pool, { schema });
};

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Response helper
const response = (statusCode: number, body: any, cookies?: string[]) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    ...(cookies && { 'Set-Cookie': cookies }),
  },
  body: JSON.stringify(body),
});

// Helper to extract JWT from cookies
const extractTokenFromCookies = (cookieHeader: string | undefined): string | null => {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const authCookie = cookies.find(c => c.startsWith('auth-token='));
  return authCookie ? authCookie.split('=')[1] : null;
};

// Helper to verify JWT token
const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

export const handler: Handler = async (event, context) => {
  console.log('Function invoked:', {
    path: event.path,
    method: event.httpMethod,
    query: event.queryStringParameters
  });
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  const path = event.path.replace('/.netlify/functions/api', '');
  const method = event.httpMethod;
  
  console.log('Processing request:', { path, method });
  
  try {
    console.log('Creating database connection...');
    const db = createDbConnection();
    console.log('Database connection created successfully');

    // Routes
    if (path === '/brands' && method === 'GET') {
      const allBrands = await db.select().from(brands);
      return response(200, allBrands);
    }

    if (path === '/mobiles' && method === 'GET') {
      const brandParam = event.queryStringParameters?.brand;
      const featuredParam = event.queryStringParameters?.featured;
      
      if (brandParam) {
        const brandMobiles = await db.select().from(mobiles).where(eq(mobiles.brand, brandParam));
        return response(200, brandMobiles);
      }
      
      if (featuredParam === 'true') {
        const featuredMobiles = await db.select().from(mobiles).limit(6);
        return response(200, featuredMobiles);
      }
      
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

    // Sitemap XML endpoint
    if (path === '/sitemap.xml' && method === 'GET') {
      const allMobiles = await db.select().from(mobiles);
      const allBrands = await db.select().from(brands);
      
      const entries = generateSitemapEntries(allMobiles, allBrands);
      const xml = generateSitemapXML(entries);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*'
        },
        body: xml
      };
    }

    // Robots.txt endpoint
    if (path === '/robots.txt' && method === 'GET') {
      const baseUrl = 'https://mobile-price.com';
      
      const robotsTxt = `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Block admin and API routes
Disallow: /admin/
Disallow: /api/

# Allow all search engines to crawl
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# Crawl-delay for polite crawling
Crawl-delay: 1`;
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*'
        },
        body: robotsTxt
      };
    }

    // Auth endpoints with JWT
    if (path === '/auth/status' && method === 'GET') {
      const token = extractTokenFromCookies(event.headers.cookie);
      
      if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
          return response(200, { isAuthenticated: true, username: decoded.username });
        }
      }
      
      return response(200, { isAuthenticated: false, username: null });
    }

    if (path === '/auth/login' && method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      
      // Simple auth for demo (in production, use proper user database)
      if (body.username === 'admin' && body.password === 'admin123') {
        const token = jwt.sign(
          { username: 'admin', userId: 1 },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        const isProduction = event.headers.host?.includes('netlify.app') || event.headers.host?.includes('mobile-price.com');
        const cookie = `auth-token=${token}; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Max-Age=86400; Path=/`;
        
        return response(200, { 
          success: true, 
          message: 'Login successful',
          redirectTo: '/admin'
        }, [cookie]);
      }
      
      return response(401, { success: false, message: 'Invalid credentials' });
    }

    if (path === '/auth/logout' && method === 'POST') {
      const isProduction = event.headers.host?.includes('netlify.app') || event.headers.host?.includes('mobile-price.com');
      const expiredCookie = `auth-token=; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Max-Age=0; Path=/`;
      return response(200, { success: true, message: 'Logged out successfully' }, [expiredCookie]);
    }

    // Default route - API information
    if (path === '' || path === '/') {
      return response(200, {
        message: 'Mobile Price API',
        version: '1.0.0',
        endpoints: {
          '/brands': 'GET - Get all brands',
          '/mobiles': 'GET - Get all mobiles (supports ?brand=name and ?featured=true)',
          '/brands/:slug': 'GET - Get brand by slug',
          '/mobiles/brand/:slug': 'GET - Get mobiles by brand slug',
          '/mobiles/:brandSlug/:mobileSlug': 'GET - Get specific mobile',
          '/search': 'GET - Search mobiles (requires ?q=query)',
          '/featured': 'GET - Get featured mobiles',
          '/sitemap.xml': 'GET - XML sitemap for search engines',
          '/robots.txt': 'GET - Robots.txt for search engine crawlers',
          '/auth/status': 'GET - Check auth status',
          '/auth/login': 'POST - Login (username/password)'
        }
      });
    }

    return response(404, { message: 'Not found' });

  } catch (error) {
    console.error('API Error Details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      path: path,
      method: method,
      env_check: {
        has_database_url: !!process.env.DATABASE_URL,
        database_url_length: process.env.DATABASE_URL?.length || 0
      }
    });
    return response(500, { 
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};