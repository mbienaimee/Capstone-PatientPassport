import 'dotenv/config';
import app from './server';
import mongoose from 'mongoose';
import { createServer } from 'http';
import SocketService from './services/socketService';

const PORT = process.env['PORT'] || 5000;
const MONGODB_URI = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/patient-passport';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
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
    
    server.listen(PORT, () => {
      console.log(`
🚀 PatientPassport API Server is running!
📍 Server: http://localhost:${PORT}
📚 Documentation: http://localhost:${PORT}/api-docs
🏥 Health Check: http://localhost:${PORT}/health
🔌 WebSocket: ws://localhost:${PORT}
🌍 Environment: ${process.env['NODE_ENV'] || 'development'}
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();








