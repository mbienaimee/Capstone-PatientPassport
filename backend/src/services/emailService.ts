import nodemailer from 'nodemailer';
import { CustomError } from '@/middleware/errorHandler';

// Email service with multiple provider support and fallbacks
class EmailService {
  private transporters: nodemailer.Transporter[] = [];
  private currentProviderIndex = 0;

  constructor() {
    this.initializeTransporters();
  }

  private initializeTransporters() {
    console.log('🔍 Checking email configuration...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? '***' : 'undefined');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***' : 'undefined');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
    
    // Gmail configuration
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const gmailConfig: any = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false
        }
      };
      this.transporters.push(nodemailer.createTransport(gmailConfig));
    } else {
      console.log('⚠️  Gmail credentials not found in environment variables');
      console.log('   Please create a .env file in the backend directory with:');
      console.log('   EMAIL_USER=your-email@gmail.com');
      console.log('   EMAIL_PASS=your-app-password');
    }

    // Outlook/Hotmail configuration (fallback)
    if (process.env.OUTLOOK_USER && process.env.OUTLOOK_PASS) {
      const outlookConfig: any = {
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.OUTLOOK_USER,
          pass: process.env.OUTLOOK_PASS
        },
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false
        }
      };
      this.transporters.push(nodemailer.createTransport(outlookConfig));
    }

    // Development fallback - Console logging
    if (process.env.NODE_ENV === 'development' && this.transporters.length === 0) {
      console.log('📧 No email providers configured - using console logging for development');
      console.log('   To enable real email sending, create a .env file with Gmail credentials');
    }
  }

  private async getWorkingTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporters.length === 0) {
      throw new CustomError('No email providers configured', 500);
    }

    // Try current provider first
    const currentTransporter = this.transporters[this.currentProviderIndex];
    try {
      await currentTransporter.verify();
      console.log(`✅ Email provider ${this.currentProviderIndex} verified successfully`);
      return currentTransporter;
    } catch (error) {
      console.log(`❌ Email provider ${this.currentProviderIndex} failed:`, error.message);
      
      // Try other providers
      for (let i = 0; i < this.transporters.length; i++) {
        if (i !== this.currentProviderIndex) {
          try {
            await this.transporters[i].verify();
            this.currentProviderIndex = i;
            console.log(`✅ Email provider ${i} verified successfully`);
            return this.transporters[i];
          } catch (err) {
            console.log(`❌ Email provider ${i} also failed:`, err.message);
          }
        }
      }
      
      console.log('🚨 All email providers failed - falling back to development mode');
      throw new CustomError('All email providers are unavailable', 500);
    }
  }

  async sendEmail(mailOptions: nodemailer.SendMailOptions): Promise<void> {
    // If no transporters configured, use development mode
    if (this.transporters.length === 0) {
      await this.sendEmailDev(mailOptions);
      return;
    }

    try {
      const transporter = await this.getWorkingTransporter();
      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
    } catch (error) {
      console.error('❌ Error sending email:', error.message);
      console.log('🔄 Falling back to development mode...');
      await this.sendEmailDev(mailOptions);
    }
  }

  // Development mode - just log the email content
  async sendEmailDev(mailOptions: nodemailer.SendMailOptions): Promise<void> {
    console.log('='.repeat(60));
    console.log('📧 EMAIL (Development Mode)');
    console.log('='.repeat(60));
    console.log('To:', mailOptions.to);
    console.log('From:', mailOptions.from);
    console.log('Subject:', mailOptions.subject);
    console.log('Content:', mailOptions.html || mailOptions.text);
    console.log('='.repeat(60));
  }
}

// Create singleton instance - lazy initialization
let emailService: EmailService | null = null;

const getEmailService = (): EmailService => {
  if (!emailService) {
    emailService = new EmailService();
  }
  return emailService;
};

// Export functions for backward compatibility
export const sendOTPEmail = async (email: string, otpCode: string): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@patientpassport.com',
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
            Your OTP code for email verification is:
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

  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    await getEmailService().sendEmailDev(mailOptions);
  } else {
    await getEmailService().sendEmail(mailOptions);
  }
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@patientpassport.com',
    to: email,
    subject: 'Welcome to PatientPassport!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Welcome to PatientPassport!</h2>
        <p>Dear ${name},</p>
        <p>Thank you for joining PatientPassport. Your account has been successfully created.</p>
        <p>You can now access your medical records and manage your health information securely.</p>
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #059669; margin-top: 0;">What's Next?</h3>
          <ul>
            <li>Complete your profile information</li>
            <li>Upload your medical documents</li>
            <li>Connect with your healthcare providers</li>
            <li>Set up medication reminders</li>
          </ul>
        </div>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>The PatientPassport Team</p>
      </div>
    `
  };

  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    await getEmailService().sendEmailDev(mailOptions);
  } else {
    await getEmailService().sendEmail(mailOptions);
  }
};

export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@patientpassport.com',
    to: email,
    subject: 'Password Reset Request - PatientPassport',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Password Reset Request</h2>
        <p>You have requested to reset your password for your PatientPassport account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p><strong>This link will expire in 10 minutes.</strong></p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Best regards,<br>The PatientPassport Team</p>
      </div>
    `
  };

  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    await getEmailService().sendEmailDev(mailOptions);
  } else {
    await getEmailService().sendEmail(mailOptions);
  }
};

export const sendEmailVerification = async (email: string, verificationToken: string): Promise<void> => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@patientpassport.com',
    to: email,
    subject: 'Verify Your Email - PatientPassport',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Verify Your Email Address</h2>
        <p>Thank you for registering with PatientPassport!</p>
        <p>Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p><strong>This link will expire in 24 hours.</strong></p>
        <p>If you didn't create an account with PatientPassport, please ignore this email.</p>
        <p>Best regards,<br>The PatientPassport Team</p>
      </div>
    `
  };

  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    await getEmailService().sendEmailDev(mailOptions);
  } else {
    await getEmailService().sendEmail(mailOptions);
  }
};

export const sendNotificationEmail = async (email: string, subject: string, message: string): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@patientpassport.com',
    to: email,
    subject: `PatientPassport Notification: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">${subject}</h2>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;">${message}</p>
        </div>
        <p>Best regards,<br>The PatientPassport Team</p>
      </div>
    `
  };

  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    await getEmailService().sendEmailDev(mailOptions);
  } else {
    await getEmailService().sendEmail(mailOptions);
  }
};
