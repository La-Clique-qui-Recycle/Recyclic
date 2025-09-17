const { execSync } = require('child_process');

console.log('🧪 Test des composants admin...\n');

try {
  // Test UserListTable
  console.log('📋 Test UserListTable...');
  execSync('npm test -- --run src/test/components/business/UserListTable.test.tsx', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ UserListTable tests passed\n');
} catch (error) {
  console.log('❌ UserListTable tests failed\n');
}

try {
  // Test RoleSelector
  console.log('🎯 Test RoleSelector...');
  execSync('npm test -- --run src/test/components/business/RoleSelector.test.tsx', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ RoleSelector tests passed\n');
} catch (error) {
  console.log('❌ RoleSelector tests failed\n');
}

console.log('🏁 Tests terminés');
