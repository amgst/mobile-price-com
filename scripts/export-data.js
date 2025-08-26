import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use OLD_DATABASE_URL for the source database (Replit)
// Set this in your .env file temporarily during migration
const oldDatabaseUrl = process.env.OLD_DATABASE_URL || process.env.DATABASE_URL;

if (!oldDatabaseUrl) {
  console.error('❌ Please set OLD_DATABASE_URL in your .env file with your Replit database URL');
  process.exit(1);
}

const oldPool = new Pool({
  connectionString: oldDatabaseUrl,
  ssl: oldDatabaseUrl.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function exportData() {
  console.log('🚀 Starting data export from Replit database...');
  
  try {
    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '..', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Export brands
    console.log('📦 Exporting brands...');
    const brandsResult = await oldPool.query('SELECT * FROM brands ORDER BY created_at');
    const brandsPath = path.join(exportsDir, 'brands_export.json');
    fs.writeFileSync(brandsPath, JSON.stringify(brandsResult.rows, null, 2));
    console.log(`✅ Exported ${brandsResult.rows.length} brands to ${brandsPath}`);
    
    // Export mobiles
    console.log('📱 Exporting mobiles...');
    const mobilesResult = await oldPool.query('SELECT * FROM mobiles ORDER BY created_at');
    const mobilesPath = path.join(exportsDir, 'mobiles_export.json');
    fs.writeFileSync(mobilesPath, JSON.stringify(mobilesResult.rows, null, 2));
    console.log(`✅ Exported ${mobilesResult.rows.length} mobiles to ${mobilesPath}`);
    
    // Export users (if table exists)
    try {
      console.log('👥 Exporting users...');
      const usersResult = await oldPool.query('SELECT * FROM users ORDER BY id');
      const usersPath = path.join(exportsDir, 'users_export.json');
      fs.writeFileSync(usersPath, JSON.stringify(usersResult.rows, null, 2));
      console.log(`✅ Exported ${usersResult.rows.length} users to ${usersPath}`);
    } catch (error) {
      console.log('ℹ️  Users table not found or empty, skipping...');
    }
    
    // Create a summary file
    const summary = {
      exportDate: new Date().toISOString(),
      sourceDatabase: oldDatabaseUrl.replace(/\/\/.*@/, '//***:***@'), // Hide credentials
      tables: {
        brands: brandsResult.rows.length,
        mobiles: mobilesResult.rows.length,
        users: 0 // Will be updated if users exist
      }
    };
    
    try {
      const usersResult = await oldPool.query('SELECT COUNT(*) FROM users');
      summary.tables.users = parseInt(usersResult.rows[0].count);
    } catch (error) {
      // Users table doesn't exist
    }
    
    const summaryPath = path.join(exportsDir, 'export_summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log('\n🎉 Data export completed successfully!');
    console.log('📊 Export Summary:');
    console.log(`   • Brands: ${summary.tables.brands}`);
    console.log(`   • Mobiles: ${summary.tables.mobiles}`);
    console.log(`   • Users: ${summary.tables.users}`);
    console.log(`   • Files saved to: ${exportsDir}`);
    console.log('\n📝 Next steps:');
    console.log('   1. Set up your new database (Neon, Supabase, etc.)');
    console.log('   2. Update DATABASE_URL in .env with new database URL');
    console.log('   3. Run: npm run db:push');
    console.log('   4. Run: node scripts/import-data.js');
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('   • Check if OLD_DATABASE_URL is correct');
    console.error('   • Ensure database is accessible');
    console.error('   • Verify table names match your schema');
    process.exit(1);
  } finally {
    await oldPool.end();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Export interrupted by user');
  await oldPool.end();
  process.exit(0);
});

exportData();