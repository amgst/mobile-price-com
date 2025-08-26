import { ImportService } from '../data-import/import-service.js';

async function testImport() {
  console.log('🚀 Starting Mobile Data Import Test');
  console.log('====================================');
  
  const importService = new ImportService();

  try {
    // Test 1: Get current status
    console.log('\n📊 Getting current database status...');
    const initialStatus = await importService.getImportStatus();
    console.log(`Current status: ${initialStatus.totalBrands} brands, ${initialStatus.totalMobiles} mobiles`);

    // Test 2: Import brands first
    console.log('\n🏢 Testing brand import...');
    const brandResults = await importService.importBrands();
    console.log(`Brand import result: ${brandResults.success} imported, ${brandResults.errors.length} errors`);
    
    if (brandResults.errors.length > 0) {
      console.log('Brand import errors:', brandResults.errors.slice(0, 3));
    }

    // Test 3: Import a few latest mobiles
    console.log('\n📱 Testing latest mobiles import (limit 5)...');
    const mobileResults = await importService.importLatestMobiles(5);
    console.log(`Mobile import result: ${mobileResults.success} imported, ${mobileResults.errors.length} errors`);
    
    if (mobileResults.errors.length > 0) {
      console.log('Mobile import errors:', mobileResults.errors.slice(0, 3));
    }

    // Test 4: Search and import specific phones
    console.log('\n🔍 Testing search import for "iPhone"...');
    const searchResults = await importService.searchAndImportMobiles('iPhone', 3);
    console.log(`Search import result: ${searchResults.success} imported, ${searchResults.errors.length} errors`);

    // Test 5: Get final status
    console.log('\n📊 Getting final database status...');
    const finalStatus = await importService.getImportStatus();
    console.log(`Final status: ${finalStatus.totalBrands} brands, ${finalStatus.totalMobiles} mobiles`);

    console.log('\n✅ Import test completed successfully!');
    console.log(`Total imported: ${finalStatus.totalBrands - initialStatus.totalBrands} brands, ${finalStatus.totalMobiles - initialStatus.totalMobiles} mobiles`);

  } catch (error) {
    console.error('\n❌ Import test failed:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testImport()
    .then(() => {
      console.log('\n🎉 All tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test script failed:', error);
      process.exit(1);
    });
}

export { testImport };