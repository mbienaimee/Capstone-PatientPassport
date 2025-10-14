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

// Import middleware
import { errorHandler, notFound } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import { performanceMonitor } from './middleware/performanceMonitor';

// Load environment variables
dotenv.config();

const app = express();

// Load Swagger specification from JSON file
const swaggerSpec = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../swagger.json'), 'utf8')
);

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-access-token']
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
  res.status(200).json({
    success: true,
    message: 'PatientPassport API is running',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'] || 'development',
    version: '1.0.0'
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
  customSiteTitle: 'PatientPassport API Documentation'
}));

// Serve raw swagger.json
app.get('/api-docs/swagger.json', (_req, res) => {
  res.json(swaggerSpec);
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

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Welcome to PatientPassport API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/health'
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




