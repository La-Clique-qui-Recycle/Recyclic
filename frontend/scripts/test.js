#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Frontend Tests...\n');

try {
  // Run unit tests
  console.log('📋 Running unit tests...');
  execSync('npm run test:run', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  // Run tests with coverage
  console.log('\n📊 Running tests with coverage...');
  execSync('npm run test:coverage', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  console.log('\n✅ All tests completed successfully!');
} catch (error) {
  console.error('\n❌ Tests failed:', error.message);
  process.exit(1);
}
