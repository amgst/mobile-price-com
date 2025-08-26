# Vercel + Neon Database Setup Guide

## Problem Fixed
Your Vercel deployment failed because:
1. **Database Connection**: Vercel serverless functions need special Neon configuration
2. **Environment Variables**: DATABASE_URL not properly configured for Vercel
3. **Serverless Optimization**: Connection pooling needed adjustment

## Solution Files Created

### 1. Fixed Database Connection (`server/db.ts`)
- Optimized for Vercel serverless environment
- Proper connection pooling (max: 1 connection)
- Vercel-specific configuration flags

### 2. Vercel API Handler (`api/index.ts`)
- Serverless function wrapper for Express routes
- Proper request/response handling for Vercel
- Route initialization management

### 3. Updated Vercel Configuration (`vercel-fixed.json`)
- Correct build and routing setup
- Serverless function configuration
- Static file serving

## Deployment Steps

### Step 1: Setup Neon Database
1. Go to [neon.tech](https://neon.tech)
2. Create project: `mobile-price-com`
3. Copy your connection string
4. Import data using: `./neon-migration.sh`

### Step 2: Configure Vercel Environment
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add these variables:
```
DATABASE_URL=postgresql://username:password@ep-xxx.neon.tech/neondb
OPENAI_API_KEY=your_openai_key
RAPIDAPI_KEY=your_rapidapi_key
VITE_SITE_URL=https://mobile-price.com
```

### Step 3: Update Project Files
1. Replace `vercel.json` with `vercel-fixed.json`
```bash
mv vercel-fixed.json vercel.json
```

2. The API routes will now work through `/api/*` endpoints

### Step 4: Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## Key Changes Made

### Database Connection
- **Before**: Direct PostgreSQL connection
- **After**: Neon serverless with connection pooling

### API Routes  
- **Before**: Express server at `/api/*`
- **After**: Vercel serverless functions at `/api/*`

### Static Files
- **Before**: Served from `/public/`
- **After**: Served from `/dist/public/`

## Testing Your Deployment

After deployment, test these endpoints:
```
GET https://your-app.vercel.app/api/brands
GET https://your-app.vercel.app/api/mobiles
GET https://your-app.vercel.app/api/mobiles/apple/iphone-16-pro
```

## Common Issues & Solutions

**Issue**: "Cannot find module" errors
**Solution**: Ensure all imports use `.js` extensions for ES modules

**Issue**: Database connection timeout
**Solution**: Check Neon database is active and DATABASE_URL is correct

**Issue**: CORS errors
**Solution**: Vercel handles CORS automatically for same-origin requests

Your mobile-price.com website should now work perfectly on Vercel with Neon database!