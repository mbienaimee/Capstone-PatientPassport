# Email Service Configuration Guide

## 🚀 **Production Email Setup Options**

### **Option 1: Gmail SMTP (Current)**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=PatientPassport <your-email@gmail.com>
```

### **Option 2: SendGrid (Recommended)**
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM=PatientPassport <noreply@patientpassport.com>
```

### **Option 3: Mailgun**
```bash
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your-mailgun-smtp-username
EMAIL_PASS=your-mailgun-smtp-password
EMAIL_FROM=PatientPassport <noreply@patientpassport.com>
```

### **Option 4: AWS SES**
```bash
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-ses-smtp-username
EMAIL_PASS=your-ses-smtp-password
EMAIL_FROM=PatientPassport <noreply@patientpassport.com>
```

## 🔧 **Quick Setup Instructions**

### **For Gmail (Immediate Fix):**
1. Enable 2FA on Gmail
2. Generate App Password
3. Update Render environment variables
4. Redeploy backend

### **For SendGrid (Professional):**
1. Sign up at sendgrid.com
2. Create API key
3. Update environment variables
4. Redeploy backend

## 📧 **Email Templates Available:**
- ✅ Welcome Email
- ✅ Email Verification
- ✅ Password Reset
- ✅ OTP Verification
- ✅ Notification Emails

## 🚨 **Important Notes:**
- Gmail has daily sending limits (500 emails/day)
- Professional services have higher limits
- Always use App Passwords, never regular passwords
- Test email functionality after deployment
