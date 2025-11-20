import express from 'express';
import {
  getSystemHealth,
  getResponseTime,
  getAccuracy,
  getUsability,
  getEndpointPerformance,
  trackUsabilityMetric,
  trackAccuracyMetric,
  getDashboard
} from '@/controllers/metricsController';
import { authenticate, authorize } from '@/middleware/auth';

const router = express.Router();

/**
 * Metrics Routes
 * All routes require authentication
 * Admin-only routes are marked
 */

// Public metrics (authenticated users)
router.post('/usability', authenticate, trackUsabilityMetric);

// Admin-only routes
router.use(authenticate);
router.use(authorize('admin'));

router.get('/health', getSystemHealth);
router.get('/dashboard', getDashboard);
router.get('/response-time', getResponseTime);
router.get('/accuracy', getAccuracy);
router.get('/usability', getUsability);
router.get('/endpoints', getEndpointPerformance);
router.post('/accuracy', trackAccuracyMetric);

export default router;
