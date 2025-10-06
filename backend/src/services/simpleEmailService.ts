import nodemailer from 'nodemailer';

// Simple email service that works reliably
class SimpleEmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Try multiple email providers
    const providers = [
      // Gmail
      {
        name: 'Gmail',
        config: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS?.replace(/\s/g, '') // Remove spaces
          },
          tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false
          }
        }
      },
      // Outlook
      {
        name: 'Outlook',
        config: {
          host: 'smtp-mail.outlook.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS?.replace(/\s/g, '')
          },
          tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false
          }
        }
      }
    ];

    // Try each provider
    for (const provider of providers) {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          const transporter = nodemailer.createTransport(provider.config);
          // Test connection
          transporter.verify((error, success) => {
            if (success) {
              console.log(`✅ ${provider.name} email provider connected successfully`);
              this.transporter = transporter;
            } else {
              console.log(`❌ ${provider.name} email provider failed:`, error?.message);
            }
          });
        } catch (error) {
          console.log(`❌ ${provider.name} email provider error:`, error);
        }
      }
    }
  }

  async sendEmail(mailOptions: nodemailer.SendMailOptions): Promise<void> {
    if (this.transporter) {
      try {
        const result = await this.transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', result.messageId);
      } catch (error) {
        console.error('❌ Email sending failed:', error);
        await this.sendEmailDev(mailOptions);
      }
    } else {
      await this.sendEmailDev(mailOptions);
    }
  }

  private async sendEmailDev(mailOptions: nodemailer.SendMailOptions): Promise<void> {
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

// Create singleton instance
const simpleEmailService = new SimpleEmailService();

// Export functions
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

  await simpleEmailService.sendEmail(mailOptions);
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

  await simpleEmailService.sendEmail(mailOptions);
};

export const sendNotificationEmail = async (email: string, subject: string, htmlContent: string): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@patientpassport.com',
    to: email,
    subject: subject,
    html: htmlContent
  };

  await simpleEmailService.sendEmail(mailOptions);
};
