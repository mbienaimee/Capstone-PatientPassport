# ⚡ Quick Start: Africa's Talking Web Simulator

## 🚀 5-Minute Setup

### Step 1: Start Backend
```powershell
cd backend
npm run dev
```

### Step 2: Start ngrok (in new terminal)
```powershell
# Windows
cd backend
.\start-ngrok.ps1

# Or manually:
ngrok http 5000
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)

### Step 3: Configure Africa's Talking

1. **Login**: https://account.africastalking.com/apps/sandbox
2. **Go to**: USSD → Create Channel
3. **Set**:
   - USSD Code: `*384*123#`
   - Callback URL: `https://your-ngrok-url.ngrok-free.app/api/ussd/callback`
4. **Save**

### Step 4: Use Simulator

1. **Open**: https://simulator.africastalking.com:1517/
2. **Enter USSD code**: `*384*123#`
3. **Start session**
4. **Test!** 🎉

---

## ✅ Verify It's Working

**Test callback URL:**
```powershell
curl -X POST https://your-ngrok-url.ngrok-free.app/api/ussd/callback `
  -H "Content-Type: application/json" `
  -d '{\"sessionId\":\"test\",\"phoneNumber\":\"+250788123456\",\"text\":\"\"}'
```

**Expected response:**
```
CON Choose a language / Hitamo ururimi
1. English
2. Kinyarwanda
```

---

## 🔧 Troubleshooting

**"WebSocket errors"** → Ignore them! They're harmless.

**"Callback not reachable"** → Check:
- ✅ ngrok is running
- ✅ Backend is running
- ✅ URL is correct in dashboard

**"No response"** → Check backend logs for incoming requests

---

## 📚 Full Guide

See `AFRICAS_TALKING_WEB_SIMULATOR_SETUP.md` for detailed instructions.

