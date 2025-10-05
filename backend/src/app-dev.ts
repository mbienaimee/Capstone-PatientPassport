import app from './server';

const PORT = process.env['PORT'] || 3001;

// Start server without MongoDB for development
const startServer = async () => {
  try {
    console.log('🚀 Starting PatientPassport API Server in DEVELOPMENT mode...');
    console.log('⚠️  Note: Using mock database - MongoDB not required');
    
    app.listen(PORT, () => {
      console.log(`
🚀 PatientPassport API Server is running!
📍 Server: http://localhost:${PORT}
📚 Documentation: http://localhost:${PORT}/api-docs
🏥 Health Check: http://localhost:${PORT}/health
🌍 Environment: ${process.env['NODE_ENV'] || 'development'}
⚠️  Development Mode: Using mock database
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







