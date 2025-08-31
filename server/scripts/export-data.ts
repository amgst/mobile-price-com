#!/usr/bin/env tsx

import { db } from '../db.js';
import { storage } from '../storage.js';
import { createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportDatabase() {
  console.log('Starting database export...');
  
  try {
    // Get all data from storage
    const [brands, mobiles] = await Promise.all([
      storage.getAllBrands(),
      storage.getAllMobiles()
    ]);

    // Create export data structure
    const exportData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      statistics: {
        totalBrands: brands.length,
        totalMobiles: mobiles.length
      },
      brands: brands,
      mobiles: mobiles
    };

    // Export to JSON file
    const exportPath = path.join(__dirname, '..', '..', 'database-export.json');
    const writeStream = createWriteStream(exportPath);
    
    writeStream.write(JSON.stringify(exportData, null, 2));
    writeStream.end();

    console.log(`✅ Database exported successfully!`);
    console.log(`📁 File: ${exportPath}`);
    console.log(`📊 Exported: ${brands.length} brands, ${mobiles.length} mobiles`);
    
    // Also create a SQL export format for easier migration
    await createSQLExport(brands, mobiles);
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

async function createSQLExport(brands: any[], mobiles: any[]) {
  const sqlPath = path.join(__dirname, '..', '..', 'database-export.sql');
  const writeStream = createWriteStream(sqlPath);
  
  // Write SQL header
  writeStream.write('-- Mobile Price Database Export\n');
  writeStream.write(`-- Generated: ${new Date().toISOString()}\n`);
  writeStream.write(`-- Brands: ${brands.length}, Mobiles: ${mobiles.length}\n\n`);
  
  // Export brands
  writeStream.write('-- Brands Data\n');
  writeStream.write('TRUNCATE TABLE brands CASCADE;\n');
  
  for (const brand of brands) {
    const values = [
      `'${brand.id}'`,
      `'${brand.name.replace(/'/g, "''")}'`,
      `'${brand.slug}'`,
      brand.description ? `'${brand.description.replace(/'/g, "''")}'` : 'NULL',
      brand.logo ? `'${brand.logo}'` : 'NULL',
      `'${brand.createdAt || new Date().toISOString()}'`,
      `'${brand.updatedAt || new Date().toISOString()}'`
    ];
    
    writeStream.write(
      `INSERT INTO brands (id, name, slug, description, logo, "createdAt", "updatedAt") VALUES (${values.join(', ')});\n`
    );
  }
  
  // Export mobiles
  writeStream.write('\n-- Mobiles Data\n');
  writeStream.write('TRUNCATE TABLE mobiles CASCADE;\n');
  
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
      mobile.image ? `'${mobile.image}'` : 'NULL',
      `'${specs}'`,
      `'${images}'`,
      `'${mobile.createdAt || new Date().toISOString()}'`,
      `'${mobile.updatedAt || new Date().toISOString()}'`
    ];
    
    writeStream.write(
      `INSERT INTO mobiles (id, name, slug, brand, description, price, image, specs, images, "createdAt", "updatedAt") VALUES (${values.join(', ')});\n`
    );
  }
  
  writeStream.end();
  console.log(`📝 SQL export: ${sqlPath}`);
}

// Run export if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exportDatabase().catch(console.error);
}

export { exportDatabase };