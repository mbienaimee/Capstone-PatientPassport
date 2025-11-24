# 🔍 Debugging Africa's Talking USSD Issues

## Understanding the Socket Errors

### What You're Seeing:
```
ussd.js:56 Error: This socket has been ended by the other party
    at n (simulator.js:57:20)
    at $.n (responseQueue.js:13:17)
    ...
```

### ⚠️ IMPORTANT: This is NOT Your Problem!

These errors are from **Africa's Talking simulator's own JavaScript code**, not your application.

**Files referenced:**
- `ussd.js:56` ❌ Does NOT exist in your project
- `simulator.js:57` ❌ Does NOT exist in your project  
- `responseQueue.js:13` ❌ Does NOT exist in your project
- `socket.js:538` ❌ Does NOT exist in your project

These are **Africa's Talking's internal files** loaded from their website (`simulator.africastalking.com`).

---

## How USSD Actually Works

### Africa's Talking USSD Protocol:
```
User dials *384*40767# 
    ↓
Phone Network (Safaricom/MTN/Airtel)
    ↓
Africa's Talking Gateway
    ↓
HTTP POST to YOUR server
    ↓
Your backend: POST /api/ussd/callback
    ↓
Your response (CON or END)
    ↓
Back to user's phone
```

**Key Point:** USSD uses **HTTP POST only** - NO WebSockets needed!

---

## Debugging Steps

### 1. Test Your USSD Backend Directly (No Simulator)

**Run this script:**
```powershell
node backend/test-ussd-direct.js
```

**What it does:**
- Bypasses Africa's Talking simulator completely
- Sends HTTP POST requests directly to your backend
- Tests all USSD flows (menu navigation, patient lookup, etc.)
- Shows exactly what your backend returns

**Expected output:**
```
✅ Backend server is running

📤 Testing: Main Menu
   Request: (empty - main menu)
✅ Response (200):
CON Welcome to PatientPassport
1. English
2. Kinyarwanda

📤 Testing: Select English
   Request: 1
✅ Response (200):
CON Select access method:
1. Medical Record Number
2. Phone Number
3. Emergency Access

... etc ...

✅ ALL TESTS PASSED - USSD is working correctly!
```

---

### 2. Check Backend Logs

**Start backend with logging:**
```powershell
cd backend
npm run dev
```

**Watch for:**
```
✅ Africa's Talking SMS service initialized
⚠️  Socket.io is DISABLED (prevents Africa's Talking simulator conflicts)
ℹ️  USSD works via HTTP POST /api/ussd/callback
Server: http://localhost:5000
```

**When you test USSD, you should see:**
```
[USSD] Incoming request:
  Session: test-session-1
  Phone: +250788123456
  Service Code: *384*40767#
  Text: 
[USSD] Returning main menu (language selection)
```

---

### 3. Test with Browser DevTools

**Open your local simulator:**
```
http://localhost:5000/ussd-simulator
```

**Open Browser DevTools (F12):**
1. Go to **Network** tab
2. Filter by **Fetch/XHR**
3. Dial `*384*40767#`
4. Click on the request to `/api/ussd/callback`

**Check:**
- ✅ Status: 200 OK
- ✅ Response Type: text/plain
- ✅ Response starts with `CON` or `END`
- ✅ No CORS errors

