import nodemailer from 'nodemailer';

// Email service with multiple fallback options for Render free tier
class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private initializationPromise: Promise<void> | null = null;
  private initialized: boolean = false;
  private lastError: string | null = null;

  constructor() {
    // Initialize transporter asynchronously without blocking
    this.initializationPromise = this.initializeTransporter().catch(error => {
      console.error('Failed to initialize email transporter:', error);
      this.initialized = true;
    });
  }

  private async initializeTransporter() {
    if (this.initialized) {
      return; // Already initialized or in progress
    }
    
    console.log('📧 Initializing email service...');
    console.log('Environment check:');
    console.log('   EMAIL_HOST:', process.env.EMAIL_HOST || 'not set');
    console.log('   EMAIL_USER:', process.env.EMAIL_USER ? 'set' : 'not set');
    console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? 'set' : 'not set');
    console.log('   EMAIL_FROM:', process.env.EMAIL_FROM || 'not set');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email configuration incomplete!');
      console.log('To enable email delivery, set these environment variables:');
      console.log('   EMAIL_HOST=smtp.gmail.com (or your SMTP host)');
      console.log('   EMAIL_PORT=587');
      console.log('   EMAIL_USER=your-email@gmail.com');
      console.log('   EMAIL_PASS=your-app-password');
      console.log('   EMAIL_FROM=PatientPassport <your-email@gmail.com>');
      console.log('See OTP_EMAIL_SETUP.md for detailed instructions');
    }
    
    // SendGrid support removed — using SMTP only (Gmail or any SMTP host)
    // Configure `EMAIL_HOST`, `EMAIL_USER`, and `EMAIL_PASS` for SMTP delivery.

    // Try Gmail as fallback
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_USER !== 'apikey') {
      try {
        console.log('📧 Attempting SMTP connection (Gmail/other SMTP provider)...');
        
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
          // Increased timeouts for Render/production environments
          connectionTimeout: 15000, // Increased to 15 seconds
          greetingTimeout: 15000,   // Increased to 15 seconds
          socketTimeout: 15000,     // Increased to 15 seconds
          pool: true,
          maxConnections: 10,
          maxMessages: 1000,
          rateDelta: 20000,
          rateLimit: 5,
          // Disable verification in production (Render may block it)
          debug: process.env.NODE_ENV === 'development'
        });
        
        // Skip verification in production environments (Render blocks outbound SMTP)
            // Determine whether to verify on startup. Use EMAIL_VERIFY env var to override defaults.
            const emailVerifyEnv = String(process.env.EMAIL_VERIFY || '').toLowerCase();
            const shouldVerify = emailVerifyEnv === 'true' || (process.env.NODE_ENV !== 'production' && emailVerifyEnv !== 'false');

            if (!shouldVerify) {
              console.log('ℹ️ Skipping SMTP verification on startup (controlled by EMAIL_VERIFY)');
              this.transporter = transporter;
              this.initialized = true;
              return;
            }

            // Verify with timeout
            try {
              const success = await Promise.race([
                transporter.verify(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Gmail connection timeout')), 10000))
              ]);
              if (success) {
                console.log('✅ Gmail email provider connected successfully');
                this.transporter = transporter;
                this.initialized = true;
                return;
              }
            } catch (err) {
              const errorMessage = (err as any)?.message || String(err);
              this.lastError = errorMessage;
              console.log('❌ SMTP provider verification failed:', errorMessage);
              // continue - transporter may still send on first attempt
              this.transporter = transporter;
              this.initialized = true;
              return;
            }
      } catch (error: any) {
        const errorMessage = error?.message || String(error);
        this.lastError = errorMessage;
        console.log('❌ SMTP provider failed:', errorMessage);
        // Don't fail completely - transporter might still work for sending
        if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
          console.log('⚠️  Verification failed but continuing in production mode');
          console.log('   Note: Render.com free tier blocks SMTP. Consider upgrading or using a transactional email provider or a paid plan.');
        }
      }
    }

    
    // Fallback to development mode
    const isRenderFreeTier = process.env.RENDER && process.env.RENDER !== 'false';
    if (isRenderFreeTier) {
      console.log('🚨 RENDER FREE TIER DETECTED');
      console.log('   Render.com free tier blocks outbound SMTP connections on ports 25, 465, and 587');
      console.log('   This is a known Render platform limitation to prevent spam.');
      console.log('');
      console.log('💡 SOLUTIONS:');
      console.log('   ✅ RECOMMENDED: Use a transactional email provider or properly configured SMTP (Mailgun, SparkPost, etc.)');
      console.log('      - Configure SMTP credentials or provider settings in environment variables');
      console.log('   📧 OR: Upgrade to Render Starter ($7/month) - removes SMTP restrictions');
      console.log('   🚀 OR: Deploy to Railway.app (free tier allows SMTP)');
      console.log('');
      console.log('📧 Using development mode with console OTP logging');
    } else {
      console.log('⚠️  No SMTP providers configured or all failed');
      console.log('📧 Using enhanced development mode with OTP console logging');
      console.log('💡 To enable real email delivery, configure SMTP credentials or use a transactional provider:');
      console.log('   1. SMTP (Gmail, Mailgun SMTP, etc.): set EMAIL_HOST, EMAIL_USER, EMAIL_PASS');
      console.log('   2. Use a transactional email provider and configure SMTP or API credentials');
      console.log('   3. Railway.app - Free tier allows SMTP');
      console.log('   4. Upgrade your hosting plan if outbound SMTP is blocked');
    }
    this.initialized = true;
  }

  async sendEmail(mailOptions: nodemailer.SendMailOptions): Promise<void> {
    // Always log OTP codes to console for debugging, regardless of SMTP status
    await this.logOTPToConsole(mailOptions);
    
    // Wait for initialization to complete if credentials are configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && !this.initialized && this.initializationPromise) {
      try {
        console.log('⏳ Waiting for email service initialization...');
        await this.initializationPromise;
      } catch (error: any) {
        const errorMessage = error?.message || String(error);
        this.lastError = errorMessage;
        console.error('Email initialization error:', errorMessage);
      }
    }
    
    // Try to initialize on-demand if credentials exist but transporter isn't ready
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && !this.transporter) {
      console.log('🔄 Attempting on-demand email service initialization...');
      // Reset initialized flag to allow re-initialization
      const wasInitialized = this.initialized;
      this.initialized = false;
      await this.initializeTransporter().catch((error: any) => {
        const errorMessage = error?.message || String(error);
        this.lastError = errorMessage;
        console.error('On-demand initialization failed:', errorMessage);
        this.initialized = wasInitialized;
      });
    }
    
    // Try to send email if transporter is available
    if (this.transporter) {
      try {
        console.log(`📤 Attempting to send email to: ${mailOptions.to}`);
        const result = await this.transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', result.messageId);
        console.log('📧 Email delivered to:', mailOptions.to);
        return; // Success - email sent
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error';
        this.lastError = errorMessage;
        console.error('❌ Email sending failed:', errorMessage);
        console.error('   Error code:', error?.code);
        console.error('   Error response:', error?.response);
        // Don't fall through - throw error so caller knows email failed
        throw new Error(`Email delivery failed: ${errorMessage}`);
      }
    }
    
    // If we have credentials but transporter failed, throw error
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      console.error('❌ Email credentials configured but transporter not available');
      throw new Error('Email service not properly configured. Please check your email settings.');
    }
    
    // Enhanced development mode - only if no credentials configured
    console.log('⚠️  No email credentials configured - using development mode');
    await this.sendEmailDev(mailOptions);
    // In dev mode, we don't throw - just log
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

  // Return the last internal error for health checks
  public getLastError(): string | null {
    return this.lastError;
  }

}

// Create singleton instance
const emailService = new EmailService();

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

    await emailService.sendEmail(mailOptions);
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


    await emailService.sendEmail(mailOptions);
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

    await emailService.sendEmail(mailOptions);
};

  // Expose email status for health checks
  export const getEmailStatus = () => {
    return {
      initialized: (emailService as any).initialized || false,
      transporterPresent: Boolean((emailService as any).transporter),
      configured: Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_HOST),
      lastError: (emailService as any).getLastError ? (emailService as any).getLastError() : null
    };
  };

  export default emailService;

export const sendNotificationEmail = async (email: string, subject: string, htmlContent: string): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@patientpassport.com',
    to: email,
    subject: subject,
    html: htmlContent
  };

    await emailService.sendEmail(mailOptions);
};
