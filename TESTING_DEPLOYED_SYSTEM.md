# 🎯 QUICK TEST GUIDE - Deployed System

## ✅ System Status
- **Backend:** ✅ DEPLOYED & WORKING
- **Frontend:** ✅ DEPLOYED & WORKING  
- **USSD:** ✅ ENDPOINT READY
- **Socket.IO:** ✅ ENABLED

## 🔗 Live URLs

### Frontend (User Interface)
```
https://patient-passpo.netlify.app
```

### Backend API
```
https://patientpassport-api.azurewebsites.net/api
```

### API Documentation (Swagger)
```
https://patientpassport-api.azurewebsites.net/api-docs/
```

---

## 🧪 5-Minute Test Plan

### Test 1: Frontend Login (2 minutes)

1. **Open frontend:** https://patient-passpo.netlify.app
2. **Click "Register"** or **"Login"**
3. **Create test account:**
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Name: `Test User`
   - Role: Select `patient` or `doctor`
4. **Verify:** You should be logged in and see the dashboard

### Test 2: API Documentation (1 minute)

1. **Open API docs:** https://patientpassport-api.azurewebsites.net/api-docs/
2. **Browse endpoints:** Scroll through available APIs
3. **Test health endpoint:**
   - Find `GET /health`
   - Click "Try it out"
   - Click "Execute"
   - **Expected:** Status 200, JSON response with system info

### Test 3: USSD Simulator (2 minutes)

1. **Open Africa's Talking Simulator:** https://developers.africastalking.com/simulator
2. **Click USSD tab**
3. **Enter callback URL:**
   ```
   https://patientpassport-api.azurewebsites.net/api/ussd/callback
   ```
4. **Enter USSD code:** `*384*40767#`
5. **Enter phone:** `+250788123456`
6. **Click "Start Session"**
7. **Expected:** Language selection menu appears
   ```
   Choose a language / Hitamo ururimi
   1. English
   2. Kinyarwanda
   ```

---

## 🔍 Detailed Feature Tests

### Patient Workflow Test

1. **Register as Patient**
   - Go to https://patient-passpo.netlify.app
   - Click "Register"
   - Select "Patient" role
   - Fill in details and submit

2. **View Patient Dashboard**
   - After login, you should see patient dashboard
   - Check for: Medical records, Passport access, Notifications

3. **Request Passport Access**
   - Navigate to "Patient Passport"
   - Enter patient details
   - Request access via OTP

### Doctor/Hospital Workflow Test

1. **Register as Doctor**
   - Select "Doctor" role during registration
   - Provide hospital/clinic information

2. **Access Patient Records**
   - Login as doctor
   - Search for patient
   - Request access to patient passport
   - Patient receives notification

3. **Add Medical Records**
   - Create new medical record
   - Add diagnosis, medications, tests
   - Save and verify in patient passport

### Real-time Notifications Test

1. **Open two browser windows:**
   - Window 1: Doctor account
   - Window 2: Patient account

2. **Doctor requests access** to patient passport

3. **Patient should receive notification** in real-time (Socket.IO)

4. **Patient approves/denies** access

5. **Doctor receives notification** about decision

---

## 🔧 API Endpoint Tests

### Using PowerShell (Windows)

```powershell
# Test Health Endpoint
Invoke-RestMethod -Uri "https://patientpassport-api.azurewebsites.net/health"

# Test USSD Endpoint
$body = 'sessionId=test123&serviceCode=*384*40767%23&phoneNumber=%2B250788123456&text='
Invoke-WebRequest -Uri "https://patientpassport-api.azurewebsites.net/api/ussd/callback" -Method POST -Body $body -ContentType "application/x-www-form-urlencoded"

# Test Register Endpoint
$user = @{
    email = "test@example.com"
    password = "TestPassword123!"
    name = "Test User"
    role = "patient"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://patientpassport-api.azurewebsites.net/api/auth/register" -Method POST -Body $user -ContentType "application/json"
```

### Using curl (Mac/Linux)