**Ignore:**
- ❌ Socket errors in Console tab (those are from Africa's Talking)
- ❌ WebSocket connection errors (socket.io is disabled)

---

### 4. Test with cURL/PowerShell

**Test main menu:**
```powershell
$body = 'sessionId=test-123&serviceCode=*384*40767#&phoneNumber=%2B250788123456&text='
Invoke-WebRequest -Uri "http://localhost:5000/api/ussd/callback" -Method POST -ContentType "application/x-www-form-urlencoded" -Body $body
```

**Expected response:**
```
CON Welcome to PatientPassport
1. English
2. Kinyarwanda
```

**Test English selection:**
```powershell
$body = 'sessionId=test-123&serviceCode=*384*40767#&phoneNumber=%2B250788123456&text=1'
Invoke-WebRequest -Uri "http://localhost:5000/api/ussd/callback" -Method POST -ContentType "application/x-www-form-urlencoded" -Body $body
```

**Expected response:**
```
CON Select access method:
1. Medical Record Number
2. Phone Number
3. Emergency Access
```

---

### 5. Verify Socket.io is Disabled

**Check socket.io endpoint:**
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/socket.io/socket.io.js"
```

**Expected response:**
```
404 Not Found
Socket.io is disabled. USSD uses HTTP POST /api/ussd/callback
```

**Check WebSocket upgrade:**
```powershell
# This should fail (expected)
Test-NetConnection -ComputerName localhost -Port 5000
```

---

## Common Issues & Solutions

### Issue 1: "Cannot connect to backend"
**Solution:**
```powershell
cd backend
npm run dev
```
Wait for: `Server: http://localhost:5000`

---

### Issue 2: "No response from USSD endpoint"
**Check:**
1. USSD route is registered:
   ```bash
   grep -r "ussd" backend/src/server.ts
   ```
2. Controller exists:
   ```bash
   ls backend/src/controllers/ussdController.ts
   ```
3. Port 5000 is available:
   ```powershell
   netstat -ano | findstr :5000
   ```

---

### Issue 3: "CORS errors"
**Check backend logs for:**
```
Blocked CORS request from origin: ...
```

**CORS is configured for Africa's Talking:**
- `*.africastalking.com`
- `*.at-uat.org`
- `localhost:3000`
- `localhost:5173`

---

### Issue 4: "Response not showing in simulator"
**Verify response format:**
- Must start with `CON` (continue) or `END` (finish)
- Content-Type: `text/plain`
- No extra whitespace before CON/END

**Bad response:**
```
 CON Welcome  ← space before CON
```

**Good response:**
```
CON Welcome to PatientPassport
1. English
2. Kinyarwanda
```

---

## Production Debugging (Real Africa's Talking Account)

### 1. Set Up Webhook URL

**In Africa's Talking dashboard:**
```
Callback URL: https://your-domain.com/api/ussd/callback
```

### 2. Enable Request Logging

**Add to `.env`:**
```env
LOG_LEVEL=debug
USSD_DEBUG=true
```

**Backend will log:**
```
[USSD Debug] Raw request body: sessionId=ATUid_...
[USSD Debug] Parsed: { sessionId, phoneNumber, serviceCode, text }
[USSD Debug] Session state: { language: 'en', step: 'main_menu' }
[USSD Debug] Response: CON Welcome to PatientPassport...
```

### 3. Test with Real Phone

**Steps:**
1. Get Africa's Talking sandbox account
2. Configure callback URL (use ngrok for local testing):
   ```powershell
   ngrok http 5000
   ```
   Copy URL: `https://abc123.ngrok.io`
   
3. Set callback in AT dashboard:
   ```
   https://abc123.ngrok.io/api/ussd/callback
   ```

4. Dial your USSD code from registered test number

---

## Quick Verification Checklist

Run these commands to verify everything:

```powershell
# 1. Check backend is running
curl http://localhost:5000/health

# 2. Test USSD endpoint directly
node backend/test-ussd-direct.js

# 3. Check socket.io is disabled
curl http://localhost:5000/socket.io/socket.io.js

# 4. View USSD simulator
start http://localhost:5000/ussd-simulator

# 5. Test manual USSD request
$body = 'sessionId=test&serviceCode=*384*40767#&phoneNumber=%2B250788123456&text='
Invoke-WebRequest -Uri "http://localhost:5000/api/ussd/callback" -Method POST -ContentType "application/x-www-form-urlencoded" -Body $body
```

---

## Understanding the Error Source

### Where Socket Errors Come From:

**Africa's Talking Simulator Page (`simulator.africastalking.com`):**
```html
<script src="https://cdn.socket.io/socket.io.min.js"></script>
<script src="ussd.js"></script>      ← THEIR file
<script src="simulator.js"></script>  ← THEIR file
<script src="socket.js"></script>     ← THEIR file
```

**Their JavaScript tries to:**
1. Load socket.io client
2. Connect to websocket
3. When it fails, throws errors YOU see in console

**Your Application:**
- ✅ Receives HTTP POST to `/api/ussd/callback`
- ✅ Returns `CON` or `END` response
- ✅ Works perfectly via HTTP
- ❌ Doesn't use WebSockets at all

**Conclusion:** The errors are cosmetic and don't affect functionality.

---

## Final Verification

**Run the comprehensive test:**
```powershell
node backend/test-ussd-direct.js
```

**If all tests pass:** ✅ Your USSD is working correctly!

**The socket errors:** ⚠️ Are from Africa's Talking, ignore them.

**Your code:** ✅ Is correct and functional.

---

## Need More Help?

**Check these files:**
- `backend/src/controllers/ussdController.ts` - USSD logic
- `backend/src/services/ussdService.ts` - Business logic
- `backend/src/routes/ussd.ts` - Route configuration
- `backend/public/ussd-simulator.html` - Local simulator

**Run diagnostics:**
```powershell
# Check all USSD files exist
ls backend/src/controllers/ussdController.ts
ls backend/src/services/ussdService.ts
ls backend/src/routes/ussd.ts
ls backend/public/ussd-simulator.html

# Check TypeScript compilation
cd backend
npm run build

# View backend logs
npm run dev | Select-String "USSD"
```

---

**Remember:** The socket errors are **NOT your problem**. Your USSD works via HTTP POST, which is the correct and official Africa's Talking protocol.
