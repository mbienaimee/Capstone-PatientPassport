#!/usr/bin/env node

/**
 * Rebuild Frontend for Azure Backend
 * This script clears all caches and rebuilds the frontend with Azure URLs
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Rebuilding Frontend for Azure Backend...\n');

try {
  // Step 1: Clear all caches
  console.log('1. Clearing caches...');
  
  // Remove dist folder
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
    console.log('   ✅ Removed dist folder');
  }
  
  // Remove node_modules/.vite cache
  if (fs.existsSync('node_modules/.vite')) {
    fs.rmSync('node_modules/.vite', { recursive: true, force: true });
    console.log('   ✅ Cleared Vite cache');
  }
  
  // Clear npm cache
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('   ✅ Cleared npm cache');
  
  // Step 2: Set environment variables
  console.log('\n2. Setting environment variables...');
  process.env.VITE_API_BASE_URL = 'https://patientpassport-api.azurewebsites.net/api';
  process.env.VITE_SOCKET_URL = 'https://patientpassport-api.azurewebsites.net';
  console.log('   ✅ Environment variables set');
  
  // Step 3: Install dependencies
  console.log('\n3. Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('   ✅ Dependencies installed');
  
  // Step 4: Build for production
  console.log('\n4. Building for production...');
  execSync('npm run build:prod', { stdio: 'inherit' });
  console.log('   ✅ Production build completed');
  
  // Step 5: Verify build
  console.log('\n5. Verifying build...');
  if (fs.existsSync('dist/index.html')) {
    console.log('   ✅ Build verification successful');
    
    // Check if the build contains Azure URLs
    const indexContent = fs.readFileSync('dist/index.html', 'utf8');
    if (indexContent.includes('patientpassport-api.azurewebsites.net')) {
      console.log('   ✅ Azure URLs found in build');
    } else {
      console.log('   ⚠️  Azure URLs not found in build - may need manual verification');
    }
  } else {
    console.log('   ❌ Build verification failed');
    process.exit(1);
  }
  
  console.log('\n🎉 Frontend rebuild completed successfully!');
  console.log('\n📋 Next Steps:');
  console.log('1. Test the application: npm run preview');
  console.log('2. Deploy to your hosting platform');
  console.log('3. Verify all API calls go to Azure backend');
  
  console.log('\n🔗 Backend URLs:');
  console.log('   API: https://patientpassport-api.azurewebsites.net/api');
  console.log('   Swagger: https://patientpassport-api.azurewebsites.net/api-docs');
  console.log('   Health: https://patientpassport-api.azurewebsites.net/health');
  
} catch (error) {
  console.error('\n❌ Rebuild failed:', error.message);
  process.exit(1);
}
