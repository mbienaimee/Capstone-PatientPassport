import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import * as swaggerUi from 'swagger-ui-express';
import * as fs from 'fs';
import * as path from 'path';
import 'express-async-errors';
import * as dotenv from 'dotenv';

import authRoutes from './routes/auth';
import patientRoutes from './routes/patients';
import hospitalRoutes from './routes/hospitals';
import medicalRoutes from './routes/medical';
import medicalRecordRoutes from './routes/medicalRecords';
import dashboardRoutes from './routes/dashboard';
import assignmentRoutes from './routes/assignments';
import accessControlRoutes from './routes/accessControl';
import notificationRoutes from './routes/notifications';
import passportAccessRoutes from './routes/passportAccess';
import emergencyAccessRoutes from './routes/emergencyAccess';
import ussdRoutes from './routes/ussd';
import openmrsSyncRoutes from './routes/openmrsSync';
import openmrsIntegrationRoutes from './routes/openmrsIntegration';
import scheduledSyncRoutes from './routes/scheduledSync';
import { getEmailStatus } from './services/simpleEmailService';
import openmrsSyncService from './services/openmrsSyncService';

// Import middleware
import { errorHandler, notFound } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import { performanceMonitor } from './middleware/performanceMonitor';

// Load environment variables
dotenv.config();

const app = express();

// Load Swagger specification from JSON file
let swaggerSpec;
try {
  swaggerSpec = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../swagger.json'), 'utf8')
  );
} catch (error) {
  console.error('Error loading swagger.json:', error);
  // Fallback swagger spec
  swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'PatientPassport API',
      version: '1.0.0',
      description: 'API documentation not available'
    },
    paths: {}
  };
}

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "blob:"],
      workerSrc: ["'self'", "blob:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://jade-pothos-e432d0.netlify.app',
  'https://patientpassport-api.azurewebsites.net',
  'https://simulator.africastalking.com', // Africa's Talking USSD Simulator
  'https://account.africastalking.com', // Africa's Talking Dashboard
  process.env['FRONTEND_URL']
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman, Africa's Talking webhooks)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (process.env['NODE_ENV'] === 'development') {
      return callback(null, true);
    }
    
    // In production, check against whitelist
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`Blocked CORS request from origin: ${origin}`);
      callback(null, true); // Still allow for now, but log the attempt
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Access-Token', 'x-access-token']
}));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env['NODE_ENV'] === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware with optimizations
app.use(express.json({ 
  limit: '10mb',
  // Performance optimizations
  strict: false,
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  // Performance optimizations
  parameterLimit: 1000
}));

// Performance monitoring
app.use(performanceMonitor);

// Rate limiting
app.use(generalLimiter);

// Health check endpoint
app.get('/health', (_req, res) => {
  const emailStatus = typeof getEmailStatus === 'function' ? getEmailStatus() : { configured: false };
  const openmrsStatus = openmrsSyncService && typeof openmrsSyncService.getStatus === 'function'
    ? openmrsSyncService.getStatus()
    : { connectedHospitals: 0, isRunning: false };

  res.status(200).json({
    success: true,
    message: 'PatientPassport API is running',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'] || 'development',
    version: '1.0.0',
    email: emailStatus,
    openmrs: openmrsStatus
  });
});

// Performance metrics endpoint
app.get('/performance', (_req, res) => {
  try {
    const { performanceMetrics, logMemoryUsage } = require('./middleware/performanceMonitor');
    const memoryUsage = logMemoryUsage();
    
    res.status(200).json({
      success: true,
      metrics: performanceMetrics.getMetrics(),
      memory: memoryUsage,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      message: 'Performance monitoring not available',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  }
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'PatientPassport API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  },
  customfavIcon: '/favicon.ico',
  customCssUrl: null,
  swaggerUrl: null
}));

// Serve raw swagger.json
app.get('/api-docs/swagger.json', (_req, res) => {
  try {
    res.json(swaggerSpec);
  } catch (error) {
    console.error('Error serving swagger.json:', error);
    res.status(500).json({ error: 'Failed to load API documentation' });
  }
});

// Handle Swagger UI static files with error handling
app.use('/api-docs', (req, res, next) => {
  // Add error handling for static files
  res.on('error', (err) => {
    console.error('Error serving Swagger static file:', err);
  });
  next();
});

// Serve static files (for USSD simulator and other tools)
app.use(express.static('public', {
  maxAge: '1d',
  etag: true
}));

// USSD Simulator page
app.get('/ussd-simulator', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/ussd-simulator.html'));
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/access-control', accessControlRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/passport-access', passportAccessRoutes);
app.use('/api/emergency-access', emergencyAccessRoutes);
app.use('/api/ussd', ussdRoutes);
app.use('/api/openmrs-sync', openmrsSyncRoutes);
app.use('/api/openmrs', openmrsIntegrationRoutes);
app.use('/api/scheduled-sync', scheduledSyncRoutes);

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Welcome to PatientPassport API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/health',
    ussdSimulator: '/ussd-simulator'
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

export default app;




