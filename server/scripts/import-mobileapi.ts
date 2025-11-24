#!/usr/bin/env tsx

import 'dotenv/config';
import { ImportService } from '../data-import/import-service.js';

async function run() {
  const limitArg = process.argv[2];
  const limitEnv = process.env.MOBILEAPI_LIMIT;
  const limit = Number.parseInt(limitArg ?? limitEnv ?? '50', 10);

  if (Number.isNaN(limit) || limit <= 0) {
    throw new Error(`Invalid limit value "${limitArg ?? limitEnv}". Provide a positive integer.`);
  }

  const importService = new ImportService();

  console.log('🚀 Starting MobileAPI.dev import runner');
  console.log(`   • Limit: ${limit}`);

  const result = await importService.importLatestMobiles(limit);

  console.log('\n📊 Import summary (MobileAPI.dev)');
  console.log(`   • Imported: ${result.success}`);
  console.log(`   • Updated: ${result.existing}`);
  console.log(`   • Total processed: ${result.processed}`);
  console.log(`   • Errors: ${result.errors.length}`);

  if (result.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    result.errors.slice(0, 10).forEach((err, idx) => {
      console.log(`   ${idx + 1}. ${err}`);
    });
    if (result.errors.length > 10) {
      console.log(`   ...and ${result.errors.length - 10} more`);
    }
  }

  console.log('\n✅ MobileAPI.dev import completed.');
}

run().catch((error) => {
  console.error('\n❌ MobileAPI.dev import failed:', error);
  process.exit(1);
});

