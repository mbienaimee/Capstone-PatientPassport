import nodemailer from 'nodemailer';

// Email service with multiple fallback options for Render free tier
class RenderCompatibleEmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isRenderFreeTier: boolean = true;

  constructor() {
    // Initialize transporter asynchronously without blocking
    setImmediate(() => {
      this.initializeTransporter().catch(error => {
        console.error('Failed to initialize email transporter:', error);
      });
    });
  }

  private async initializeTransporter() {
    console.log('Initializing email service for deployment...');
    console.log('Environment check:');
    console.log('   EMAIL_HOST:', process.env.EMAIL_HOST || 'not set');
    console.log('   EMAIL_USER:', process.env.EMAIL_USER ? 'set' : 'not set');
    console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? 'set' : 'not set');
    console.log('   EMAIL_FROM:', process.env.EMAIL_FROM || 'not set');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email configuration incomplete!');
      console.log('To enable email delivery, set these environment variables:');
      console.log('   EMAIL_HOST=smtp.gmail.com (or smtp.sendgrid.net)');
      console.log('   EMAIL_PORT=587');
      console.log('   EMAIL_USER=your-email@gmail.com (or apikey for SendGrid)');
      console.log('   EMAIL_PASS=your-app-password (or SendGrid API key)');
      console.log('   EMAIL_FROM=PatientPassport <your-email@gmail.com>');
      console.log('See OTP_EMAIL_SETUP.md for detailed instructions');
    }
    
    // Try SendGrid first (recommended for production)
    if (process.env.EMAIL_USER === 'apikey' && process.env.EMAIL_PASS) {
      try {
        console.log('Attempting SendGrid connection...');
        
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'smtp.sendgrid.net',
          port: parseInt(process.env.EMAIL_PORT || '587'),
          secure: false,
          auth: {
            user: 'apikey',
            pass: process.env.EMAIL_PASS
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 10000,
          pool: true,
          maxConnections: 5,
          maxMessages: 100
        });
        
        // Test connection with timeout
        const success = await Promise.race([
          transporter.verify(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('SendGrid connection timeout')), 5000)
          )
        ]);
        
        if (success) {
          console.log('✅ SendGrid email provider connected successfully');
          this.transporter = transporter;
          this.isRenderFreeTier = false;
          return;
        }
      } catch (error) {
        console.log('❌ SendGrid email provider failed:', error?.message || error);
      }
    }

    // Try Gmail as fallback
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_USER !== 'apikey') {
      try {
        console.log('📧 Attempting Gmail connection...');
        
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.EMAIL_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS.replace(/\s/g, '')
          },
          tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false
          },
          // Optimized timeouts for faster performance
          connectionTimeout: 5000, // Reduced from 10000
          greetingTimeout: 5000,   // Reduced from 10000
          socketTimeout: 5000,     // Reduced from 10000
          pool: true,
          maxConnections: 10,      // Increased from 5
          maxMessages: 1000,       // Increased from 100
          // Additional performance optimizations
          rateDelta: 20000,
          rateLimit: 5
        });
        
        const success = await Promise.race([
          transporter.verify(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Gmail connection timeout')), 5000)
          )
        ]);
        
        if (success) {
          console.log('✅ Gmail email provider connected successfully');
          this.transporter = transporter;
          this.isRenderFreeTier = false;
          return;
        }
      } catch (error) {
        console.log('❌ Gmail email provider failed:', error?.message || error);
      }
    }

    
    // Fallback to development mode
    console.log('⚠️  No SMTP providers configured or all failed');
    console.log('📧 Using enhanced development mode with OTP console logging');
    console.log('💡 To enable real email delivery, configure one of these:');
    console.log('   1. SendGrid: EMAIL_USER=apikey, EMAIL_PASS=your-sendgrid-key');
    console.log('   2. Gmail: EMAIL_USER=your-email@gmail.com, EMAIL_PASS=app-password');
    console.log('   3. Railway.app - Free tier allows SMTP');
    console.log('   4. Render Starter - $7/month removes restrictions');
  }

  async sendEmail(mailOptions: nodemailer.SendMailOptions): Promise<void> {
    // Always log OTP codes to console for debugging, regardless of SMTP status
    await this.logOTPToConsole(mailOptions);
    
    if (this.transporter && !this.isRenderFreeTier) {
      try {
        const result = await this.transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', result.messageId);
        console.log('📧 Email delivered to:', mailOptions.to);
        return;
      } catch (error) {
        console.error('❌ Email sending failed:', error?.message || error);
        console.log('🔄 Falling back to development mode');
      }
    }
    
    // Enhanced development mode for Render free tier
    await this.sendEmailDev(mailOptions);
  }

  private async logOTPToConsole(mailOptions: nodemailer.SendMailOptions): Promise<void> {
    // Extract OTP code from email content for console logging
    const content = String(mailOptions.html || mailOptions.text || '');
    const otpMatch = content.match(/(\d{6})/);
    const otpCode = otpMatch ? otpMatch[1] : null;
    
    if (otpCode) {
      console.log('='.repeat(60));
      console.log('🔐 OTP CODE FOR TESTING');
      console.log('='.repeat(60));
      console.log('📧 Email:', mailOptions.to);
      console.log('🔢 OTP Code:', otpCode);
      console.log('⏰ Generated at:', new Date().toISOString());
      console.log('⏳ Expires in: 10 minutes');
      console.log('='.repeat(60));
      console.log('💡 Use this OTP code for testing: ' + otpCode);
      console.log('='.repeat(60));
    }
  }

  private async sendEmailDev(mailOptions: nodemailer.SendMailOptions): Promise<void> {
    console.log('='.repeat(80));
    console.log('📧 EMAIL SIMULATION (Render Free Tier Limitation)');
    console.log('='.repeat(80));
    console.log('📬 To:', mailOptions.to);
    console.log('📤 From:', mailOptions.from);
    console.log('📋 Subject:', mailOptions.subject);
    
    // Extract OTP code from email content
    const content = String(mailOptions.html || mailOptions.text || '');
    const otpMatch = content.match(/(\d{6})/);
    const otpCode = otpMatch ? otpMatch[1] : 'N/A';
    
    console.log('🔐 OTP Code:', otpCode);
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('='.repeat(80));
    console.log('🎯 FOR TESTING: Use this OTP code:', otpCode);
    console.log('📱 Share this code with users for testing');
    console.log('='.repeat(80));
    console.log('💡 SOLUTIONS FOR REAL EMAIL DELIVERY:');
    console.log('   🚀 Railway.app - Free tier allows SMTP');
    console.log('   💰 Render Starter - $7/month removes restrictions');
    console.log('   ☁️  Vercel - Serverless functions');
    console.log('   🐳 DigitalOcean - App Platform');
    console.log('   📧 Gmail - Free with App Password');
    console.log('='.repeat(80));
  }
}

// Create singleton instance
const renderCompatibleEmailService = new RenderCompatibleEmailService();

// Export functions
export const sendOTPEmail = async (email: string, otpCode: string): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@patientpassport.com',
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

  await renderCompatibleEmailService.sendEmail(mailOptions);
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@patientpassport.com',
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

  await renderCompatibleEmailService.sendEmail(mailOptions);
};

export const sendPassportAccessOTPEmail = async (email: string, otpCode: string, doctorName: string, patientName: string): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@patientpassport.com',
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

  await renderCompatibleEmailService.sendEmail(mailOptions);
};

export const sendNotificationEmail = async (email: string, subject: string, htmlContent: string): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@patientpassport.com',
    to: email,
    subject: subject,
    html: htmlContent
  };

  await renderCompatibleEmailService.sendEmail(mailOptions);
};