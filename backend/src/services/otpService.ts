import OTP from '@/models/OTP';
import { CustomError } from '@/middleware/errorHandler';
import { sendOTPEmail } from './simpleEmailService';

// Send OTP via SMS (using Twilio or similar service)
export const sendOTPSMS = async (phoneNumber: string, otpCode: string): Promise<void> => {
  try {
    // For now, we'll just log the OTP. In production, integrate with Twilio or similar service
    // TODO: Integrate with actual SMS service
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // 
    // await client.messages.create({
    //   body: `Your Patient Passport OTP code is: ${otpCode}. This code expires in 10 minutes.`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phoneNumber
    // });
    
  } catch (error) {
    console.error('Error sending OTP SMS:', error);
    throw new CustomError('Failed to send OTP SMS', 500);
  }
};

// Generate and send OTP
export const generateAndSendOTP = async (identifier: string, type: 'email' | 'phone'): Promise<string> => {
  try {
    // Clean up old OTPs for this identifier
    await OTP.deleteMany({
      identifier,
      type,
      $or: [
        { isUsed: true },
        { expiresAt: { $lt: new Date() } }
      ]
    });

    // Generate new OTP
    const otp = await OTP.generateOTP(identifier, type);

    // Send OTP based on type
    if (type === 'email') {
      await sendOTPEmail(identifier, otp.code);
    } else {
      await sendOTPSMS(identifier, otp.code);
    }
    return otp.code; // Return for testing purposes
  } catch (error) {
    console.error('Error generating OTP:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      identifier,
      type
    });
    throw new CustomError(`Failed to generate OTP: ${error.message}`, 500);
  }
};

// Verify OTP
export const verifyOTP = async (identifier: string, code: string, type: 'email' | 'phone'): Promise<boolean> => {
  try {
    const result = await OTP.verifyOTP(identifier, code, type);
    return result.valid;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw new CustomError('Failed to verify OTP', 500);
  }
};