# Vercel Deployment Troubleshooting Guide

## Issue: API Endpoints Returning 500 Errors

### Current Status:
✅ **Local Development**: All API endpoints working perfectly  
❌ **Vercel Production**: `/api/brands` and `/api/mobiles` returning 500 errors  

### Root Cause Analysis:
The 500 errors indicate server-side issues on Vercel, likely related to:
1. **Database Connection Issues**
2. **Missing Environment Variables**
3. **Database Schema Not Created**
4. **Serverless Function Timeout**

## Step-by-Step Fix Guide

### 1. Check Vercel Function Logs
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# View real-time logs
vercel logs --follow
```

### 2. Verify Environment Variables
Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

Ensure these are set:
```
DATABASE_URL=postgresql://neondb_owner:npg_yxlY28rJcMFv@ep-lively-unit-adtogwhk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
NODE_ENV=production
VITE_SITE_URL=https://your-app-name.vercel.app
JWT_SECRET=your-secure-jwt-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

### 3. Database Schema Setup

The most likely issue is that your Neon database doesn't have the required tables.

#### Option A: Run Migration Locally (Recommended)
```bash
# Pull production environment variables
vercel env pull .env.production

# Push database schema to production
npm run db:push

# Import all data
npm run db:import-neon
```

#### Option B: Direct SQL Import
1. Go to **Neon Console** → **Your Database** → **SQL Editor**
2. Copy and paste the contents of `neon-database.sql`
3. Execute the SQL to create tables and import data

### 4. Test Database Connection

Create a simple test endpoint to verify database connectivity:

```javascript
// Add this to your server/routes.ts temporarily
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.select().from(brands).limit(1);
    res.json({ status: 'success', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});
```

### 5. Check Serverless Function Configuration

Verify your `vercel.json` configuration:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["shared/**", "dist/public/**"],
        "maxDuration": 30
      }
    }
  ]
}
```

### 6. Common Issues & Solutions

#### Issue: "Cannot find module '@shared/schema'"
**Solution**: Ensure `shared/**` is included in `vercel.json` builds config

#### Issue: "Connection timeout"
**Solution**: 
- Check if DATABASE_URL is correct
- Verify Neon database is not paused
- Increase `maxDuration` in vercel.json

#### Issue: "Table doesn't exist"
**Solution**: Run `npm run db:push` to create tables

#### Issue: "No data returned"
**Solution**: Run `npm run db:import-neon` to import data

### 7. Debugging Commands

```bash
# Check if tables exist
psql $DATABASE_URL -c "\dt"

# Count records in tables
psql $DATABASE_URL -c "SELECT COUNT(*) FROM brands;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM mobiles;"

# Test API endpoints directly
curl https://your-app.vercel.app/api/brands
curl https://your-app.vercel.app/api/mobiles
```

### 8. Emergency Data Recovery

If you need to quickly restore data:

```bash
# Export from local database
npm run db:export

# Import to production
DATABASE_URL="your_production_url" npm run db:import
```

## Expected Results After Fix

✅ `/api/brands` should return 35 brands  
✅ `/api/mobiles` should return 210 mobile devices  
✅ `/api/mobiles?featured=true` should return featured mobiles  
✅ Frontend should display all mobile data  

## Need Help?

1. **Check Vercel Function Logs** first - they contain the exact error messages
2. **Verify Database Connection** - most 500 errors are database-related
3. **Test API endpoints** directly in browser or with curl
4. **Compare with local development** - if local works, it's a deployment issue

## Files to Check
- `server/db.ts` - Database connection configuration
- `server/routes.ts` - API endpoint definitions
- `shared/schema.ts` - Database schema definitions
- `vercel.json` - Vercel deployment configuration
- `.env.vercel` - Environment variables template