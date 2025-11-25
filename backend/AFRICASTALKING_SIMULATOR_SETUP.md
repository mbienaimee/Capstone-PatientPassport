# 🎯 Africa's Talking Official Simulator Setup

## Complete Guide to Use https://developers.africastalking.com/simulator

---

## 📋 Prerequisites

### 1. Create Africa's Talking Account (FREE)

1. **Visit:** https://africastalking.com
2. **Click "Get Started"**
3. **Choose "Sandbox" (Free for testing)**
4. **Verify your email**
5. **Complete registration**

### 2. Get Your API Credentials

1. **Login to:** https://account.africastalking.com/apps/sandbox
2. **Navigate to:** Settings → API Key
3. **Click "Generate API Key"**
4. **SAVE IT IMMEDIATELY** (you can't see it again!)
5. **Your username is:** `sandbox`

---

## 🔧 Step-by-Step Setup

### Step 1: Update .env File

Open `backend\.env` and update these lines:

```env
# Replace with YOUR actual credentials from Africa's Talking dashboard
AFRICASTALKING_API_KEY=atsk_YOUR_ACTUAL_API_KEY_HERE
AFRICASTALKING_USERNAME=sandbox
AFRICASTALKING_USSD_CODE=*384*40767#
```

**Example (with fake key):**
```env
AFRICASTALKING_API_KEY=atsk_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
AFRICASTALKING_USERNAME=sandbox
AFRICASTALKING_USSD_CODE=*384*40767#
```

### Step 2: Install ngrok (if not installed)

**Option A: Download from website**
1. Visit: https://ngrok.com/download
2. Download for Windows
3. Extract to a folder (e.g., `C:\ngrok`)
4. Add to PATH or run from that folder

**Option B: Using Chocolatey (if installed)**
```powershell
choco install ngrok
```

### Step 3: Start Your Backend

```powershell
cd c:\Users\user\OneDrive\Desktop\BIENAIMEE\Capstone-PatientPassport\backend
npm run dev
```

**Wait for this message:**
```
🚀 Server running on port 5000
✅ Connected to MongoDB
```

### Step 4: Expose Backend with ngrok

**Open a NEW PowerShell window** and run:

```powershell
ngrok http 5000
```

**You'll see output like:**
```
Session Status                online
Account                       your-account (Plan: Free)
Forwarding                    https://abc123-def-456.ngrok-free.app -> http://localhost:5000
```

**Copy the HTTPS URL** (e.g., `https://abc123-def-456.ngrok-free.app`)

> ⚠️ **KEEP ngrok running!** Don't close this window.

### Step 5: Configure Africa's Talking Simulator

1. **Go to:** https://developers.africastalking.com/simulator
2. **Login** with your Africa's Talking account
3. **Select "USSD"** from the dropdown
4. **Fill in the form:**

   | Field | Value |
   |-------|-------|
   | **Phone Number** | `+250788123456` (or any test number) |
   | **USSD Code** | `*384*40767#` |
   | **Callback URL** | `https://your-ngrok-url.ngrok-free.app/api/ussd/callback` |

   **Example Callback URL:**
   ```
   https://abc123-def-456.ngrok-free.app/api/ussd/callback
   ```

5. **Click "Launch Simulator"**

### Step 6: Test USSD Flow

In the simulator:

1. **Press "Call"** - You should see:
   ```
   Choose a language / Hitamo ururimi
   1. English
   2. Kinyarwanda
   ```

2. **Enter `1`** (English) - You should see:
   ```
   Choose access method:
   1. National ID
   2. Email
   ```

3. **Enter `1`** (National ID) - You should see:
   ```
   Enter your National ID:
   ```

4. **Enter a test National ID** (e.g., `1234567890123456`)
   - The system will search for a patient with this ID
   - If found, shows main menu
   - If not found, shows error message

---

## ✅ Verification Checklist

Before testing, make sure:

- [ ] Backend is running (`npm run dev`)
- [ ] MongoDB is connected (check backend console)
- [ ] `.env` has REAL Africa's Talking credentials (not placeholder)
- [ ] ngrok is running and showing HTTPS URL
- [ ] Callback URL in simulator matches ngrok URL
- [ ] Test patient exists in database

---

## 🔍 Troubleshooting

### Error: "Request failed" or "Connection timeout"

**Check:**
1. Is ngrok running? Look for the HTTPS URL
2. Is backend running? Check `http://localhost:5000/health`
3. Did you use the correct ngrok URL in simulator?

**Test endpoint manually:**
```powershell
# Replace with your ngrok URL
curl -X POST https://your-ngrok-url.ngrok-free.app/api/ussd/callback `
  -H "Content-Type: application/json" `
  -d '{\"sessionId\":\"test-123\",\"phoneNumber\":\"+250788123456\",\"text\":\"\"}'
```

Should return:
```
CON Choose a language / Hitamo ururimi
1. English
2. Kinyarwanda
```

### Error: "Invalid API credentials"

Your `.env` still has placeholder values. Update with REAL credentials:

```env
# ❌ WRONG (placeholder)
AFRICASTALKING_API_KEY=your-africastalking-api-key

# ✅ CORRECT (real key from dashboard)
AFRICASTALKING_API_KEY=atsk_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
```

### Error: "Patient not found"

The National ID you entered doesn't exist in your database.

**Check existing patients:**
```powershell
cd backend
node find-patients.js
```

**Or create a test patient** via the frontend at `http://localhost:3000`

### ngrok session expired

Free ngrok URLs expire after 2 hours. When this happens:

1. Restart ngrok: `ngrok http 5000`
2. Copy new URL
3. Update callback URL in Africa's Talking simulator
4. Test again

---

## 📊 What to Expect

### Successful USSD Flow

```
[Simulator Screen]
------------------
Choose a language / Hitamo ururimi
1. English
2. Kinyarwanda

[User enters: 1]
------------------
Choose access method:
1. National ID
2. Email

[User enters: 1]
------------------
Enter your National ID:

[User enters: 1234567890123456]
------------------
Patient: John Doe
DOB: 1990-01-15
ID: 1234567890123456

Menu:
1. View Observations
2. View Medications
3. View History
4. Send via SMS
0. Exit

[User enters: 4]
------------------
END SMS sent to +250788123456
Check your phone for passport summary!
```

### Backend Logs (What You'll See)

```
📱 USSD Callback received:
   Session: AT_1234...
   Phone: +250788123456
   Text: ""
   
✅ Processing USSD: Session=AT_1234..., Phone=+250788123456, Text=""

📱 USSD Callback received:
   Session: AT_1234...
   Phone: +250788123456
   Text: "1"
   
✅ Processing USSD: Session=AT_1234..., Phone=+250788123456, Text="1"

📱 USSD Callback received:
   Session: AT_1234...
   Phone: +250788123456
   Text: "1*1"
   
✅ Processing USSD: Session=AT_1234..., Phone=+250788123456, Text="1*1"
```

---

## 🎯 Quick Reference

### Essential URLs

- **Africa's Talking Dashboard:** https://account.africastalking.com/apps/sandbox
- **Official Simulator:** https://developers.africastalking.com/simulator
- **API Documentation:** https://developers.africastalking.com/docs/ussd
- **Download ngrok:** https://ngrok.com/download

### Essential Commands

```powershell
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start ngrok
ngrok http 5000

# Terminal 3: Check health
curl http://localhost:5000/health

# Terminal 4: Test USSD endpoint
curl -X POST https://your-ngrok-url.ngrok-free.app/api/ussd/callback `
  -H "Content-Type: application/json" `
  -d '{\"sessionId\":\"test\",\"phoneNumber\":\"+250788123456\",\"text\":\"\"}'
```

### Callback URL Format

```
https://[your-ngrok-subdomain].ngrok-free.app/api/ussd/callback
```

**Example:**
```
https://abc123-def-456.ngrok-free.app/api/ussd/callback
```

---

## 🚀 Next Steps

After successful testing:

1. **Deploy to production** (Azure, Heroku, AWS)
2. **Get permanent domain** (instead of ngrok)
3. **Switch to production Africa's Talking account**
4. **Purchase real USSD code** (e.g., `*384#`)
5. **Add real phone testing**

---

## 💡 Pro Tips

1. **Keep ngrok window open** - Closing it will break the connection
2. **Backend logs are your friend** - Watch for errors in the backend console
3. **Use incognito mode** - Clear cache if simulator acts weird
4. **Test incrementally** - Test each menu level one at a time
5. **Check MongoDB** - Ensure patients exist before testing lookup

---

## ❓ Still Having Issues?

### Check These:

1. **Backend console** - Any errors?
2. **ngrok console** - Shows incoming requests?
3. **Simulator console** (F12 in browser) - Any JavaScript errors?
4. **Network tab** - Are requests reaching your backend?

### Test Health Endpoint

```powershell
# Local
curl http://localhost:5000/health

# Via ngrok
curl https://your-ngrok-url.ngrok-free.app/health
```

Both should return:
```json
{
  "success": true,
  "message": "PatientPassport API is running",
  "environment": "development"
}
```

---

**🎉 You're all set! Follow the steps above and you'll have Africa's Talking simulator working perfectly!**
