import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const execAsync = util.promisify(exec);
const newDatabaseUrl = process.env.DATABASE_URL;

if (!newDatabaseUrl) {
  console.error('❌ Please set DATABASE_URL in your .env file with your Neon database URL');
  process.exit(1);
}

async function importNeonExport() {
  console.log('🚀 Starting Neon export import...');
  
  try {
    const projectRoot = path.join(__dirname, '..');
    
    // Check for Replit Neon export files
    const neonSqlPath = path.join(projectRoot, 'neon-database.sql');
    const neonJsonPath = path.join(projectRoot, 'neon-database.json');
    const neonScriptPath = path.join(projectRoot, 'neon-migration.sh');
    const neonGuidePath = path.join(projectRoot, 'NEON_DEPLOYMENT.md');
    
    console.log('🔍 Checking for Replit Neon export files...');
    
    const hasNeonSql = fs.existsSync(neonSqlPath);
    const hasNeonJson = fs.existsSync(neonJsonPath);
    const hasNeonScript = fs.existsSync(neonScriptPath);
    const hasNeonGuide = fs.existsSync(neonGuidePath);
    
    console.log(`   • neon-database.sql: ${hasNeonSql ? '✅ Found' : '❌ Missing'}`);
    console.log(`   • neon-database.json: ${hasNeonJson ? '✅ Found' : '❌ Missing'}`);
    console.log(`   • neon-migration.sh: ${hasNeonScript ? '✅ Found' : '❌ Missing'}`);
    console.log(`   • NEON_DEPLOYMENT.md: ${hasNeonGuide ? '✅ Found' : '❌ Missing'}`);
    
    if (!hasNeonSql && !hasNeonJson) {
      console.log('\n❌ No Replit Neon export files found.');
      console.log('\n📝 Please:');
      console.log('   1. Download the Neon export files from your Replit project');
      console.log('   2. Place them in your project root directory');
      console.log('   3. Run this script again');
      console.log('\n💡 Alternative: Use our standard migration scripts:');
      console.log('   npm run db:export  # Export from Replit');
      console.log('   npm run db:import  # Import to Neon');
      process.exit(1);
    }
    
    // Test database connection
    console.log('\n🔗 Testing Neon database connection...');
    const pool = new Pool({
      connectionString: newDatabaseUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    try {
      await pool.query('SELECT 1');
      console.log('✅ Neon database connection successful');
    } catch (error) {
      console.error('❌ Failed to connect to Neon database:', error.message);
      console.log('\n🔍 Troubleshooting:');
      console.log('   • Check if DATABASE_URL is correct');
      console.log('   • Ensure your Neon database is running');
      console.log('   • Verify SSL settings');
      process.exit(1);
    }
    
    // Import using SQL file (preferred method)
    if (hasNeonSql) {
      console.log('\n📦 Importing from neon-database.sql...');
      
      try {
        // Use psql to import the SQL file
        const command = `psql "${newDatabaseUrl}" < "${neonSqlPath}"`;
        console.log('⚡ Running optimized PostgreSQL import...');
        
        const { stdout, stderr } = await execAsync(command);
        
        if (stderr && !stderr.includes('NOTICE')) {
          console.warn('⚠️  Import warnings:', stderr);
        }
        
        console.log('✅ SQL import completed successfully');
        
        // Verify the import
        console.log('\n🔍 Verifying import...');
        const brandCount = await pool.query('SELECT COUNT(*) FROM brands');
        const mobileCount = await pool.query('SELECT COUNT(*) FROM mobiles');
        let userCount = { rows: [{ count: '0' }] };
        
        try {
          userCount = await pool.query('SELECT COUNT(*) FROM users');
        } catch (error) {
          // Users table might not exist
        }
        
        console.log('📊 Import Results:');
        console.log(`   • Brands: ${brandCount.rows[0].count}`);
        console.log(`   • Mobiles: ${mobileCount.rows[0].count}`);
        console.log(`   • Users: ${userCount.rows[0].count}`);
        
      } catch (error) {
        console.error('❌ SQL import failed:', error.message);
        
        if (hasNeonJson) {
          console.log('\n🔄 Falling back to JSON import...');
          await importFromJson(pool, neonJsonPath);
        } else {
          throw error;
        }
      }
    } else if (hasNeonJson) {
      console.log('\n📦 Importing from neon-database.json...');
      await importFromJson(pool, neonJsonPath);
    }
    
    await pool.end();
    
    console.log('\n🎉 Neon import completed successfully!');
    
    // Show additional files info
    if (hasNeonScript) {
      console.log('\n📜 Found neon-migration.sh script for automated deployment');
    }
    
    if (hasNeonGuide) {
      console.log('📖 Found NEON_DEPLOYMENT.md for detailed deployment instructions');
    }
    
    console.log('\n📝 Next steps:');
    console.log('   1. Test your application: npm run dev');
    console.log('   2. Verify all data is working correctly');
    console.log('   3. Deploy to your preferred platform (Railway, Vercel, Render)');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('   • Ensure Neon database is accessible');
    console.error('   • Check if psql is installed and in PATH');
    console.error('   • Verify export files are not corrupted');
    console.error('   • Try manual import: psql "$DATABASE_URL" < neon-database.sql');
    process.exit(1);
  }
}

async function importFromJson(pool, jsonPath) {
  console.log('📄 Processing JSON backup...');
  
  try {
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    // Access the nested data structure
    const tableData = jsonData.data || jsonData;
    
    if (tableData.brands) {
      console.log(`📦 Importing ${tableData.brands.length} brands...`);
      for (const brand of tableData.brands) {
        await pool.query(
          `INSERT INTO brands (id, name, slug, logo, phone_count, description, is_visible, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
           ON CONFLICT (id) DO UPDATE SET 
           name = EXCLUDED.name, slug = EXCLUDED.slug`,
          [brand.id, brand.name, brand.slug, brand.logo, brand.phone_count, brand.description, brand.is_visible, brand.created_at]
        );
      }
    }
    
    if (tableData.mobiles) {
      console.log(`📱 Importing ${tableData.mobiles.length} mobiles...`);
      for (const mobile of tableData.mobiles) {
        await pool.query(
          `INSERT INTO mobiles (
            id, slug, name, brand, model, image_url, imagekit_path, 
            release_date, price, short_specs, carousel_images, 
            specifications, dimensions, build_materials, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
          ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
          [
            mobile.id, mobile.slug, mobile.name, mobile.brand, mobile.model,
            mobile.imageUrl || mobile.image_url, mobile.imagekitPath || mobile.imagekit_path, 
            mobile.releaseDate || mobile.release_date, mobile.price,
            JSON.stringify(mobile.shortSpecs || mobile.short_specs || {}), 
            JSON.stringify(mobile.carouselImages || mobile.carousel_images || []),
            JSON.stringify(mobile.specifications || []),
            JSON.stringify(mobile.dimensions || null), 
            JSON.stringify(mobile.buildMaterials || mobile.build_materials || null), 
            mobile.createdAt || mobile.created_at
          ]
        );
      }
    }
    
    if (tableData.users) {
      console.log(`👥 Importing ${tableData.users.length} users...`);
      for (const user of tableData.users) {
        await pool.query(
          `INSERT INTO users (id, username, password) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username`,
          [user.id, user.username, user.password]
        );
      }
    }
    
    console.log('✅ JSON import completed');
    
  } catch (error) {
    console.error('❌ JSON import failed:', error.message);
    throw error;
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Import interrupted by user');
  process.exit(0);
});

importNeonExport();