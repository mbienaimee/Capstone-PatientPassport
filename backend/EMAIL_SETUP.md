# Email Service Configuration Guide

## 🚀 **Enhanced Email Setup with Console OTP Logging**

### **Current Configuration (Multiple Providers Supported)**

The email service now supports multiple providers with automatic fallback and **always displays OTP codes in the console** for debugging purposes.

#### **SendGrid (Recommended for Production)**
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key-here
EMAIL_FROM=PatientPassport <reine123e@gmail.com>
```

#### **Gmail (Alternative)**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM=PatientPassport <your-email@gmail.com>
```

#### **Outlook (Alternative)**
```bash
OUTLOOK_USER=your-email@outlook.com
OUTLOOK_PASS=your-outlook-password
EMAIL_FROM=PatientPassport <your-email@outlook.com>
```

## 🔧 **Quick Setup Instructions**

### **For SendGrid (Current & Working):**
1. ✅ SendGrid account created
2. ✅ API key generated
3. ✅ Environment variables configured
4. ✅ Ready for deployment

### **For Gmail:**
1. Enable 2-factor authentication
2. Generate App Password
3. Use App Password in EMAIL_PASS

### **For Outlook:**
1. Enable SMTP authentication
2. Use regular password or App Password

## 📧 **Email Templates Available:**
- ✅ Welcome Email
- ✅ Email Verification
- ✅ Password Reset
- ✅ OTP Verification
- ✅ Notification Emails
- ✅ Doctor Access Request OTP

## 🔐 **OTP Console Logging**
**IMPORTANT:** OTP codes are **ALWAYS** displayed in the console logs for debugging, regardless of email provider status. This ensures you can always test OTP functionality even if email delivery fails.

Console output example:
```
============================================================
🔐 OTP CODE FOR TESTING
============================================================
📧 Email: user@example.com
🔢 OTP Code: 123456
⏰ Generated at: 2024-01-15T10:30:00.000Z
⏳ Expires in: 10 minutes
============================================================
💡 Use this OTP code for testing: 123456
============================================================
```

## 🚨 **Important Notes:**
- SendGrid provides 100 emails/day free
- Works perfectly on Render free tier
- Professional email delivery
- No SMTP restrictions
- **OTP codes always visible in console for testing**

## 🔧 **Environment Variables for Render:**
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key-here
EMAIL_FROM=PatientPassport <reine123e@gmail.com>
FRONTEND_URL=https://your-netlify-app.netlify.app
```

##  **Deployment Options:**
1. **Railway.app** - Free tier allows SMTP
2. **Render Starter** - $7/month removes restrictions
3. **Vercel** - Serverless functions
4. **DigitalOcean** - App Platform
5. **Heroku** - Paid plans support SMTP
