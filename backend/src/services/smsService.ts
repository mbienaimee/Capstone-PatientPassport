import AfricasTalking from 'africastalking';
import { CustomError } from '@/middleware/errorHandler';

/**
 * SMS Service using Africa's Talking API
 */

interface SMSResult {
  status: string;
  messageId: string;
  cost: string;
}

class SMSService {
  private client: any;
  private sms: any;
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Africa's Talking client
   */
  private initialize(): void {
    try {
      const apiKey = process.env.AFRICASTALKING_API_KEY;
      const username = process.env.AFRICASTALKING_USERNAME;

      if (!apiKey || !username) {
        console.warn('⚠️ Africa\'s Talking credentials not configured. SMS service will not work.');
        this.isInitialized = false;
        return;
      }

      this.client = AfricasTalking({
        apiKey,
        username
      });

      this.sms = this.client.SMS;
      this.isInitialized = true;

      console.log('✅ Africa\'s Talking SMS service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Africa\'s Talking:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Send SMS message
   */
  async sendSMS(to: string | string[], message: string, from?: string): Promise<SMSResult> {
    if (!this.isInitialized) {
      throw new CustomError('SMS service not initialized. Please check Africa\'s Talking credentials.', 500);
    }

    try {
      // Normalize phone numbers to E.164 format
      const recipients = Array.isArray(to) ? to : [to];
      const formattedRecipients = recipients.map(phone => this.formatPhoneNumber(phone));

      console.log(`📤 Sending SMS to: ${formattedRecipients.join(', ')}`);
      console.log(`   Message: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);

      const options: any = {
        to: formattedRecipients,
        message: message
      };

      // Add sender ID if provided
      if (from) {
        options.from = from;
      }

      const response = await this.sms.send(options);

      console.log('✅ SMS sent successfully:', response);

      // Parse response
      if (response.SMSMessageData && response.SMSMessageData.Recipients) {
        const recipient = response.SMSMessageData.Recipients[0];
        
        if (recipient.status === 'Success') {
          return {
            status: 'success',
            messageId: recipient.messageId,
            cost: recipient.cost
          };
        } else {
          throw new CustomError(`SMS failed: ${recipient.status}`, 500);
        }
      }

      throw new CustomError('Invalid SMS response', 500);

    } catch (error: any) {
      console.error('❌ SMS Error:', error);
      throw new CustomError(
        error.message || 'Failed to send SMS',
        error.statusCode || 500
      );
    }
  }

  /**
   * Send bulk SMS
   */
  async sendBulkSMS(recipients: string[], message: string, from?: string): Promise<any[]> {
    if (!this.isInitialized) {
      throw new CustomError('SMS service not initialized', 500);
    }

    try {
      const formattedRecipients = recipients.map(phone => this.formatPhoneNumber(phone));

      const options: any = {
        to: formattedRecipients,
        message: message,
        enqueue: true // Use queue for bulk messages
      };

      if (from) {
        options.from = from;
      }

      const response = await this.sms.send(options);
      
      console.log(`✅ Bulk SMS sent to ${formattedRecipients.length} recipients`);
      
      return response.SMSMessageData.Recipients || [];

    } catch (error: any) {
      console.error('❌ Bulk SMS Error:', error);
      throw new CustomError(
        error.message || 'Failed to send bulk SMS',
        error.statusCode || 500
      );
    }
  }

  /**
   * Format phone number to E.164 format
   * Rwanda country code: +250
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // If starts with 0, remove it (local format)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // If doesn't start with country code, add Rwanda country code
    if (!cleaned.startsWith('250')) {
      cleaned = '250' + cleaned;
    }

    // Add + prefix for E.164 format
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    return cleaned;
  }

  /**
   * Validate phone number
   */
  validatePhoneNumber(phone: string): boolean {
    const formatted = this.formatPhoneNumber(phone);
    // Rwanda phone numbers: +250 followed by 9 digits
    return /^\+250\d{9}$/.test(formatted);
  }

  /**
   * Send OTP via SMS
   */
  async sendOTP(phoneNumber: string, otp: string): Promise<void> {
    const message = `Your Patient Passport verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send passport access notification
   */
  async sendPassportAccessNotification(
    phoneNumber: string,
    doctorName: string,
    hospital: string
  ): Promise<void> {
    const message = `Your Patient Passport was accessed by Dr. ${doctorName} at ${hospital}. If this was not authorized, please contact support immediately.`;
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send access request notification
   */
  async sendAccessRequestNotification(
    phoneNumber: string,
    doctorName: string,
    hospital: string
  ): Promise<void> {
    const message = `Dr. ${doctorName} from ${hospital} has requested access to your Patient Passport. Please log in to approve or deny this request.`;
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send emergency access alert
   */
  async sendEmergencyAccessAlert(
    phoneNumber: string,
    doctorName: string,
    hospital: string
  ): Promise<void> {
    const message = `EMERGENCY: Dr. ${doctorName} at ${hospital} has accessed your Patient Passport for emergency treatment. You will be notified when access expires.`;
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Get account balance (for monitoring)
   */
  async getBalance(): Promise<any> {
    if (!this.isInitialized) {
      throw new CustomError('SMS service not initialized', 500);
    }

    try {
      const application = this.client.APPLICATION;
      const response = await application.fetchApplicationData();
      return response.UserData;
    } catch (error: any) {
      console.error('❌ Failed to fetch balance:', error);
      throw new CustomError('Failed to fetch account balance', 500);
    }
  }
}

export const smsService = new SMSService();
