import crypto from 'crypto';
import { sendOTPEmail, sendPassportAccessOTPEmail } from '@/services/simpleEmailService';

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Send OTP via email using the real email service
 */
export async function sendOTP(
  email: string, 
  otp: string, 
  type: 'email-verification' | 'passport-access' | 'password-reset',
  doctorName?: string,
  patientName?: string
): Promise<void> {
  try {
    console.log(`📧 Sending OTP Email:`);
    console.log(`   To: ${email}`);
    console.log(`   Type: ${type}`);
    console.log(`   OTP: ${otp}`);
    console.log(`   Expires: 10 minutes`);
    
    // Use the appropriate email template based on type
    if (type === 'passport-access') {
      // For passport access, use actual doctor and patient names
      const doctor = doctorName || 'Dr. Healthcare Provider';
      const patient = patientName || 'Patient';
      await sendPassportAccessOTPEmail(email, otp, doctor, patient);
    } else {
      // For other types (email-verification, password-reset)
      await sendOTPEmail(email, otp);
    }
    
    console.log(`✅ OTP email sent successfully to ${email}`);
    
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
}

/**
 * Send OTP via SMS (mock implementation)
 * In production, integrate with SMS service like Twilio, AWS SNS, etc.
 */
export async function sendOTPSMS(phoneNumber: string, otp: string, type: 'email-verification' | 'passport-access' | 'password-reset'): Promise<void> {
  try {
    // Mock SMS sending - in production, replace with actual SMS service
    console.log(`📱 OTP SMS Sent:`);
    console.log(`   To: ${phoneNumber}`);
    console.log(`   Type: ${type}`);
    console.log(`   OTP: ${otp}`);
    console.log(`   Expires: 10 minutes`);
    
    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In production, you would use an SMS service like:
    // await smsService.send({
    //   to: phoneNumber,
    //   message: `Your ${type} verification code is: ${otp}. This code expires in 10 minutes.`
    // });
    
  } catch (error) {
    console.error('Error sending OTP SMS:', error);
    throw new Error('Failed to send OTP SMS');
  }
}

/**
 * Verify OTP code format
 */
export function validateOTPFormat(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}

/**
 * Check if OTP is expired
 */
export function isOTPExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate;
}