```bash
# Test Health Endpoint
curl https://patientpassport-api.azurewebsites.net/health

# Test USSD Endpoint
curl -X POST https://patientpassport-api.azurewebsites.net/api/ussd/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=test123&serviceCode=*384*40767%23&phoneNumber=%2B250788123456&text="

# Test Register Endpoint
curl -X POST https://patientpassport-api.azurewebsites.net/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User",
    "role": "patient"
  }'
```

---

## ✅ Expected Results Checklist

### Frontend
- [ ] Site loads without errors
- [ ] Registration form works
- [ ] Login form works
- [ ] Dashboard displays after login
- [ ] Navigation menu works
- [ ] No console errors (F12 → Console)

### Backend API
- [ ] Health endpoint returns 200
- [ ] Swagger docs load
- [ ] USSD endpoint responds
- [ ] Authentication endpoints work
- [ ] CORS allows frontend requests

### USSD
- [ ] Simulator accepts callback URL
- [ ] Language menu appears
- [ ] Can navigate through menu
- [ ] No "connection error" messages

### Socket.IO
- [ ] WebSocket connection established
- [ ] Notifications appear in real-time
- [ ] No connection errors in console

---

## 🚨 Common Issues & Fixes

### Frontend: "Cannot connect to backend"
**Solution:** 
1. Check if backend is running: https://patientpassport-api.azurewebsites.net/health
2. Verify CORS is configured
3. Check browser console for specific error
4. Clear browser cache and reload

### USSD: "Unable to connect"
**Solution:**
1. Verify callback URL is correct (no trailing slash)
2. Test endpoint manually with curl/PowerShell
3. Ensure URL is publicly accessible (not localhost)
4. Check Africa's Talking simulator logs

### Socket.IO: "Connection failed"
**Solution:**
1. Check WebSocket URL in frontend config
2. Verify Azure App Service has WebSockets enabled
3. Test connection in browser console:
   ```javascript
   const socket = io('https://patientpassport-api.azurewebsites.net');
   socket.on('connect', () => console.log('Connected!'));
   ```

### Login: "Invalid credentials"
**Solution:**
1. Make sure you registered first
2. Check email/password are correct
3. Try registering a new account
4. Check backend logs for errors

---

## 📊 Performance Expectations

| Operation | Expected Time |
|-----------|--------------|
| Frontend Load | 2-3 seconds |
| API Request | 200-500ms |
| USSD Response | 100-300ms |
| Socket.IO Connect | 50-100ms |
| Database Query | 50-200ms |

---

## 🎓 Testing Scenarios

### Scenario 1: New Patient Registration
1. Patient visits frontend
2. Registers new account
3. Receives welcome email
4. Logs in successfully
5. Sees empty passport (no records yet)

### Scenario 2: Doctor Adds Records
1. Doctor logs in
2. Searches for patient
3. Requests passport access
4. Patient approves via notification
5. Doctor adds medical record
6. Record appears in patient passport

### Scenario 3: USSD Access
1. Patient dials `*384*40767#` in simulator
2. Selects language
3. Chooses "National ID" access
4. Enters national ID
5. Receives OTP via SMS
6. Enters OTP
7. Views passport summary

---

## 📞 Quick Reference

### Support Resources
- **API Docs:** https://patientpassport-api.azurewebsites.net/api-docs/
- **Deployment Status:** `DEPLOYMENT_STATUS.md`
- **USSD Guide:** `backend/COMPLETE_USSD_SETUP_GUIDE.md`
- **Test Script:** `test-deployment.ps1`

### Key Credentials (Test)
- **Test Email:** test@example.com
- **Test Password:** TestPassword123!
- **Test Phone:** +250788123456
- **USSD Code:** *384*40767#

### Important URLs
- Frontend: https://patient-passpo.netlify.app
- Backend: https://patientpassport-api.azurewebsites.net
- API Docs: https://patientpassport-api.azurewebsites.net/api-docs/
- USSD Simulator: https://developers.africastalking.com/simulator

---

**Ready to test? Start with Test 1-3 above (5 minutes total)!**
