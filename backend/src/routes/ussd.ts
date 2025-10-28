import express from 'express';
import { handleUSSDCallback, testUSSDFlow, getUSSDStats } from '@/controllers/ussdController';
import { authenticate, authorize } from '@/middleware/auth';

const router = express.Router();

/**
 * USSD Routes for Patient Passport Access
 * 
 * Public routes:
 * - POST /callback - Africa's Talking USSD callback
 * 
 * Protected routes (Admin only):
 * - POST /test - Test USSD flow
 * - GET /stats - Get USSD statistics
 */

// Public route - Africa's Talking webhook
// This endpoint receives USSD requests from Africa's Talking
router.post('/callback', handleUSSDCallback);

// Protected routes - Admin only
router.use(authenticate);
router.use(authorize('admin'));

router.post('/test', testUSSDFlow);
router.get('/stats', getUSSDStats);

export default router;
