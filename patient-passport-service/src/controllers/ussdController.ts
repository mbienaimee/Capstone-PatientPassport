import { Request, Response } from 'express';
import { USSDService } from '../services/ussdService';
import { logger } from '../services/logger';
import { validationResult } from 'express-validator';

export class USSDController {
  
  /**
   * Handle USSD request
   */
  public static async handleUSSDRequest(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const {
        phoneNumber,
        sessionId,
        text,
        serviceCode
      } = req.body;

      logger.info(`USSD request received: ${phoneNumber} - ${text}`);

      const response = await USSDService.processUSSDRequest(
        phoneNumber,
        sessionId,
        text,
        serviceCode
      );

      res.json({
        success: true,
        response: response
      });

    } catch (error) {
      logger.error('Error handling USSD request:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Handle Africa's Talking USSD request
   */
  public static async handleAfricaTalkingUSSD(req: Request, res: Response): Promise<void> {
    try {
      const {
        phoneNumber,
        sessionId,
        text,
        serviceCode
      } = req.body;

      logger.info(`Africa's Talking USSD request: ${phoneNumber} - ${text}`);

      const response = await USSDService.processUSSDRequest(
        phoneNumber,
        sessionId,
        text,
        serviceCode
      );

      // Africa's Talking expects specific response format
      res.set('Content-Type', 'text/plain');
      res.send(response);

    } catch (error) {
      logger.error('Error handling Africa\'s Talking USSD request:', error);
      res.set('Content-Type', 'text/plain');
      res.send('END Sorry, an error occurred. Please try again later.');
    }
  }

  /**
   * Handle Twilio USSD request
   */
  public static async handleTwilioUSSD(req: Request, res: Response): Promise<void> {
    try {
      const {
        From: phoneNumber,
        SessionId: sessionId,
        Body: text,
        To: serviceCode
      } = req.body;

      logger.info(`Twilio USSD request: ${phoneNumber} - ${text}`);

      const response = await USSDService.processUSSDRequest(
        phoneNumber,
        sessionId,
        text,
        serviceCode
      );

      // Twilio expects TwiML response
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${response}</Message>
</Response>`;

      res.set('Content-Type', 'text/xml');
      res.send(twiml);

    } catch (error) {
      logger.error('Error handling Twilio USSD request:', error);
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Sorry, an error occurred. Please try again later.</Message>
</Response>`;
      
      res.set('Content-Type', 'text/xml');
      res.send(twiml);
    }
  }

  /**
   * Get USSD session status
   */
  public static async getSessionStatus(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      // This would check session status
      // For now, return basic status
      res.json({
        success: true,
        data: {
          sessionId,
          status: 'active',
          message: 'Session is active'
        }
      });

    } catch (error) {
      logger.error('Error getting session status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Clean up expired sessions
   */
  public static async cleanupSessions(req: Request, res: Response): Promise<void> {
    try {
      USSDService.cleanupExpiredSessions();
      
      res.json({
        success: true,
        message: 'Expired sessions cleaned up successfully'
      });

    } catch (error) {
      logger.error('Error cleaning up sessions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

