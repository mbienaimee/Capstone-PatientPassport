import 'dotenv/config';
import app from './server';
import mongoose from 'mongoose';
import { createServer } from 'http';
import SocketService from './services/socketService';
import openmrsSyncService from './services/openmrsSyncService';
import { getOpenMRSConfigurations, syncConfig } from './config/openmrsConfig';

const PORT = process.env['PORT'] || 5000;
const MONGODB_URI = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/patient-passport';

// Connect to MongoDB with optimizations
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000, // Increased from 5s to 30s for Atlas
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000, // Increased from 10s to 30s
      heartbeatFrequencyMS: 10000,
      compressors: ['zlib'],
      readPreference: 'primary' // Changed from secondaryPreferred to primary
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    // Create HTTP server
    const server = createServer(app);
    
    // Initialize Socket.IO
    new SocketService(server);
    
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
    
    server.listen(PORT, () => {
      console.log(`
 PatientPassport API Server is running!
 Server: http://localhost:${PORT}
 Documentation: http://localhost:${PORT}/api-docs
 Health Check: http://localhost:${PORT}/health
 WebSocket: ws://localhost:${PORT}
 Environment: ${process.env['NODE_ENV'] || 'development'}
 OpenMRS Sync: ${syncConfig.autoStartSync ? 'ENABLED' : 'DISABLED'}
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








