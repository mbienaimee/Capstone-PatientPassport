import { Request, Response, NextFunction } from 'express';
import { ussdService } from '@/services/ussdService';
import { asyncHandler } from '@/middleware/errorHandler';

/**
 * USSD Controller for Patient Passport Access
 * Handles Africa's Talking USSD callbacks
 */

// @desc    Handle USSD callback from Africa's Talking
// @route   POST /api/ussd/callback
// @access  Public (Africa's Talking webhook)
export const handleUSSDCallback = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;

  // Validate required fields
  if (!sessionId || !phoneNumber) {
    console.error(' Missing required USSD fields');
    res.set('Content-Type', 'text/plain');
    res.send('END Invalid request');
    return;
  }

  try {
    // Process USSD request
    const response = await ussdService.processUSSDRequest({
      sessionId,
      phoneNumber,
      serviceCode: serviceCode || '',
      text: text || ''
    });

    // Send response with proper content type
    res.set('Content-Type', 'text/plain');
    res.send(response);

  } catch (error: any) {
    console.error(' USSD Error:', error);
    res.set('Content-Type', 'text/plain');
    res.send('END An error occurred. Please try again later.');
  }
});

// @desc    Test USSD flow (for development)
// @route   POST /api/ussd/test
// @access  Private (Admin only)
export const testUSSDFlow = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { sessionId, phoneNumber, text } = req.body;

  if (!sessionId || !phoneNumber) {
    res.status(400).json({
      success: false,
      message: 'Missing required fields: sessionId, phoneNumber'
    });
    return;
  }

  try {
    const response = await ussdService.processUSSDRequest({
      sessionId,
      phoneNumber,
      serviceCode: '*384#',
      text: text || ''
    });

    res.json({
      success: true,
      data: {
        response,
        sessionId,
        phoneNumber,
        text
      }
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'USSD test failed'
    });
  }
});

export const getUSSDStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.json({
    success: true,
    message: 'USSD statistics endpoint',
    data: {
      totalSessions: 0,
      successfulRetrievals: 0,
      failedAttempts: 0,
      accessMethods: {
        nationalId: 0,
        email: 0
      },
      languages: {
        english: 0,
        kinyarwanda: 0
      }
    }
  });
});
