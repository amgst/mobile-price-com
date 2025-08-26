const { exec } = require('child_process');

console.log('🚀 Starting mobile data import...');

// Test the import service with a simple curl command
const testCommands = [
  'curl -X GET http://localhost:5000/api/admin/import/status',
  'curl -X POST http://localhost:5000/api/admin/import/latest?limit=5'
];

async function runTest() {
  for (const cmd of testCommands) {
    console.log(`\nRunning: ${cmd}`);
    
    await new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error('Error:', error.message);
          reject(error);
          return;
        }
        if (stderr) {
          console.error('Stderr:', stderr);
        }
        console.log('Response:', stdout);
        resolve();
      });
    });
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

runTest()
  .then(() => console.log('\n✅ Import test completed!'))
  .catch(error => console.error('\n❌ Import test failed:', error));