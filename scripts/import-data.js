import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { brands, mobiles, users } from '../shared/schema.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const newDatabaseUrl = process.env.DATABASE_URL;

if (!newDatabaseUrl) {
  console.error('❌ Please set DATABASE_URL in your .env file with your new database URL');
  process.exit(1);
}

const newPool = new Pool({
  connectionString: newDatabaseUrl,
  ssl: newDatabaseUrl.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function importData() {
  console.log('🚀 Starting data import to new database...');
  
  try {
    const exportsDir = path.join(__dirname, '..', 'exports');
    
    // Check if export files exist
    const brandsPath = path.join(exportsDir, 'brands_export.json');
    const mobilesPath = path.join(exportsDir, 'mobiles_export.json');
    const usersPath = path.join(exportsDir, 'users_export.json');
    
    if (!fs.existsSync(brandsPath)) {
      console.error('❌ brands_export.json not found. Please run export-data.js first.');
      process.exit(1);
    }
    
    if (!fs.existsSync(mobilesPath)) {
      console.error('❌ mobiles_export.json not found. Please run export-data.js first.');
      process.exit(1);
    }

    // Test database connection
    console.log('🔗 Testing database connection...');
    await newPool.query('SELECT 1');
    console.log('✅ Database connection successful');

    // Import brands
    console.log('📦 Importing brands...');
    const brands = JSON.parse(fs.readFileSync(brandsPath, 'utf8'));
    let brandsImported = 0;
    
    for (const brand of brands) {
      try {
        await newPool.query(
          `INSERT INTO brands (id, name, slug, logo, phone_count, description, is_visible, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
           ON CONFLICT (id) DO UPDATE SET 
           name = EXCLUDED.name,
           slug = EXCLUDED.slug,
           logo = EXCLUDED.logo,
           phone_count = EXCLUDED.phone_count,
           description = EXCLUDED.description,
           is_visible = EXCLUDED.is_visible`,
          [
            brand.id, 
            brand.name, 
            brand.slug, 
            brand.logo, 
            brand.phone_count, 
            brand.description, 
            brand.is_visible, 
            brand.created_at
          ]
        );
        brandsImported++;
      } catch (error) {
        console.warn(`⚠️  Failed to import brand ${brand.name}: ${error.message}`);
      }
    }
    console.log(`✅ Imported ${brandsImported}/${brands.length} brands`);
    
    // Import mobiles
    console.log('📱 Importing mobiles...');
    const mobiles = JSON.parse(fs.readFileSync(mobilesPath, 'utf8'));
    let mobilesImported = 0;
    
    for (const mobile of mobiles) {
      try {
        await newPool.query(
          `INSERT INTO mobiles (
            id, slug, name, brand, model, image_url, imagekit_path, 
            release_date, price, short_specs, carousel_images, 
            specifications, dimensions, build_materials, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
          ON CONFLICT (id) DO UPDATE SET 
          slug = EXCLUDED.slug,
          name = EXCLUDED.name,
          brand = EXCLUDED.brand,
          model = EXCLUDED.model,
          image_url = EXCLUDED.image_url,
          imagekit_path = EXCLUDED.imagekit_path,
          release_date = EXCLUDED.release_date,
          price = EXCLUDED.price,
          short_specs = EXCLUDED.short_specs,
          carousel_images = EXCLUDED.carousel_images,
          specifications = EXCLUDED.specifications,
          dimensions = EXCLUDED.dimensions,
          build_materials = EXCLUDED.build_materials`,
          [
            mobile.id, mobile.slug, mobile.name, mobile.brand, mobile.model,
            mobile.image_url, mobile.imagekit_path, mobile.release_date, mobile.price,
            mobile.short_specs, mobile.carousel_images, mobile.specifications,
            mobile.dimensions, mobile.build_materials, mobile.created_at
          ]
        );
        mobilesImported++;
      } catch (error) {
        console.warn(`⚠️  Failed to import mobile ${mobile.name}: ${error.message}`);
      }
    }
    console.log(`✅ Imported ${mobilesImported}/${mobiles.length} mobiles`);
    
    // Import users (if file exists)
    if (fs.existsSync(usersPath)) {
      console.log('👥 Importing users...');
      const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      let usersImported = 0;
      
      for (const user of users) {
        try {
          await newPool.query(
            `INSERT INTO users (id, username, password) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (id) DO UPDATE SET 
             username = EXCLUDED.username,
             password = EXCLUDED.password`,
            [user.id, user.username, user.password]
          );
          usersImported++;
        } catch (error) {
          console.warn(`⚠️  Failed to import user ${user.username}: ${error.message}`);
        }
      }
      console.log(`✅ Imported ${usersImported}/${users.length} users`);
    } else {
      console.log('ℹ️  No users file found, skipping user import');
    }
    
    // Verify import
    console.log('\n🔍 Verifying import...');
    const brandCount = await newPool.query('SELECT COUNT(*) FROM brands');
    const mobileCount = await newPool.query('SELECT COUNT(*) FROM mobiles');
    let userCount = { rows: [{ count: '0' }] };
    
    try {
      userCount = await newPool.query('SELECT COUNT(*) FROM users');
    } catch (error) {
      // Users table might not exist
    }
    
    console.log('\n🎉 Data import completed successfully!');
    console.log('📊 Final Database Counts:');
    console.log(`   • Brands: ${brandCount.rows[0].count}`);
    console.log(`   • Mobiles: ${mobileCount.rows[0].count}`);
    console.log(`   • Users: ${userCount.rows[0].count}`);
    
    console.log('\n📝 Next steps:');
    console.log('   1. Test your application: npm run dev');
    console.log('   2. Verify all data is working correctly');
    console.log('   3. Update any remaining references to old database');
    console.log('   4. Remove OLD_DATABASE_URL from .env file');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('   • Check if DATABASE_URL is correct');
    console.error('   • Ensure database schema is set up (run: npm run db:push)');
    console.error('   • Verify export files exist in exports/ directory');
    console.error('   • Check database permissions');
    process.exit(1);
  } finally {
    await newPool.end();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Import interrupted by user');
  await newPool.end();
  process.exit(0);
});

importData();