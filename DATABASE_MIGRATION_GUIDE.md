# Database Migration Guide: From Replit to Free Alternatives

This guide will help you migrate your Mobile Price Pro database from Replit to a free PostgreSQL hosting service.

## 🚀 Quick Start (If you have Replit Neon export files)

If Replit has generated Neon-optimized export files for you:

```bash
# 1. Download the Neon export files from Replit to your project root:
#    - neon-database.sql
#    - neon-database.json  
#    - neon-migration.sh
#    - NEON_DEPLOYMENT.md

# 2. Set up Neon database and update .env
npm run db:setup

# 3. Set up database schema
npm run db:push

# 4. Import your data using optimized Neon files
npm run db:import-neon

# 5. Test your application
npm run dev
```

**That's it!** Your database is now migrated to Neon with all optimizations applied.

---

## 🎯 Recommended Free PostgreSQL Services

### 1. **Neon (Recommended)**
- **Free Tier**: 512 MB storage, 1 database
- **Pros**: Serverless, auto-scaling, excellent performance
- **Cons**: Storage limit
- **Website**: https://neon.tech

### 2. **Supabase**
- **Free Tier**: 500 MB storage, 2 databases
- **Pros**: Full-featured backend, real-time features
- **Cons**: More complex than needed for this project
- **Website**: https://supabase.com

### 3. **Railway**
- **Free Tier**: $5 monthly credit (usually enough for small projects)
- **Pros**: Simple deployment, good performance
- **Cons**: Credit-based system
- **Website**: https://railway.app

### 4. **Aiven**
- **Free Tier**: 1 month free trial, then paid
- **Pros**: Professional-grade service
- **Cons**: Limited free period
- **Website**: https://aiven.io

## 🚀 Step-by-Step Migration Process

### Step 1: Export Data from Replit

#### Option A: Use Replit's Optimized Neon Export (Recommended)

If Replit has generated Neon-optimized export files, you should have:
- ✅ `neon-database.sql` (95KB) - Optimized PostgreSQL import
- ✅ `neon-database.json` (781KB) - Complete JSON backup  
- ✅ `neon-migration.sh` - Automated deployment script
- ✅ `NEON_DEPLOYMENT.md` - Complete deployment guide

**Download these files from your Replit project** and save them to your local project directory.

#### Option B: Manual Export (If Replit files not available)

1. **Connect to your Replit database**:
   ```bash
   # In Replit console
   psql $DATABASE_URL
   ```

2. **Export your data**:
   ```sql
   -- Export brands table
   \copy brands TO 'brands_export.csv' CSV HEADER;
   
   -- Export mobiles table
   \copy mobiles TO 'mobiles_export.csv' CSV HEADER;
   
   -- Export users table (if any)
   \copy users TO 'users_export.csv' CSV HEADER;
   ```

3. **Alternative: Use pg_dump for complete backup**:
   ```bash
   pg_dump $DATABASE_URL > database_backup.sql
   ```

### Step 2: Set Up New Database (Using Neon as Example)

1. **Create Neon Account**:
   - Go to https://neon.tech
   - Sign up with GitHub/Google
   - Create a new project

2. **Get Connection String**:
   - Copy the connection string from Neon dashboard
   - It looks like: `postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`

3. **Update Environment Variables**:
   ```env
   # Replace in your .env file
   DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### Step 3: Set Up Schema in New Database

1. **Run Drizzle migrations**:
   ```bash
   npm run db:generate
   npm run db:push
   ```

2. **Verify tables are created**:
   ```bash
   # Connect to new database
   psql "postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
   
   # List tables
   \dt
   ```

### Step 4: Import Data to New Database

#### Option A: Using Replit's Neon-Optimized Files (Recommended)

1. **If you have the `neon-migration.sh` script**:
   ```bash
   # Make the script executable (on macOS/Linux)
   chmod +x neon-migration.sh
   
   # Run the automated migration
   ./neon-migration.sh
   ```

2. **Manual import using neon-database.sql**:
   ```bash
   # Import the optimized SQL file
   psql "postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require" < neon-database.sql
   ```

3. **Verify with JSON backup** (if needed):
   The `neon-database.json` file can be used as a backup or for custom import scripts.

#### Option B: Manual Import Methods

1. **Import CSV files** (if you used CSV export):
   ```sql
   -- Connect to new database first
   \copy brands FROM 'brands_export.csv' CSV HEADER;
   \copy mobiles FROM 'mobiles_export.csv' CSV HEADER;
   \copy users FROM 'users_export.csv' CSV HEADER;
   ```

2. **Or restore from SQL dump**:
   ```bash
   psql "postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require" < database_backup.sql
   ```

### Step 5: Test the Migration

1. **Start your application**:
   ```bash
   npm run dev
   ```

2. **Verify data**:
   - Check if brands are loading
   - Check if mobile data is accessible
   - Test search functionality

## 🛠️ Migration Scripts

Create these helper scripts for easier migration:

### `scripts/export-data.js`
```javascript
const { Pool } = require('pg');
const fs = require('fs');

