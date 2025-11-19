# USSD Service - Complete Setup Guide 📱

## Current Status ✅

Your USSD service is **FULLY FUNCTIONAL** and ready to use! 

### What's Working:
- ✅ USSD menu navigation (language selection, access methods)
- ✅ Patient lookup by National ID or Email
- ✅ Patient data retrieval from database
- ✅ USSD callback endpoint responding correctly
- ✅ Session management and menu flow
- ✅ Error handling and validation

### What Needs Configuration:
- ⚠️ **SMS Delivery** - Requires valid Africa's Talking credentials

---

## Quick Test (Without SMS)

The USSD service works perfectly for menu navigation and data retrieval. Test it now:

```powershell
# Test 1: Language Selection
Invoke-WebRequest -Uri "http://localhost:5000/api/ussd/callback" -Method POST -ContentType "application/json" -Body '{"sessionId":"test-123","phoneNumber":"+250788123456","serviceCode":"*384#","text":""}'

# Response: CON Choose a language / Hitamo ururimi
#           1. English
#           2. Kinyarwanda

# Test 2: Full Flow (English + National ID)
Invoke-WebRequest -Uri "http://localhost:5000/api/ussd/callback" -Method POST -ContentType "application/json" -Body '{"sessionId":"test-456","phoneNumber":"+250788123456","serviceCode":"*384#","text":"1*1*1234567891012345"}'

# Response: CON Welcome Mary Smith!
#           Select an option:
#           1. View Summary
#           2. Medical History
#           3. Current Medications
#           ...
```

---

## SMS Setup (Optional for Production)

### Why SMS Isn't Working

Your `.env` file has placeholder credentials:

```env
AFRICASTALKING_API_KEY=your-africastalking-api-key
AFRICASTALKING_USERNAME=sandbox
```

### How to Fix

**Option 1: Use Sandbox for Testing (FREE)**

1. **Create Africa's Talking Account**
   - Visit: https://africastalking.com/
   - Sign up for **Sandbox** (free testing)
   - Verify your email

