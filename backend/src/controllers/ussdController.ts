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
  // Set USSD-specific headers immediately to prevent any HTML responses
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  // Log incoming request for debugging
  console.log('📱 USSD Callback received:');
  console.log('   Origin:', req.headers.origin || 'unknown');
  console.log('   User-Agent:', req.headers['user-agent'] || 'unknown');
  console.log('   Headers:', JSON.stringify(req.headers, null, 2));
  console.log('   Body:', JSON.stringify(req.body, null, 2));
  console.log('   Query:', JSON.stringify(req.query, null, 2));

  const { sessionId, serviceCode, phoneNumber, text } = req.body;

  // Validate required fields
  if (!sessionId || !phoneNumber) {
    console.error('❌ Missing required USSD fields:', { sessionId, phoneNumber });
    res.status(200).send('END Invalid request. Please try again.');
    return;
  }

  try {
    console.log(`✅ Processing USSD: Session=${sessionId}, Phone=${phoneNumber}, Text="${text}"`);
    
    // Process USSD request
    const response = await ussdService.processUSSDRequest({
      sessionId,
      phoneNumber,
      serviceCode: serviceCode || '',
      text: text || ''
    });

    // Ensure response is a string and starts with CON or END
    const ussdResponse = typeof response === 'string' 
      ? response 
      : `END ${JSON.stringify(response)}`;
    
    // Validate USSD response format
    if (!ussdResponse.startsWith('CON ') && !ussdResponse.startsWith('END ')) {
      console.warn('⚠️ USSD response missing CON/END prefix, adding END');
      const fixedResponse = ussdResponse.startsWith('CON') || ussdResponse.startsWith('END')
        ? ussdResponse
        : `END ${ussdResponse}`;
      
      console.log(`✅ USSD Response (fixed): ${fixedResponse.substring(0, 100)}...`);
      res.status(200).send(fixedResponse);
      return;
    }

    console.log(`✅ USSD Response: ${ussdResponse.substring(0, 100)}...`);

    // Send response with proper content type and headers for Africa's Talking
    res.status(200).send(ussdResponse);

  } catch (error: any) {
    console.error('❌ USSD Error:', error);
    console.error('   Error message:', error?.message);
    console.error('   Stack:', error?.stack);
    
    // Ensure error response is always plain text
    const errorMessage = 'END An error occurred. Please try again later.';
    res.status(200).send(errorMessage);
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