const oldPool = new Pool({
  connectionString: process.env.OLD_DATABASE_URL
});

async function exportData() {
  try {
    // Export brands
    const brands = await oldPool.query('SELECT * FROM brands');
    fs.writeFileSync('brands_export.json', JSON.stringify(brands.rows, null, 2));
    
    // Export mobiles
    const mobiles = await oldPool.query('SELECT * FROM mobiles');
    fs.writeFileSync('mobiles_export.json', JSON.stringify(mobiles.rows, null, 2));
    
    console.log('Data exported successfully!');
  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    await oldPool.end();
  }
}

exportData();
```

### `scripts/import-data.js`
```javascript
const { Pool } = require('pg');
const fs = require('fs');

const newPool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function importData() {
  try {
    // Import brands
    const brands = JSON.parse(fs.readFileSync('brands_export.json', 'utf8'));
    for (const brand of brands) {
      await newPool.query(
        'INSERT INTO brands (id, name, slug, logo, phone_count, description, is_visible, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING',
        [brand.id, brand.name, brand.slug, brand.logo, brand.phone_count, brand.description, brand.is_visible, brand.created_at]
      );
    }
    
    // Import mobiles
    const mobiles = JSON.parse(fs.readFileSync('mobiles_export.json', 'utf8'));
    for (const mobile of mobiles) {
      await newPool.query(
        'INSERT INTO mobiles (id, slug, name, brand, model, image_url, imagekit_path, release_date, price, short_specs, carousel_images, specifications, dimensions, build_materials, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) ON CONFLICT (id) DO NOTHING',
        [mobile.id, mobile.slug, mobile.name, mobile.brand, mobile.model, mobile.image_url, mobile.imagekit_path, mobile.release_date, mobile.price, mobile.short_specs, mobile.carousel_images, mobile.specifications, mobile.dimensions, mobile.build_materials, mobile.created_at]
      );
    }
    
    console.log('Data imported successfully!');
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await newPool.end();
  }
}

importData();
```

## 📋 Migration Checklist

- [ ] Choose a free PostgreSQL service
- [ ] Create account and new database
- [ ] Export data from Replit database
- [ ] Update DATABASE_URL in .env file
- [ ] Run database migrations (`npm run db:push`)
- [ ] Import data to new database
- [ ] Test application functionality
- [ ] Update any hardcoded database references
- [ ] Monitor usage to stay within free tier limits

## 🚨 Important Notes

1. **Backup First**: Always create a backup before migration
2. **Test Thoroughly**: Test all features after migration
3. **Monitor Usage**: Keep track of your free tier limits
4. **SSL Required**: Most cloud databases require SSL connections
5. **Connection Limits**: Free tiers often have connection limits

## 🔧 Troubleshooting

### Connection Issues
```bash
# Test connection
psql "your_new_database_url_here"
```

### SSL Certificate Issues
```bash
# Add sslmode=require to connection string
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
```

### Migration Errors
```bash
# Reset and retry migrations
npm run db:drop
npm run db:push
```

## 💡 Pro Tips

1. **Use Neon for simplicity** - Best balance of features and ease of use
2. **Keep Replit as backup** - Don't delete until migration is confirmed working
3. **Monitor free tier usage** - Set up alerts if available
4. **Consider connection pooling** - For better performance with connection limits

Need help with the migration? Follow this guide step by step, and your database will be successfully migrated to a reliable free service!