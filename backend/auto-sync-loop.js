/**
 * Auto-Sync Loop Script
 * Runs manual sync every 10 seconds continuously
 * This is a workaround for the auto-sync service connection timeout issue
 */

const { spawn } = require('child_process');

const SYNC_INTERVAL_MS = 10000; // 10 seconds

console.log('🔄 Starting OpenMRS Auto-Sync Loop');
console.log(`⏱️  Sync interval: ${SYNC_INTERVAL_MS / 1000} seconds\n`);

let syncCount = 0;

function runSync() {
  syncCount++;
  console.log(`\n🔄 [${new Date().toLocaleTimeString()}] Starting sync #${syncCount}...`);
  
  const sync = spawn('node', ['sync-today-direct.js'], {
    cwd: __dirname,
    stdio: 'inherit'
  });

  sync.on('error', (error) => {
    console.error(`❌ Sync error:`, error);
  });

  sync.on('close', (code) => {
    if (code === 0) {
      console.log(`✅ [${new Date().toLocaleTimeString()}] Sync #${syncCount} completed successfully`);
    } else {
      console.log(`⚠️  [${new Date().toLocaleTimeString()}] Sync #${syncCount} exited with code ${code}`);
    }
    console.log(`⏳ Next sync in ${SYNC_INTERVAL_MS / 1000} seconds...`);
  });
}

// Run initial sync
runSync();

// Schedule periodic syncs
setInterval(runSync, SYNC_INTERVAL_MS);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down auto-sync loop...');
  console.log(`📊 Total syncs performed: ${syncCount}`);
  process.exit(0);
});

console.log('✅ Auto-sync loop started. Press Ctrl+C to stop.');
