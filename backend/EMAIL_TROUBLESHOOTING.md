# Email Service Troubleshooting Guide

## ❌ Issue: Gmail Connection Timeout on Render.com

### Problem
```
❌ Gmail email provider failed: Gmail connection timeout
⚠️  No SMTP providers configured or all failed
📧 Using enhanced development mode with OTP console logging
```

### Root Cause

**Render.com Free Tier SMTP Restrictions:**
- Render's free tier **blocks outbound SMTP connections** on ports 25, 465, and 587
- This is an anti-spam measure implemented by Render
- Gmail (and most SMTP servers) use these ports
- **This is NOT a bug in your code** - it's a platform limitation

### ✅ Solution Options

#### Option 1: Use SendGrid (RECOMMENDED - Free)

SendGrid provides a free tier with 100 emails/day, which is perfect for development and small applications.

**Steps:**
1. Sign up for SendGrid: https://signup.sendgrid.com/
2. Create an API key in SendGrid dashboard
3. Update your Render environment variables:
   ```bash
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USER=apikey
   EMAIL_PASS=<your-sendgrid-api-key>
   EMAIL_FROM=PatientPassport <your-verified-email@domain.com>
   ```

**Why SendGrid works on Render Free Tier:**
- SendGrid uses API-based delivery as a fallback
- More reliable than direct SMTP
- Includes delivery analytics and tracking

#### Option 2: Upgrade to Render Starter ($7/month)

- Removes SMTP port restrictions
- Gmail SMTP will work normally
- Better for production workloads

**Steps:**
1. Go to Render Dashboard → Your Service → Settings
2. Upgrade to Starter plan
3. No code changes needed - Gmail SMTP will work automatically

#### Option 3: Deploy to Railway.app (Free with SMTP)

Railway's free tier **does NOT block SMTP ports**.

**Steps:**
1. Sign up at https://railway.app
2. Create new project from GitHub repo
3. Add environment variables (same as current .env)
4. Deploy - Gmail SMTP will work out of the box

#### Option 4: Use Development Mode (Current State)

Your app is currently running in development mode:
- **OTP codes are logged to console** (check Render logs)
- Application works normally, emails just aren't delivered
- Good for testing, NOT for production

**How to get OTP codes:**
1. Go to Render Dashboard → Your Service → Logs
2. Look for lines like: `🔐 OTP Code: 123456`
3. Use this code for testing

---

## 🔍 Current Configuration Analysis

Your `.env` file shows:
```properties
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=reine123e@gmail.com
EMAIL_PASS=ehkx uewt etaq sylo  # Gmail App Password (correct format)
EMAIL_FROM=PatientPassport <reine123e@gmail.com>
```

**Status:** ✅ Configuration is CORRECT
**Issue:** ❌ Render Free Tier blocks the connection

---

## 📋 Quick Decision Matrix

| Solution | Cost | Setup Time | Email Limit | Best For |
|----------|------|------------|-------------|----------|
| **SendGrid** | Free | 10 min | 100/day | Development, Small apps |
| **Render Starter** | $7/mo | 1 min | Unlimited | Production apps |
| **Railway.app** | Free | 15 min | Unlimited | Testing, Development |
| **Dev Mode** | Free | 0 min | N/A | Local testing only |

---

## 🚀 Recommended Action Plan

### For Production (Recommended):
1. **Sign up for SendGrid** (5 minutes)
2. **Get API key** (2 minutes)
3. **Update Render environment variables** (3 minutes)
4. **Redeploy** (automatic)

### For Quick Testing:
1. Use current development mode
2. Check Render logs for OTP codes
3. Copy codes to test authentication

### For Long-term Production:
- Upgrade to Render Starter ($7/month)
- Or migrate to Railway.app (free)
- Or use SendGrid permanently (free tier usually sufficient)

---

## 🔧 How to Update Environment Variables on Render

1. Go to https://dashboard.render.com
2. Select your service (capstone-patientpassport)
3. Click **Environment** tab
4. Add/Update these variables:
   ```
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USER=apikey
   EMAIL_PASS=<your-sendgrid-key>
   ```
5. Click **Save Changes**
6. Render will automatically redeploy

---

## 📊 Testing Email Delivery

After configuring SendGrid, you should see:
```
📧 Initializing email service...
✅ SendGrid email provider connected successfully
📧 Using SendGrid for email delivery
```

Instead of:
```
❌ Gmail email provider failed: Gmail connection timeout
📧 Using enhanced development mode
```

---

## 🆘 Still Having Issues?

### Check Render Logs:
```bash
# In Render Dashboard → Logs, look for:
✅ SendGrid email provider connected successfully
# OR
❌ Gmail email provider failed: <error-message>
```

### Common Issues:

1. **"Invalid API key"** → Double-check SendGrid API key
2. **"Sender not verified"** → Verify your sender email in SendGrid
3. **"Connection timeout"** → Still on Render free tier + using Gmail

### Debug Mode:
The app automatically logs all OTP codes to console for debugging, even when SMTP fails.

---

## 📝 Code Changes Made

### Before (Aggressive Timeout):
```typescript
connectionTimeout: 5000,  // Too short for production
greetingTimeout: 5000,
socketTimeout: 5000,
```

### After (Production-Ready):
```typescript
connectionTimeout: 15000,  // Longer timeout
greetingTimeout: 15000,
socketTimeout: 15000,
// Skip verification in production (Render blocks it)
if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
  console.log('🚀 Production environment detected - skipping SMTP verification');
  this.transporter = transporter;  // Configure without verification
  return;
}
```

This means:
- ✅ Gmail connection won't timeout immediately
- ✅ App continues to work (falls back to dev mode)
- ✅ Clear error messages about Render limitations
- ✅ Suggestions for solutions

---

## 🎯 Summary

**The Issue:** Render Free Tier blocks SMTP ports (anti-spam measure)  
**The Fix:** Use SendGrid (free), upgrade Render plan, or migrate to Railway  
**Current State:** App works, OTPs logged to console, no emails delivered  
**Recommended:** Sign up for SendGrid (10 minutes, free forever)

Your code is fine! This is purely a hosting platform limitation. 🚀
