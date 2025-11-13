import 'dotenv/config';
import app from './server';
import mongoose from 'mongoose';
import { createServer } from 'http';
import SocketService from './services/socketService';
import openmrsSyncService from './services/openmrsSyncService';
import { directDBSyncService } from './services/directDBSyncService';
import { getOpenMRSConfigurations, syncConfig } from './config/openmrsConfig';

const PORT = process.env['PORT'] || 5000;
// Accept either MONGODB_URI or MONGO_URI for compatibility
const MONGODB_URI = process.env['MONGODB_URI'] || process.env['MONGO_URI'] || 'mongodb://localhost:27017/patient-passport';

// Connect to MongoDB with optimizations and retry logic
const connectDB = async (maxRetries = 3, baseDelayMs = 2000) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      attempt++;
      const conn = await mongoose.connect(MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 30000, // Increased from 5s to 30s for Atlas
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000, // Increased from 10s to 30s
        heartbeatFrequencyMS: 10000,
        compressors: ['zlib'],
        readPreference: 'primary'
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return true;
    } catch (error) {
      console.error(`Database connection attempt ${attempt} failed:`, error && (error as any).message ? (error as any).message : error);
      if (attempt >= maxRetries) {
        console.error('Database connection failed after multiple attempts. Continuing in degraded mode (no DB).');
        return false;
      }
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.log(`Retrying DB connection in ${delay}ms...`);
      // eslint-disable-next-line no-await-in-loop
      await new Promise(res => setTimeout(res, delay));
    }
  }
  return false;
};

// Start server
const startServer = async () => {
  try {
    const dbConnected = await connectDB();

    // Create HTTP server
    const server = createServer(app);

    // Initialize Socket.IO (socket functionality does not require MongoDB)
    new SocketService(server);

    // Only initialize MongoDB-dependent services if DB connection succeeded
    if (dbConnected) {
      // Initialize OpenMRS Sync Service
      console.log('\n🔄 ═══════════════════════════════════════════════════════');
      console.log('🔄 Initializing OpenMRS Auto-Sync Service');
      console.log('🔄 ═══════════════════════════════════════════════════════\n');

      try {
        const hospitalConfigs = getOpenMRSConfigurations();

        if (hospitalConfigs.length > 0) {
          await openmrsSyncService.initializeConnections(hospitalConfigs);

          if (syncConfig.autoStartSync) {
            console.log(`\n🔄 Auto-starting sync service with ${syncConfig.autoSyncInterval} minute interval...\n`);
            openmrsSyncService.startAutoSync(syncConfig.autoSyncInterval);
          } else {
            console.log('\n⏸️ Auto-sync disabled. Use API endpoints to start manual sync.\n');
          }
        } else {
          console.log('\n⚠️ No OpenMRS hospital configurations found.');
          console.log('ℹ️ Configure hospitals in .env or openmrsConfig.ts to enable sync.\n');
        }
      } catch (syncError) {
        console.error('\n❌ Failed to initialize OpenMRS sync:', syncError);
        console.log('⚠️ Server will continue without OpenMRS sync capabilities.\n');
      }

      // Start scheduled observation sync service (direct DB sync)
      console.log('\n🔄 ═══════════════════════════════════════════════════════');
      console.log('🔄 Starting Direct Database Observation Sync Service');
      console.log('🔄 ═══════════════════════════════════════════════════════\n');
      directDBSyncService.start();
    } else {
      console.log('\n⚠️ MongoDB not connected - running in degraded mode.');
      console.log('   Some features (OpenMRS sync, patient/persistence endpoints) will be disabled until DB is available.\n');
    }

    server.listen(PORT, () => {
      console.log(`
 PatientPassport API Server is running!
 Server: http://localhost:${PORT}
 Documentation: http://localhost:${PORT}/api-docs
 Health Check: http://localhost:${PORT}/health
 WebSocket: ws://localhost:${PORT}
 Environment: ${process.env['NODE_ENV'] || 'development'}
 OpenMRS Sync: ${syncConfig.autoStartSync ? 'ENABLED' : 'DISABLED'}
 DB Connected: ${dbConnected ? 'YES' : 'NO'}
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};


process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});


process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();








