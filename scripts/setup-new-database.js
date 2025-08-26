import fs from 'fs';
import path from 'path';
import readline from 'readline';
import dotenv from 'dotenv';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Load environment variables
dotenv.config();

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupNewDatabase() {
  console.log('🚀 Database Migration Setup Wizard');
  console.log('=====================================\n');
  
  console.log('This wizard will help you set up your new database connection.');
  console.log('Make sure you have already:');
  console.log('  ✅ Created an account with a database provider (Neon, Supabase, etc.)');
  console.log('  ✅ Created a new database/project');
  console.log('  ✅ Obtained the connection string\n');
  
  const proceed = await question('Ready to proceed? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    console.log('Setup cancelled.');
    rl.close();
    return;
  }
  
  console.log('\n📋 Database Provider Options:');
  console.log('1. Neon (Recommended - https://neon.tech)');
  console.log('2. Supabase (https://supabase.com)');
  console.log('3. Railway (https://railway.app)');
  console.log('4. Other PostgreSQL service');
  
  const provider = await question('\nSelect your provider (1-4): ');
  
  const providerNames = {
    '1': 'Neon',
    '2': 'Supabase', 
    '3': 'Railway',
    '4': 'Other'
  };
  
  const selectedProvider = providerNames[provider] || 'Other';
  console.log(`\n✅ Selected: ${selectedProvider}`);
  
  // Get current DATABASE_URL for backup
  const envPath = path.join(__dirname, '..', '.env');
  let currentEnv = '';
  let currentDatabaseUrl = '';
  
  if (fs.existsSync(envPath)) {
    currentEnv = fs.readFileSync(envPath, 'utf8');
    const match = currentEnv.match(/DATABASE_URL=(.+)/);
    if (match) {
      currentDatabaseUrl = match[1];
    }
  }
  
  console.log('\n🔗 Database Connection String');
  console.log('This should look like:');
  
  switch (provider) {
    case '1': // Neon
      console.log('postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require');
      break;
    case '2': // Supabase
      console.log('postgresql://postgres:password@db.xxx.supabase.co:5432/postgres');
      break;
    case '3': // Railway
      console.log('postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway');
      break;
    default:
      console.log('postgresql://username:password@host:port/database');
  }
  
  const newDatabaseUrl = await question('\nEnter your new DATABASE_URL: ');
  
  if (!newDatabaseUrl.startsWith('postgresql://')) {
    console.log('❌ Invalid database URL. Must start with postgresql://');
    rl.close();
    return;
  }
  
  // Backup current .env if it has a different DATABASE_URL
  if (currentDatabaseUrl && currentDatabaseUrl !== newDatabaseUrl) {
    const backupPath = path.join(__dirname, '..', '.env.backup');
    fs.writeFileSync(backupPath, currentEnv);
    console.log(`\n💾 Backed up current .env to .env.backup`);
    
    // Add OLD_DATABASE_URL for migration
    const addOldUrl = await question('\nAdd current DATABASE_URL as OLD_DATABASE_URL for migration? (y/n): ');
    if (addOldUrl.toLowerCase() === 'y') {
      const updatedEnv = currentEnv.replace(
        /DATABASE_URL=.+/,
        `DATABASE_URL=${newDatabaseUrl}\nOLD_DATABASE_URL=${currentDatabaseUrl}`
      );
      fs.writeFileSync(envPath, updatedEnv);
      console.log('✅ Updated .env with new DATABASE_URL and OLD_DATABASE_URL');
    } else {
      const updatedEnv = currentEnv.replace(/DATABASE_URL=.+/, `DATABASE_URL=${newDatabaseUrl}`);
      fs.writeFileSync(envPath, updatedEnv);
      console.log('✅ Updated .env with new DATABASE_URL');
    }
  } else {
    // Create or update .env
    const envContent = currentEnv.replace(/DATABASE_URL=.+/, `DATABASE_URL=${newDatabaseUrl}`) || 
      `DATABASE_URL=${newDatabaseUrl}\n`;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env with new DATABASE_URL');
  }
  
  console.log('\n🎉 Database setup complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Set up database schema:');
  console.log('   npm run db:push');
  console.log('\n2. If migrating from existing database:');
  console.log('   npm run db:export  # Export from old database');
  console.log('   npm run db:import  # Import to new database');
  console.log('\n3. Test your application:');
  console.log('   npm run dev');
  
  console.log('\n📚 For detailed migration instructions, see:');
  console.log('   DATABASE_MIGRATION_GUIDE.md');
  
  rl.close();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Setup cancelled by user');
  rl.close();
  process.exit(0);
});

setupNewDatabase().catch(error => {
  console.error('❌ Setup failed:', error.message);
  rl.close();
  process.exit(1);
});