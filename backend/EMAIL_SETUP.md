# Email Service Configuration Guide

## 🚀 **Gmail Email Setup (Simplified)**

### **Option 1: Gmail SMTP (Current & Only)**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=PatientPassport <your-email@gmail.com>
```

## 🔧 **Quick Setup Instructions**

### **For Gmail (Only Option):**
1. Enable 2FA on Gmail
2. Generate App Password
3. Update Render environment variables
4. Redeploy backend

## 📧 **Email Templates Available:**
- ✅ Welcome Email
- ✅ Email Verification
- ✅ Password Reset
- ✅ OTP Verification
- ✅ Notification Emails

## 🚨 **Important Notes:**
- Gmail has daily sending limits (500 emails/day)
- Always use App Passwords, never regular passwords
- Test email functionality after deployment
- Check spam folder for test emails

## 🔧 **Environment Variables for Render:**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=bruceshimwa312@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM=PatientPassport <bruceshimwa312@gmail.com>
FRONTEND_URL=https://your-netlify-app.netlify.app
```
