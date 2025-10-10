import nodemailer from 'nodemailer';

// Email service optimized for Render deployment
class RenderEmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter().catch(error => {
      console.error('Failed to initialize email transporter:', error);
    });
  }

  private async initializeTransporter() {
    // Only try Gmail if credentials are provided
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        console.log('🔧 Initializing Gmail email service...');
        
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS.replace(/\s/g, '') // Remove spaces
          },
          tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false
          },
          connectionTimeout: 10000, // 10 seconds
          greetingTimeout: 10000,   // 10 seconds
          socketTimeout: 10000      // 10 seconds
        });
        
        // Test connection with shorter timeout
        const success = await Promise.race([
          transporter.verify(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 8000)
          )
        ]);
        
        if (success) {
          console.log('✅ Gmail email provider connected successfully');
          this.transporter = transporter;
          return;
        }
      } catch (error) {
        console.log('❌ Gmail email provider failed:', error?.message || error);
        console.log('🔄 Falling back to development mode');
      }
    }
    
    // Fallback to development mode
    console.log('⚠️  Using development mode for email sending');
    console.log('📧 Emails will be logged to console instead of sent');
  }

  async sendEmail(mailOptions: nodemailer.SendMailOptions): Promise<void> {
    // Wait for transporter to be initialized
    if (!this.transporter) {
      console.log('⏳ Waiting for email transporter to initialize...');
      await this.waitForTransporter();
    }

    if (this.transporter) {
      try {
        // Try to send email with timeout
        const result = await Promise.race([
          this.transporter.sendMail(mailOptions),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Email send timeout')), 15000)
          )
        ]);
        
        console.log('✅ Email sent successfully:', result.messageId);
        return;
      } catch (error) {
        console.error('❌ Email sending failed:', error?.message || error);
        console.log('🔄 Falling back to development mode');
      }
    }
    
    // Always fallback to development mode
    await this.sendEmailDev(mailOptions);
  }

  private async waitForTransporter(maxWaitTime = 3000): Promise<void> {
    const startTime = Date.now();
    while (!this.transporter && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private async sendEmailDev(mailOptions: nodemailer.SendMailOptions): Promise<void> {
    console.log('='.repeat(80));
    console.log('📧 EMAIL (Development Mode - Render Free Tier Limitation)');
    console.log('='.repeat(80));
    console.log('📬 To:', mailOptions.to);
    console.log('📤 From:', mailOptions.from);
    console.log('📋 Subject:', mailOptions.subject);
    console.log('📄 Content Preview:', String(mailOptions.html || mailOptions.text || '').substring(0, 200) + '...');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('='.repeat(80));
    console.log('💡 To enable real email sending:');
    console.log('   1. Upgrade to Render Pro plan (removes network restrictions)');
    console.log('   2. Use a different hosting service (Vercel, Railway, etc.)');
    console.log('   3. Use a third-party email service (SendGrid, Mailgun)');
    console.log('='.repeat(80));
  }
}

// Create singleton instance
const renderEmailService = new RenderEmailService();

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

  await renderEmailService.sendEmail(mailOptions);
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

  await renderEmailService.sendEmail(mailOptions);
};

export const sendPassportAccessOTPEmail = async (email: string, otpCode: string, doctorName: string, patientName: string): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@patientpassport.com',
    to: email,
    subject: 'Patient Passport Access Request - OTP Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Patient Passport</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #374151; margin-bottom: 20px;">Doctor Access Request</h2>
          <p style="color: #6b7280; margin-bottom: 20px;">
            Dear <strong>${patientName}</strong>,
          </p>
          <p style="color: #6b7280; margin-bottom: 20px;">
            <strong>Dr. ${doctorName}</strong> is requesting access to your Patient Passport medical records.
          </p>
          
          <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">🔐 Your Access Code</h3>
            <p style="color: #92400e; margin-bottom: 10px;">
              Please share this OTP code with the doctor to grant access:
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 10px 0;">
              <span style="font-size: 36px; font-weight: bold; color: #10b981; letter-spacing: 8px; font-family: monospace;">${otpCode}</span>
            </div>
            <p style="color: #92400e; font-size: 14px; margin: 0;">
              ⏰ This code expires in 10 minutes
            </p>
          </div>
          
          <div style="background: #e0f2fe; border: 1px solid #0ea5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #0c4a6e; margin-top: 0;">📋 What this means:</h4>
            <ul style="color: #0c4a6e; margin: 0; padding-left: 20px;">
              <li>The doctor will be able to view your medical records</li>
              <li>Access is temporary and will expire after 1 hour</li>
              <li>You can revoke access at any time</li>
              <li>Only share this code with trusted healthcare providers</li>
            </ul>
          </div>
          
          <div style="background: #fef2f2; border: 1px solid #ef4444; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #dc2626; margin-top: 0;">⚠️ Security Notice:</h4>
            <p style="color: #dc2626; margin: 0; font-size: 14px;">
              If you did not request this access or do not recognize the doctor, please ignore this email and contact our support team immediately.
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            This is an automated message from PatientPassport. Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  };

  await renderEmailService.sendEmail(mailOptions);
};

export const sendNotificationEmail = async (email: string, subject: string, htmlContent: string): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@patientpassport.com',
    to: email,
    subject: subject,
    html: htmlContent
  };

  await renderEmailService.sendEmail(mailOptions);
};