# Deployment Guide for mobile-price.com

## Required Environment Variables

For all deployments, you need these environment variables:

```
DATABASE_URL=your_postgresql_connection_string
OPENAI_API_KEY=your_openai_api_key
RAPIDAPI_KEY=your_rapidapi_key
VITE_SITE_URL=https://mobile-price.com
```

## Option 1: Vercel (Recommended)

### Steps:
1. **Database Setup:**
   - Create a Neon database: https://neon.tech
   - Get the connection string
   
2. **Deploy to Vercel:**
   ```bash
   npm install -g vercel
   vercel
   ```
   
3. **Set Environment Variables in Vercel Dashboard:**
   - Go to Project Settings > Environment Variables
   - Add all required variables
   
4. **Build Settings:**
   - Build Command: `npm run build`
   - Output Directory: `dist/public`
   - Install Command: `npm install`

### Vercel-Specific Issues:
- Uses serverless functions instead of persistent Express server
- Database connections need proper pooling
- File uploads might need Vercel Blob storage

## Option 2: Railway (Easiest Alternative)

### Steps:
1. **Connect GitHub repo to Railway**
2. **Add PostgreSQL service**
3. **Set environment variables**
4. **Deploy automatically**

Railway is most similar to Replit and handles full-stack apps better.

## Option 3: Render

### Steps:
1. **Create Web Service from GitHub**
2. **Add PostgreSQL database**
3. **Build Command:** `npm run build`
4. **Start Command:** `npm start`
5. **Set environment variables**

## Option 4: DigitalOcean App Platform

### Steps:
1. **Connect GitHub repository**
2. **Add managed PostgreSQL database**
3. **Configure app spec:**
   ```yaml
   name: mobile-price
   services:
   - name: web
     source_dir: /
     github:
       repo: your-username/your-repo
       branch: main
     run_command: npm start
     build_command: npm run build
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     routes:
     - path: /
   databases:
   - name: mobile-price-db
     engine: PG
     size: db-s-dev-database
   ```

## Database Migration

For all platforms, you'll need to:

1. **Export current data:**
   ```bash
   npm run db:export
   ```

2. **Set up new database connection**

3. **Run migrations:**
   ```bash
   npm run db:push
   ```

4. **Import data if needed**

## Recommended Solution

**Railway** is your best option because:
- ✅ Handles full-stack apps like Replit
- ✅ Built-in PostgreSQL
- ✅ Simple deployment process
- ✅ Reasonable pricing ($5/month)
- ✅ GitHub integration
- ✅ Environment variables management

Would you like me to help you set up Railway deployment?