2. **Get Sandbox Credentials**
   - Dashboard → Settings → API Key
   - Click "Generate API Key"
   - **SAVE IT** (you won't see it again)

3. **Update `.env`**
   ```env
   AFRICASTALKING_API_KEY=your-actual-sandbox-api-key
   AFRICASTALKING_USERNAME=sandbox
   ```

4. **Restart Server**
   ```bash
   npm run dev
   ```

**Option 2: Production Setup (Requires Payment)**

1. Upgrade to production account
2. Purchase USSD code (e.g., `*384#`)
3. Add funds for SMS credits
4. Update `.env` with production credentials
5. Configure webhook in dashboard

---

## USSD Flow Diagram

```
User Dials: *384#
     ↓
[Language Selection]
1. English
2. Kinyarwanda
     ↓
[Access Method]
1. National ID
2. Email
     ↓
[Enter Identifier]
     ↓
[Main Menu]
1. View Summary
2. Medical History
3. Medications
4. Hospital Visits
5. Test Results
0. Send via SMS
     ↓
[Display Data or Send SMS]
```

---

## Test Patient Data

Use this for testing:

```json
{
  "nationalId": "1234567891012345",
  "email": "m.bienaimee@alustudent.com",
  "name": "Mary Smith",
  "password": "Patient123"
}
```

### Test Cases:

**Test 1: English + National ID**
```
Text: ""           → Language menu
Text: "1"          → Access method menu (English)
Text: "1*1"        → National ID prompt
Text: "1*1*1234567891012345" → Main menu with Mary's data
Text: "1*1*1234567891012345*1" → View summary
```

**Test 2: Kinyarwanda + Email**
```
Text: ""           → Language menu
Text: "2"          → Access method menu (Kinyarwanda)
Text: "2*2"        → Email prompt
Text: "2*2*m.bienaimee@alustudent.com" → Main menu
```

**Test 3: Send SMS (requires credentials)**
```
Text: "1*1*1234567891012345*0" → Attempt SMS send
```

---

## API Endpoints

### 1. USSD Callback (Public)
```http
POST http://localhost:5000/api/ussd/callback
Content-Type: application/json

{
  "sessionId": "unique-session-id",
  "phoneNumber": "+250788123456",
  "serviceCode": "*384#",
  "text": "1*1*1234567891012345"
}
```

### 2. Health Check (Public)
```http
GET http://localhost:5000/api/ussd/health
```

### 3. Test Flow (Admin Only)
```http
POST http://localhost:5000/api/ussd/test
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "sessionId": "test-123",
  "phoneNumber": "+250788123456",
  "text": "1*1*1234567891012345"
}
```

---

## Understanding USSD Responses

### CON (Continue)
User sees menu and can make selection:
```
CON Choose a language
1. English
2. Kinyarwanda
```

### END (Terminate)
Final message, session ends:
```
END Thank you! Passport sent via SMS.
```

---

## Common Issues & Solutions

### Issue 1: "SMS service not initialized"

**Cause:** Missing or invalid Africa's Talking credentials

**Solution:**
```env
# Update .env with real credentials
AFRICASTALKING_API_KEY=actual-key-from-dashboard
AFRICASTALKING_USERNAME=sandbox  # or your username
```

### Issue 2: USSD menu works but SMS fails

**Cause:** Invalid API key or insufficient credits

**Solution:**
1. Verify API key is correct
2. Check account balance on dashboard
3. Ensure phone number is verified (sandbox)

### Issue 3: "Patient not found"

**Cause:** National ID or email doesn't match database

**Solution:**
- Verify patient exists: `node backend/find-patients.js`
- Check National ID format (10-16 digits)
- Ensure email matches exactly

### Issue 4: Session expired

**Cause:** USSD session timeout (typically 30-60 seconds)

**Solution:**
- Restart USSD flow
- Navigate faster through menus
- Production: Implement Redis for persistent sessions

---

## Production Deployment Checklist

### Before Going Live:

- [ ] **Get Production Credentials**
  - [ ] Sign up for production account
  - [ ] Complete KYC verification
  - [ ] Purchase USSD code
  
- [ ] **Configure Production Environment**
  - [ ] Update `.env` with production credentials
  - [ ] Set up production database
  - [ ] Configure production domain
  
- [ ] **Set Up Webhook**
  - [ ] Deploy backend to public server (with HTTPS)
  - [ ] Get public URL (e.g., https://your-domain.com)
  - [ ] Configure webhook in Africa's Talking dashboard:
    - URL: `https://your-domain.com/api/ussd/callback`
    - Method: POST
  
- [ ] **Test in Production**
  - [ ] Dial USSD code on real phone
  - [ ] Test all menu flows
  - [ ] Verify SMS delivery
  
- [ ] **Monitor & Maintain**
  - [ ] Set up logging (e.g., Winston, Sentry)
  - [ ] Monitor SMS costs
  - [ ] Track usage analytics
  - [ ] Set up alerts for failures

---

## Cost Estimates (Africa's Talking Rwanda)

| Service | Estimated Cost |
|---------|---------------|
| USSD Session | ~$0.01 per session |
| SMS (1 message) | ~$0.02-$0.05 |
| USSD Code Purchase | Varies (one-time fee) |

**Example Monthly Cost:**
- 1000 USSD sessions: ~$10
- 500 SMS sent: ~$10-$25
- **Total: ~$20-$35/month**

---

## Next Steps

### For Testing (Right Now):
1. Keep using USSD without SMS - it works perfectly!
2. Test all menu navigation
3. Verify patient data retrieval

### For Production (When Ready):
1. Sign up for Africa's Talking production account
2. Purchase USSD code for Rwanda
3. Add SMS credits
4. Update `.env` with real credentials
5. Deploy to production server with HTTPS
6. Configure webhook in dashboard

---

## Support Resources

- **Africa's Talking Docs:** https://developers.africastalking.com/
- **USSD Guide:** https://developers.africastalking.com/docs/ussd/overview
- **SMS API:** https://developers.africastalking.com/docs/sms/overview
- **Sandbox Simulator:** https://simulator.africastalking.com/

---

## Current Status Summary

✅ **Working:**
- USSD navigation
- Patient authentication
- Data retrieval
- Menu display
- Error handling

⚠️ **Requires Setup:**
- SMS delivery (needs valid API key)

🎉 **Your USSD service is production-ready except for SMS configuration!**

---

## Quick Commands

```bash
# Start backend server
cd backend
npm run dev

# Test USSD endpoint
curl -X POST http://localhost:5000/api/ussd/callback \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","phoneNumber":"+250788123456","text":""}'

# Check server logs
# Look for: ✅ Africa's Talking SMS service initialized
# or:       ⚠️ Africa's Talking credentials not configured

# Restart server (after updating .env)
# Press Ctrl+C
npm run dev
```

---

**Need Help?** Check the server console logs - they provide detailed information about each USSD request and any errors that occur.
