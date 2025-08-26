# Netlify Deployment Fix - Mobile Price

## 🚨 Common Netlify 404 Errors and Solutions

### Issue: "Page not found" Error
If you're getting a 404 error on Netlify, here are the most common causes and fixes:

## ✅ Quick Fix Checklist

### 1. Environment Variables (CRITICAL)
In your Netlify dashboard, go to **Site settings > Environment variables** and add:

```
DATABASE_URL=postgresql://neondb_owner:npg_yxlY28rJcMFv@ep-lively-unit-adtogwhk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
NODE_VERSION=18
```

### 2. Build Settings
**Build command:** `npm run build && cp _redirects dist/public/_redirects`
**Publish directory:** `dist/public`
**Functions directory:** `netlify/functions`

### 3. File Structure Check
After building, your `dist/public` folder should contain:
```
dist/public/
├── _redirects
├── index.html
└── assets/
    ├── index-[hash].css
    └── index-[hash].js
```

### 4. Redeploy Steps
1. In Netlify dashboard, go to **Deploys**
2. Click **Deploy settings**
3. Verify build command and publish directory
4. Click **Trigger deploy > Deploy site**

## 🔧 Manual Fix (If Auto-Deploy Fails)

### Option 1: GitHub Connection
1. Push your code to GitHub
2. In Netlify, connect your GitHub repository
3. Set these settings:
   - **Build command:** `npm run build && cp _redirects dist/public/_redirects`
   - **Publish directory:** `dist/public`
   - **Environment variables:** Add DATABASE_URL and NODE_VERSION

### Option 2: Manual Upload
1. Run `npm run build && cp _redirects dist/public/_redirects` locally
2. Zip the `dist/public` folder contents
3. In Netlify, drag and drop the zip file
4. Upload the `netlify/functions` folder separately

## 🎯 Testing Your Deployment

### Frontend Tests
- ✅ Homepage loads: `https://your-site.netlify.app/`
- ✅ Brand pages work: `https://your-site.netlify.app/apple`
- ✅ Mobile pages work: `https://your-site.netlify.app/apple/apple-iphone-15-pro`

### API Tests
- ✅ Brands API: `https://your-site.netlify.app/api/brands`
- ✅ Mobiles API: `https://your-site.netlify.app/api/mobiles`
- ✅ Search API: `https://your-site.netlify.app/api/search?q=iphone`

## 🚨 Most Common Issues

### 1. Missing _redirects File
**Symptom:** Frontend loads but API calls fail
**Fix:** Ensure `_redirects` is in `dist/public/` folder

### 2. Wrong Publish Directory
**Symptom:** White screen or 404 on all pages
**Fix:** Set publish directory to `dist/public` (not just `dist`)

### 3. Missing Environment Variables
**Symptom:** API works but returns empty data
**Fix:** Add DATABASE_URL in Netlify environment variables

### 4. Functions Not Deployed
**Symptom:** API endpoints return 404
**Fix:** Ensure `netlify/functions` folder is uploaded

## 📞 Final Verification

After deployment, test these URLs:
1. `https://your-site.netlify.app/` - Should show homepage
2. `https://your-site.netlify.app/api/brands` - Should return JSON with brand data
3. `https://your-site.netlify.app/apple` - Should show Apple brand page
4. `https://your-site.netlify.app/sitemap.xml` - Should show sitemap

If all these work, your deployment is successful! 🎉

## 🔄 Force Rebuild

If issues persist:
1. Clear Netlify deploy cache: **Deploys > Deploy settings > Clear cache**
2. Force rebuild: **Deploys > Trigger deploy > Clear cache and deploy site**
3. Check deploy logs for specific error messages