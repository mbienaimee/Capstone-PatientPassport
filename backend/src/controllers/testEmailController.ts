// Test email endpoint
// Add this to your auth routes for testing

import { Request, Response } from 'express';
import { asyncHandler, CustomError } from '@/middleware/errorHandler';
import { sendOTPEmail } from '@/services/simpleEmailService';

// @desc    Test email functionality
// @route   POST /api/auth/test-email
// @access  Public
export const testEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new CustomError('Email is required', 400);
  }

  try {
    // Send test OTP email
    await sendOTPEmail(email, '123456');
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      data: {
        email,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Test email error:', error);
    throw new CustomError('Failed to send test email', 500);
  }
});
