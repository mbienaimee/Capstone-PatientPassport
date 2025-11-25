# ✅ Africa's Talking Official Simulator - Ready to Use!

## 🎯 Your USSD Code: `*384*40767#`

This is the **official Africa's Talking sandbox USSD code** for testing.

---

## 🚀 Quick Start (3 Steps)

### Step 1: Get Your API Key

1. **Go to:** https://account.africastalking.com/apps/sandbox
2. **Login** with your Africa's Talking account
3. **Navigate to:** Settings → API Key
4. **Click:** "Generate API Key"
5. **Copy the key** (starts with `atsk_`)

### Step 2: Update .env File

Open `backend\.env` and replace this line:

```env
AFRICASTALKING_API_KEY=your-africastalking-api-key
```

With your actual API key:

```env
AFRICASTALKING_API_KEY=atsk_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
```

### Step 3: Run Setup Script

```powershell
cd c:\Users\user\OneDrive\Desktop\BIENAIMEE\Capstone-PatientPassport\backend
.\setup-ngrok-ussd.ps1
```

This will:
- ✅ Check if backend is running
- ✅ Start ngrok
- ✅ Give you the callback URL
- ✅ Copy it to clipboard automatically
- ✅ Test the endpoint

---

## 📱 Using the Official Simulator

After running the setup script:

1. **Open:** https://developers.africastalking.com/simulator

2. **Fill in:**
   - Phone Number: `+250788123456`
   - USSD Code: `*384*40767#`
   - Callback URL: `(from setup script - already in clipboard!)`

3. **Click:** "Launch Simulator"

4. **Press:** "Call" button

5. **You'll see:**
   ```
   Choose a language / Hitamo ururimi
   1. English
   2. Kinyarwanda
   ```

6. **Enter:** `1` for English

7. **Follow the prompts** to test patient lookup!

---

## ⚡ Manual Setup (If Script Doesn't Work)

### Terminal 1: Start Backend

```powershell
cd c:\Users\user\OneDrive\Desktop\BIENAIMEE\Capstone-PatientPassport\backend
npm run dev
```

Wait for:
```
🚀 Server running on port 5000
```

### Terminal 2: Start ngrok

```powershell
ngrok http 5000
```

**Copy the HTTPS URL** from ngrok output:
```
Forwarding    https://abc123.ngrok-free.app -> http://localhost:5000
              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
              Copy this URL!
```

### Configure Simulator

Callback URL format:
```
https://your-ngrok-url.ngrok-free.app/api/ussd/callback
```

Example:
```
https://abc123-def-456.ngrok-free.app/api/ussd/callback
```

---

## 🔍 Troubleshooting

### "Request failed" in simulator

**Check:**
1. Is backend running? → `npm run dev`
2. Is ngrok running? → Check for HTTPS URL
3. Did you copy the full callback URL with `/api/ussd/callback`?

**Test manually:**
```powershell
$callbackUrl = "https://your-ngrok-url.ngrok-free.app/api/ussd/callback"
$body = @{
    sessionId = "test"
    phoneNumber = "+250788123456"
    serviceCode = "*384*40767#"
    text = ""
} | ConvertTo-Json

Invoke-WebRequest -Uri $callbackUrl -Method POST -Body $body -ContentType "application/json"
```

Should return:
```
CON Choose a language / Hitamo ururimi
1. English
2. Kinyarwanda
```

### "Invalid credentials"

Your `.env` still has placeholder. Update with real API key from:
https://account.africastalking.com/apps/sandbox

### "Patient not found"

The National ID you entered doesn't exist. Check existing patients:

```powershell
cd backend
node find-patients.js
```

---

## 📋 Files Updated

- ✅ `backend\.env` - Updated USSD code to `*384*40767#`
- ✅ `backend\setup-ngrok-ussd.ps1` - Automated setup script
- ✅ `backend\AFRICASTALKING_SIMULATOR_SETUP.md` - Full documentation

---

## 🎉 You're Ready!

Everything is configured for the official Africa's Talking simulator at:
**https://developers.africastalking.com/simulator**

Just run the setup script and follow the prompts!

```powershell
cd backend
.\setup-ngrok-ussd.ps1
```

---

## 💡 Remember

- **Keep ngrok running** - Don't close the window!
- **Keep backend running** - `npm run dev`
- **Use sandbox USSD code:** `*384*40767#`
- **Your callback URL changes** each time you restart ngrok (free tier)

---

**Need help?** Check `AFRICASTALKING_SIMULATOR_SETUP.md` for detailed guide!
