import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Patient Passport Service is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Basic routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Patient Passport Service',
    version: '1.0.0'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Patient Passport Service running on port ${PORT}`);
});

export default app;
































