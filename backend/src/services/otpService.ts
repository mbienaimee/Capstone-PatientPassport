import OTP from '@/models/OTP';
import nodemailer from 'nodemailer';
import { CustomError } from '@/middleware/errorHandler';

// Email transporter configuration
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // You can change this to your email service
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
};

// Send OTP via Email
export const sendOTPEmail = async (email: string, otpCode: string): Promise<void> => {
  try {
    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'Patient Passport - OTP Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Patient Passport</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #374151; margin-bottom: 20px;">OTP Verification</h2>
            <p style="color: #6b7280; margin-bottom: 20px;">
              Your OTP code for login verification is:
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 5px;">${otpCode}</span>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              This code will expire in 10 minutes. Do not share this code with anyone.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              If you didn't request this OTP, please ignore this email.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new CustomError('Failed to send OTP email', 500);
  }
};

// Send OTP via SMS (using Twilio or similar service)
export const sendOTPSMS = async (phoneNumber: string, otpCode: string): Promise<void> => {
  try {
    // For now, we'll just log the OTP. In production, integrate with Twilio or similar service
    console.log(`SMS OTP for ${phoneNumber}: ${otpCode}`);
    
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
    throw new CustomError('Failed to generate OTP', 500);
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
