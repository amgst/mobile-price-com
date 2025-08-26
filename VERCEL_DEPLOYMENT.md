# Vercel Deployment Guide

This guide will help you deploy your Mobile Price Comparison website to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Database**: A PostgreSQL database (Neon, Supabase, or Railway)

## Step 1: Prepare Your Project

### 1.1 Verify Build Configuration

Ensure your `package.json` has the correct build scripts:

```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "cross-env NODE_ENV=production node dist/index.js"
  }
}
```

### 1.2 Check Vercel Configuration

The `vercel.json` file has been created with the following configuration:
- Frontend build using Vite
- Backend API routes handled by Express server
- Static file serving for the React app

## Step 2: Environment Variables

### 2.1 Required Environment Variables

In your Vercel dashboard, add these environment variables:

```env
# Database (Required)
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# Application Settings
NODE_ENV=production
PORT=3000

# Optional: AI Features
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Data Import
RAPIDAPI_KEY=your_rapidapi_key_here

# Optional: Site Configuration
VITE_SITE_URL=https://your-domain.vercel.app
VITE_SITE_NAME=Mobile Price Comparison
VITE_SITE_DESCRIPTION=Compare mobile phones and find the best deals
```

### 2.2 Database Setup

**Option A: Neon Database (Recommended)**
1. Create account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add to Vercel environment variables

**Option B: Supabase**
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string
5. Add to Vercel environment variables

## Step 3: Deploy to Vercel

### 3.1 Connect Repository

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave empty)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`

### 3.2 Add Environment Variables

1. In the Vercel dashboard, go to your project
2. Navigate to Settings > Environment Variables
3. Add all the required environment variables listed above

### 3.3 Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Your site will be available at `https://your-project-name.vercel.app`

## Step 4: Post-Deployment Setup

### 4.1 Database Schema

After deployment, you need to set up your database schema:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Run database migrations
vercel env pull .env.local
npm run db:push
```

### 4.2 Import Initial Data

If you have existing data:

```bash
# Import from your JSON backup
npm run db:import-neon
```

Or use the admin interface at `https://your-domain.vercel.app/admin/import` to import data via RapidAPI.

## Step 5: Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Navigate to Settings > Domains
3. Add your custom domain
4. Update DNS records as instructed
5. Update `VITE_SITE_URL` environment variable

## Troubleshooting

### Build Errors

**Error: "Module not found"**
- Check that all dependencies are in `package.json`
- Ensure TypeScript paths are correctly configured

**Error: "Database connection failed"**
- Verify `DATABASE_URL` is correctly set
- Ensure database allows connections from Vercel IPs
- Check if database requires SSL (add `?sslmode=require`)

### Runtime Errors

**Error: "API routes not working"**
- Check `vercel.json` routing configuration
- Ensure API routes start with `/api/`

**Error: "Static files not loading"**
- Verify build output directory is `dist/public`
- Check Vite build configuration

### Performance Optimization

1. **Enable Edge Functions** (if needed):
   ```json
   {
     "functions": {
       "server/index.ts": {
         "runtime": "nodejs18.x",
         "maxDuration": 30
       }
     }
   }
   ```

2. **Add Caching Headers**:
   ```json
   {
     "headers": [
       {
         "source": "/api/(.*)",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "s-maxage=60, stale-while-revalidate"
           }
         ]
       }
     ]
   }
   ```

## Monitoring

1. **Vercel Analytics**: Enable in project settings
2. **Error Tracking**: Check function logs in Vercel dashboard
3. **Performance**: Monitor Core Web Vitals

## Continuous Deployment

Vercel automatically deploys when you push to your main branch:

1. **Production**: Deploys from `main` branch
2. **Preview**: Deploys from feature branches
3. **Environment Variables**: Can be different per environment

## Cost Considerations

- **Hobby Plan**: Free for personal projects
- **Pro Plan**: $20/month for commercial use
- **Database**: Separate cost (Neon free tier available)
- **Bandwidth**: 100GB/month on free plan

## Support

If you encounter issues:

1. Check Vercel function logs
2. Review build logs for errors
3. Test locally with `vercel dev`
4. Contact Vercel support or check their documentation

---

🚀 **Your mobile comparison website is now live on Vercel!**

Access your deployed site at: `https://your-project-name.vercel.app`

Admin panel: `https://your-project-name.vercel.app/admin/login`
(Default credentials: admin/admin123)