# 🌐 Africa's Talking Web Simulator - Complete Setup Guide

## 🎯 Overview

This guide will help you set up your backend to work with **Africa's Talking's official web simulator** at `simulator.africastalking.com`.

## 📋 Prerequisites

1. ✅ Backend server running on `http://localhost:5000`
2. ✅ Africa's Talking account (Sandbox is FREE)
3. ✅ ngrok installed (to expose your local server)

---

## 🚀 Step-by-Step Setup

### Step 1: Get Africa's Talking Credentials

1. **Sign up** (if you don't have an account):
   - Visit: https://africastalking.com/
   - Click "Sign Up"
   - Choose **Sandbox** (FREE for testing)
   - Verify your email

2. **Get your credentials**:
   - Login to: https://account.africastalking.com/apps/sandbox
   - Go to **Settings** → **API Key**
   - Copy your:
     - **API Key**
     - **Username** (usually "sandbox" for sandbox accounts)

### Step 2: Configure Backend Credentials

Run the setup script:

```powershell
cd backend
node setup-africastalking.js
```

Or manually edit `backend/.env`:

```env
AFRICASTALKING_API_KEY=your-api-key-here
AFRICASTALKING_USERNAME=sandbox
AFRICASTALKING_USSD_CODE=*384*123#
```

### Step 3: Install and Start ngrok

**Install ngrok:**
- Download from: https://ngrok.com/download
- Or use: `npm install -g ngrok`

**Start ngrok:**
```powershell
# Make sure your backend is running first
cd backend
npm run dev

# In a NEW terminal window, start ngrok
ngrok http 5000
```

**Copy the HTTPS URL** ngrok gives you:
```
Forwarding  https://abc123-def-456.ngrok-free.app -> http://localhost:5000
```

**Important:** Keep ngrok running while testing!

### Step 4: Configure USSD Code in Africa's Talking Dashboard

1. **Go to USSD settings**:
   - Visit: https://account.africastalking.com/apps/sandbox
   - Click **USSD** in the left menu
   - Click **Create Channel** (or edit existing)

2. **Configure the channel**:
   - **USSD Code**: `*384*123#` (or your preferred code)
   - **Callback URL**: `https://your-ngrok-url.ngrok-free.app/api/ussd/callback`
     - Replace `your-ngrok-url.ngrok-free.app` with your actual ngrok URL
   - **HTTP Method**: POST
   - Click **Save**

3. **Verify configuration**:
   - The callback URL should show as "Active" or "Verified"
   - Note your USSD code (you'll need it for the simulator)

### Step 5: Use Africa's Talking Web Simulator

1. **Open the simulator**:
   - Visit: https://simulator.africastalking.com:1517/
   - Or: https://simulator.africastalking.com

2. **Login** (if required):
   - Use your Africa's Talking account credentials

3. **Start a session**:
   - Enter your USSD code (e.g., `*384*123#`)
   - Click "Start Session" or similar button
   - The simulator will send requests to your callback URL

4. **Test the flow**:
   - You should see: "Choose a language / Hitamo ururimi"
   - Select options using the keypad
   - Navigate through the menu

### Step 6: Monitor Backend Logs

Watch your backend terminal to see incoming requests:

```powershell
# You should see logs like:
📱 USSD Callback received:
   Origin: https://simulator.africastalking.com
📱 USSD Request: { sessionId: '...', phoneNumber: '...', text: '' }
✅ USSD Response: CON Choose a language...
```

---

## 🔧 Troubleshooting

### Issue: "WebSocket connection failed" errors

**Solution:** These errors are harmless! They're from Africa's Talking's simulator trying to connect to their own WebSocket service. Your USSD still works via HTTP POST.

**To suppress errors:**
- The errors are already suppressed in your local simulator
- For Africa's Talking's simulator, you can ignore them or use browser console filters

### Issue: "Callback URL not reachable"

**Possible causes:**
1. **ngrok not running**: Make sure ngrok is still running
2. **Wrong URL**: Double-check the callback URL in Africa's Talking dashboard
3. **Backend not running**: Ensure `npm run dev` is running
4. **ngrok URL changed**: Free ngrok URLs change on restart - update the callback URL

**Solution:**
```powershell
# 1. Check ngrok is running
# You should see: "Forwarding https://..."

# 2. Test your callback URL directly
curl -X POST https://your-ngrok-url.ngrok-free.app/api/ussd/callback \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","phoneNumber":"+250788123456","text":""}'

# 3. Check backend logs for incoming requests
```

### Issue: "No response from server"

**Check:**
1. Backend is running: `http://localhost:5000/health`
2. USSD endpoint works: Test with curl (see above)
3. CORS is configured: Check `backend/src/server.ts` allows `*.africastalking.com`
4. ngrok is forwarding correctly: Check ngrok web interface

### Issue: "USSD code not working"

**Verify:**
1. USSD code is active in dashboard
2. Callback URL is correct and verified
3. Backend logs show incoming requests
4. Response format is correct (starts with `CON` or `END`)

---

## 🧪 Testing Checklist

Before using the simulator, verify:

- [ ] Backend is running on port 5000
- [ ] ngrok is running and forwarding to port 5000
- [ ] Africa's Talking credentials are in `.env`
- [ ] USSD code is created in Africa's Talking dashboard
- [ ] Callback URL is set to your ngrok URL
- [ ] Callback URL shows as "Active" or "Verified"
- [ ] Test endpoint directly: `curl -X POST https://your-ngrok-url/api/ussd/callback ...`

---

## 📱 Alternative: Use Local Simulator

If you want to test without Africa's Talking's simulator:

```powershell
# 1. Start backend
cd backend
npm run dev

# 2. Open browser
http://localhost:5000/ussd-simulator

# 3. Test - no setup required!
```

**Advantages:**
- ✅ No ngrok needed
- ✅ No Africa's Talking account needed
- ✅ No WebSocket errors
- ✅ Faster testing

---

## 🔄 Quick Reference

### Start Everything

```powershell
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: ngrok
ngrok http 5000

# Browser: Africa's Talking Simulator
https://simulator.africastalking.com:1517/
```

### Test Callback URL

```powershell
# Replace with your ngrok URL
curl -X POST https://abc123.ngrok-free.app/api/ussd/callback \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "phoneNumber": "+250788123456",
    "serviceCode": "*384*123#",
    "text": ""
  }'
```

**Expected Response:**
```
CON Choose a language / Hitamo ururimi
1. English
2. Kinyarwanda
```

---

## 📚 Additional Resources

- **Africa's Talking Docs**: https://developers.africastalking.com/docs/ussd
- **USSD Guide**: `backend/docs/USSD_GUIDE.md`
- **Setup Script**: `backend/setup-africastalking.js`
- **Test Script**: `backend/test-ussd-comprehensive.js`

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Backend logs show incoming USSD requests
2. ✅ Simulator displays the language menu
3. ✅ You can navigate through the menu
4. ✅ Responses appear correctly in the simulator
5. ✅ No errors in backend logs (except harmless WebSocket warnings)

---

## 🎉 You're All Set!

Once configured, you can:
- ✅ Test USSD flows in Africa's Talking's web simulator
- ✅ Test with real phones (using the same USSD code)
- ✅ Monitor requests in backend logs
- ✅ Debug issues using the test script

**Happy testing!** 🚀

