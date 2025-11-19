# USSD Troubleshooting Guide

## Common USSD Errors and Solutions

### Error 1: `Uncaught SyntaxError: Unexpected token '<'`

**Cause:** This occurs when the Africa's Talking USSD simulator tries to load JavaScript files but receives HTML instead (usually a 404 or error page).

**Solutions:**
1. Ensure your backend server is running:
   ```bash
   cd backend
   npm run dev
   ```

2. Verify the API endpoint is accessible:
   ```bash
   curl http://localhost:5000/api/ussd/health
   ```

3. Check that the USSD callback URL in Africa's Talking dashboard matches your server URL

---

### Error 2: `Error: This socket has been ended by the other party`

**Cause:** WebSocket connection between the USSD simulator and backend is being terminated unexpectedly.

**Solutions:**
1. **CORS Issues:** Ensure Africa's Talking domains are whitelisted in your CORS configuration
2. **Network timeout:** The backend might not be responding quickly enough
3. **Session management:** Session data might be getting cleared too early

**Fixes Applied:**
- ✅ Added Africa's Talking simulator domains to CORS whitelist
- ✅ Improved error handling in USSD controller
- ✅ Added proper logging for debugging
- ✅ Enhanced response headers for compatibility

---

## Testing USSD Locally

### Method 1: Use Built-in USSD Simulator

1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Open the USSD simulator in your browser:
   ```
   http://localhost:5000/ussd-simulator.html
   ```

3. Click "Start Session" and test the flow

### Method 2: Use Command Line Test Script

```bash
cd backend
node test/test-ussd.js
```

### Method 3: Test with Postman or cURL

```bash
# Start session (Language selection)
curl -X POST http://localhost:5000/api/ussd/callback \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "phoneNumber": "+250788123456",
    "serviceCode": "*384#",
    "text": ""
  }'

# Select English (option 1)
curl -X POST http://localhost:5000/api/ussd/callback \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "phoneNumber": "+250788123456",
    "serviceCode": "*384#",
    "text": "1"
  }'

# Select National ID method (option 1)
curl -X POST http://localhost:5000/api/ussd/callback \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "phoneNumber": "+250788123456",
    "serviceCode": "*384#",
    "text": "1*1"
  }'
```

---

## Africa's Talking Setup

### 1. Create Sandbox Account
1. Go to [Africa's Talking](https://africastalking.com/)
2. Sign up for a sandbox account
3. Get your API key and username

### 2. Configure USSD Code

1. Go to your Africa's Talking dashboard
2. Navigate to Sandbox → USSD
3. Click "Create Channel"
4. Enter your USSD code (e.g., `*384#`)
5. Set callback URL:
   - **Local testing (with ngrok):** `https://your-ngrok-url.ngrok.io/api/ussd/callback`
   - **Production:** `https://your-domain.com/api/ussd/callback`

### 3. Update Environment Variables

Update your `.env` file:

```env
# Africa's Talking Configuration
AFRICASTALKING_API_KEY=your-actual-api-key-here
AFRICASTALKING_USERNAME=sandbox
AFRICASTALKING_USSD_CODE=*384#
```

---

## Using ngrok for Local Testing with Africa's Talking

Africa's Talking needs a public URL to send webhooks. Use ngrok to expose your local server:

### 1. Install ngrok
```bash
# Download from https://ngrok.com/download
# Or use npm:
npm install -g ngrok
```

### 2. Start ngrok
```bash
# Start your backend first
cd backend
npm run dev

# In a new terminal, start ngrok
ngrok http 5000
```

### 3. Update Africa's Talking Callback URL
Copy the ngrok URL (e.g., `https://abcd1234.ngrok.io`) and use it in your USSD callback URL:
```
https://abcd1234.ngrok.io/api/ussd/callback
```

---

## Debugging Tips

### 1. Enable Detailed Logging

The USSD controller now logs all incoming requests. Check your server console for:
```
📱 USSD Callback received:
   Headers: {...}
   Body: {...}
   Query: {...}
✅ Processing USSD: Session=abc, Phone=+250..., Text="1*1"
✅ USSD Response: CON Select access method...
```

### 2. Check Backend Logs

Look for these indicators:
- ✅ `MongoDB Connected` - Database is working
- ✅ `Server: http://localhost:5000` - Server started
- ❌ `Missing required USSD fields` - Request validation failed
- ❌ `USSD Error:` - Processing error

### 3. Test Database Connectivity

Ensure you have test data:
```bash
cd backend
node check-patient-passport.js
```

### 4. Verify USSD Service Health

```bash
curl http://localhost:5000/api/ussd/health
```

Expected response:
```json
{
  "success": true,
  "message": "USSD service is running",
  "timestamp": "2024-..."
}
```

---

## Common Issues and Quick Fixes

### Issue: "Session expired" message immediately

**Cause:** Session data is not being stored or retrieved properly

**Fix:** The session is stored in memory. Make sure:
1. Same `sessionId` is used across requests
2. Server hasn't restarted between requests
3. Not testing in production without Redis/database session storage

### Issue: "Patient not found" error

**Cause:** No patient record exists with the provided National ID or Email

**Fix:**
1. Check your database has patient records
2. Use the correct National ID or Email
3. Run database verification scripts

### Issue: CORS errors in browser console

**Cause:** Request origin not whitelisted

**Fix:** Already applied - Africa's Talking domains added to CORS whitelist

### Issue: "Cannot POST /api/ussd/callback"

**Cause:** Route not registered or server not running

**Fix:**
1. Ensure server is running
2. Check that USSD routes are imported in `server.ts`
3. Verify route is at `/api/ussd/callback` not `/ussd/callback`

---

## Production Deployment Checklist

- [ ] Update AFRICASTALKING_USERNAME from 'sandbox' to your production username
- [ ] Set production AFRICASTALKING_API_KEY
- [ ] Configure callback URL in Africa's Talking dashboard
- [ ] Implement Redis for session storage (instead of in-memory)
- [ ] Set up monitoring and alerting
- [ ] Test with real phone numbers
- [ ] Enable HTTPS/SSL
- [ ] Configure rate limiting for USSD endpoint
- [ ] Set up logging and error tracking

---

## Quick Test Checklist

✅ Backend server running
✅ Database connected
✅ USSD health endpoint responding
✅ Can start USSD session
✅ Language selection works
✅ Access method selection works
✅ National ID lookup works
✅ Email lookup works
✅ Menu navigation works
✅ Session management works

---

## Support Resources

- **Africa's Talking Docs:** https://developers.africastalking.com/docs/ussd/overview
- **USSD Simulator:** http://localhost:5000/ussd-simulator.html
- **API Documentation:** http://localhost:5000/api-docs
- **Test Scripts:** `backend/test/test-ussd.js`

---

## Contact

For issues specific to this implementation, check:
1. Server logs in terminal
2. Browser console (if using simulator)
3. Africa's Talking dashboard logs
4. Database records

**Last Updated:** November 2024
