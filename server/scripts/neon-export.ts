#!/usr/bin/env tsx

import { db } from '../db.js';
import { storage } from '../storage.js';
import { createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createNeonExport() {
  console.log('🚀 Creating Neon Database Export...');
  
  try {
    // Get all data from storage
    const [brands, mobiles] = await Promise.all([
      storage.getAllBrands(),
      storage.getAllMobiles()
    ]);

    console.log(`📊 Database Statistics:`);
    console.log(`   - Brands: ${brands.length}`);
    console.log(`   - Mobiles: ${mobiles.length}`);

    // Create Neon-optimized SQL export
    await createNeonSQL(brands, mobiles);
    
    // Create JSON export for backup
    await createNeonJSON(brands, mobiles);
    
    // Create migration script
    await createMigrationScript();
    
    console.log(`✅ Neon export completed successfully!`);
    console.log(`📁 Files created:`);
    console.log(`   - neon-database.sql (SQL import)`);
    console.log(`   - neon-database.json (JSON backup)`);
    console.log(`   - neon-migration.sh (deployment script)`);
    
  } catch (error) {
    console.error('❌ Neon export failed:', error);
    process.exit(1);
  }
}

async function createNeonSQL(brands: any[], mobiles: any[]) {
  const sqlPath = path.join(__dirname, '..', '..', 'neon-database.sql');
  const writeStream = createWriteStream(sqlPath);
  
  // Write Neon-optimized SQL header
  writeStream.write('-- Mobile Price Database - Neon Export\n');
  writeStream.write(`-- Generated: ${new Date().toISOString()}\n`);
  writeStream.write(`-- Optimized for Neon Serverless PostgreSQL\n`);
  writeStream.write(`-- Brands: ${brands.length}, Mobiles: ${mobiles.length}\n\n`);
  
  // Create tables with Neon optimizations
  writeStream.write('-- Create tables if not exists\n');
  writeStream.write(`
CREATE TABLE IF NOT EXISTS brands (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  logo VARCHAR(255),
  "isVisible" BOOLEAN DEFAULT true,
  "phoneCount" VARCHAR(10) DEFAULT '0',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_brands_visible ON brands("isVisible");

CREATE TABLE IF NOT EXISTS mobiles (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  brand VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  image TEXT,
  specs JSONB,
  images JSONB,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mobiles_slug ON mobiles(slug);
CREATE INDEX IF NOT EXISTS idx_mobiles_brand ON mobiles(brand);
CREATE INDEX IF NOT EXISTS idx_mobiles_price ON mobiles(price);
CREATE INDEX IF NOT EXISTS idx_mobiles_specs ON mobiles USING GIN (specs);

`);
  
  // Clear existing data
  writeStream.write('-- Clear existing data\n');
  writeStream.write('TRUNCATE TABLE mobiles CASCADE;\n');
  writeStream.write('TRUNCATE TABLE brands CASCADE;\n\n');
  
  // Insert brands
  writeStream.write('-- Insert brands\n');
  for (const brand of brands) {
    const values = [
      `'${brand.id}'`,
      `'${brand.name.replace(/'/g, "''")}'`,
      `'${brand.slug}'`,
      brand.description ? `'${brand.description.replace(/'/g, "''")}'` : 'NULL',
      brand.logo ? `'${brand.logo.replace(/'/g, "''")}'` : 'NULL',
      brand.isVisible !== undefined ? brand.isVisible : 'true',
      brand.phoneCount ? `'${brand.phoneCount}'` : "'0'",
      `'${brand.createdAt || new Date().toISOString()}'`,
      `'${brand.updatedAt || new Date().toISOString()}'`
    ];
    
    writeStream.write(
      `INSERT INTO brands (id, name, slug, description, logo, "isVisible", "phoneCount", "createdAt", "updatedAt") VALUES (${values.join(', ')}) ON CONFLICT (id) DO NOTHING;\n`
    );
  }
  
  // Insert mobiles in batches for Neon efficiency
  writeStream.write('\n-- Insert mobiles\n');
  for (const mobile of mobiles) {
    const specs = JSON.stringify(mobile.specs || {}).replace(/'/g, "''");
    const images = JSON.stringify(mobile.images || []).replace(/'/g, "''");
    
    const values = [
      `'${mobile.id}'`,
      `'${mobile.name.replace(/'/g, "''")}'`,
      `'${mobile.slug}'`,
      `'${mobile.brand}'`,
      mobile.description ? `'${mobile.description.replace(/'/g, "''")}'` : 'NULL',
      mobile.price ? mobile.price.toString() : 'NULL',
      mobile.image ? `'${mobile.image.replace(/'/g, "''")}'` : 'NULL',
      `'${specs}'`,
      `'${images}'`,
      `'${mobile.createdAt || new Date().toISOString()}'`,
      `'${mobile.updatedAt || new Date().toISOString()}'`
    ];
    
    writeStream.write(
      `INSERT INTO mobiles (id, name, slug, brand, description, price, image, specs, images, "createdAt", "updatedAt") VALUES (${values.join(', ')}) ON CONFLICT (id) DO NOTHING;\n`
    );
  }
  
  // Add final optimizations
  writeStream.write('\n-- Final optimizations\n');
  writeStream.write('ANALYZE brands;\n');
  writeStream.write('ANALYZE mobiles;\n');
  
  writeStream.end();
}

async function createNeonJSON(brands: any[], mobiles: any[]) {
  const jsonPath = path.join(__dirname, '..', '..', 'neon-database.json');
  
  const exportData = {
    metadata: {
      timestamp: new Date().toISOString(),
      version: '2.0',
      platform: 'neon',
      statistics: {
        totalBrands: brands.length,
        totalMobiles: mobiles.length,
        brandDistribution: getBrandDistribution(mobiles),
        priceRanges: getPriceRanges(mobiles)
      }
    },
    schema: {
      brands: {
        columns: ['id', 'name', 'slug', 'description', 'logo', 'isVisible', 'phoneCount', 'createdAt', 'updatedAt'],
        indexes: ['slug', 'isVisible']
      },
      mobiles: {
        columns: ['id', 'name', 'slug', 'brand', 'description', 'price', 'image', 'specs', 'images', 'createdAt', 'updatedAt'],
        indexes: ['slug', 'brand', 'price', 'specs']
      }
    },
    data: {
      brands: brands,
      mobiles: mobiles
    }
  };

  const writeStream = createWriteStream(jsonPath);
  writeStream.write(JSON.stringify(exportData, null, 2));
  writeStream.end();
}

async function createMigrationScript() {
  const scriptPath = path.join(__dirname, '..', '..', 'neon-migration.sh');
  const script = `#!/bin/bash

# Neon Database Migration Script for mobile-price.com
# This script deploys your mobile database to Neon

echo "🚀 Neon Database Migration for mobile-price.com"
echo "=============================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable not set"
    echo "Please set your Neon database connection string:"
    echo "export DATABASE_URL='postgresql://username:password@your-neon-host/dbname'"
    exit 1
fi

# Validate connection
echo "📡 Testing database connection..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ ERROR: Cannot connect to database"
    echo "Please check your DATABASE_URL and network connection"
    exit 1
fi

echo "✅ Database connection successful"

# Import the schema and data
echo "📥 Importing database schema and data..."
if psql "$DATABASE_URL" -f neon-database.sql; then
    echo "✅ Database import completed successfully!"
    
    # Verify the import
    echo "📊 Verifying import..."
    BRAND_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM brands;")
    MOBILE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM mobiles;")
    
    echo "   - Brands imported: $BRAND_COUNT"
    echo "   - Mobiles imported: $MOBILE_COUNT"
    
    echo ""
    echo "🎉 Migration completed successfully!"
    echo "Your mobile-price.com database is now ready on Neon"
    echo ""
    echo "Next steps:"
    echo "1. Update your application's DATABASE_URL"
    echo "2. Deploy your application to your chosen platform"
    echo "3. Test the mobile comparison features"
    
else
    echo "❌ ERROR: Database import failed"
    exit 1
fi
`;

  const writeStream = createWriteStream(scriptPath);
  writeStream.write(script);
  writeStream.end();
  
  // Make script executable
  const { exec } = await import('child_process');
  exec(`chmod +x ${scriptPath}`);
}

function getBrandDistribution(mobiles: any[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  mobiles.forEach(mobile => {
    distribution[mobile.brand] = (distribution[mobile.brand] || 0) + 1;
  });
  return distribution;
}

function getPriceRanges(mobiles: any[]): Record<string, number> {
  const ranges = {
    'Under PKR 50K': 0,
    'PKR 50K-100K': 0,
    'PKR 100K-200K': 0,
    'Above PKR 200K': 0,
    'No Price': 0
  };
  
  mobiles.forEach(mobile => {
    if (!mobile.price) {
      ranges['No Price']++;
    } else if (mobile.price < 50000) {
      ranges['Under PKR 50K']++;
    } else if (mobile.price < 100000) {
      ranges['PKR 50K-100K']++;
    } else if (mobile.price < 200000) {
      ranges['PKR 100K-200K']++;
    } else {
      ranges['Above PKR 200K']++;
    }
  });
  
  return ranges;
}

// Run export if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createNeonExport().catch(console.error);
}

export { createNeonExport };