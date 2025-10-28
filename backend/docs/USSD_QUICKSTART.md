# USSD Quick Start Guide

## For Patients

### How to Access Your Patient Passport via USSD

1. **Dial the USSD Code**
   - Dial: `*123#` (or your configured code)
   - Works on any phone (no internet needed!)

2. **Choose Language**
   ```
   Choose a language / Hitamo ururimi
   1. English
   2. Kinyarwanda
   ```
   - Press `1` for English
   - Press `2` for Kinyarwanda

3. **Select Access Method**
   ```
   View my Patient Passport
   1. Use National ID
   2. Use Email
   ```
   - Press `1` to use your National ID
   - Press `2` to use your email address

4. **Enter Your Details**
   - **National ID**: Enter your 16-digit National ID
   - **Email**: Enter your registered email address

5. **Receive Your Passport**
   - You'll receive an SMS with your passport summary
   - A second SMS contains a link to full details

### Example Flow

```
User dials: *123#

Response: Choose a language / Hitamo ururimi
          1. English
          2. Kinyarwanda

User enters: 1

Response: View my Patient Passport
          1. Use National ID
          2. Use Email

User enters: 1

Response: Enter your National ID (16 digits):

User enters: 1234567890123456

Response: Your Patient Passport has been sent to 
          your phone via SMS. Thank you!

SMS Received:
PATIENT PASSPORT
Name: John Doe
ID: 1234567890123456
DOB: 01/01/1990
Blood: O+
Allergies: Penicillin
Emergency: Jane Doe (+250788111222)
```

## For Developers

### Quick Setup

```bash
# 1. Install Africa's Talking SDK
npm install africastalking

# 2. Add environment variables
AFRICASTALKING_API_KEY=your-api-key
AFRICASTALKING_USERNAME=your-username

# 3. Start server
npm run dev

# 4. Test USSD endpoint
curl -X POST http://localhost:5000/api/ussd/callback \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "phoneNumber": "+250788123456",
    "text": ""
  }'
```

### Test with Simulator

1. Download Africa's Talking Simulator
2. Use sandbox code: `*384*40767#`
3. Test all flows

### File Structure

```
backend/
├── src/
│   ├── controllers/
│   │   └── ussdController.ts      # USSD endpoints
│   ├── services/
│   │   ├── ussdService.ts         # USSD logic
│   │   └── smsService.ts          # SMS integration
│   └── routes/
│       └── ussd.ts                # USSD routes
├── docs/
│   ├── USSD_GUIDE.md             # Full documentation
│   └── USSD_DEPLOYMENT.md        # Deployment guide
└── test/
    └── ussd.test.js              # Test suite
```

## For Administrators

### Monitor USSD Usage

```bash
# Get statistics
curl -X GET http://localhost:5000/api/ussd/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test USSD Flow

```bash
# Test programmatically
curl -X POST http://localhost:5000/api/ussd/test \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "phoneNumber": "+250788123456",
    "text": "1*1"
  }'
```

### Check Logs

```bash
# View USSD logs
pm2 logs patientpassport-api | grep "USSD"

# View recent errors
pm2 logs patientpassport-api --err

# Monitor in real-time
pm2 monit
```

## Troubleshooting

### User Issues

**Q: USSD code doesn't work**
- Verify you're dialing the correct code
- Check your network connection
- Try again after a few minutes
- Contact support if issue persists

**Q: SMS not received**
- Check your phone number is correct
- Ensure you have network signal
- Check spam/blocked messages
- Wait up to 5 minutes for delivery

**Q: Error message displayed**
- Verify your National ID is 16 digits
- Check email format is correct
- Ensure you're a registered patient
- Contact support with error details

### Technical Issues

**Q: Webhook not receiving requests**
- Verify callback URL is public and HTTPS
- Check firewall settings
- Test URL manually
- Review Africa's Talking dashboard

**Q: High error rates**
- Check application logs
- Verify database connection
- Test API endpoints
- Review recent deployments

**Q: Slow responses**
- Monitor server resources
- Check database performance
- Review network latency
- Consider caching

## Support

### For Patients
- Email: support@patientpassport.com
- Phone: +250788XXXXXX
- Hours: 24/7

### For Technical Issues
- Email: tech@patientpassport.com
- Slack: #ussd-support
- Emergency: +250788YYYYYY

## Additional Resources

- [Full USSD Guide](./USSD_GUIDE.md)
- [Deployment Guide](./USSD_DEPLOYMENT.md)
- [Africa's Talking Docs](https://developers.africastalking.com/docs)
- [API Documentation](http://localhost:5000/api-docs)

## FAQs

**Q: Does USSD work without internet?**
Yes! USSD works on any phone, no internet required.

**Q: How much does it cost?**
USSD is free for users. Standard SMS rates may apply.

**Q: Is my data secure?**
Yes. All access is logged and data is encrypted.

**Q: What if I forgot my National ID?**
Use the email option instead.

**Q: Can I use this for emergency access?**
Yes! Your emergency contact information is included in the SMS.

**Q: Which languages are supported?**
Currently English and Kinyarwanda.

**Q: What if I change my phone number?**
Update your contact information in your patient profile.

**Q: Can family members access my passport?**
Only with your National ID or email address.

## Quick Reference

### USSD Navigation

```
*123#                              → Main menu
*123#*1                           → English menu
*123#*1*1                         → National ID prompt
*123#*1*1*1234567890123456       → Submit National ID
*123#*1*2                         → Email prompt
*123#*1*2*email@example.com      → Submit email
*123#*2                           → Kinyarwanda menu
```

### Response Codes

- `CON` - Continue (more input needed)
- `END` - End session (final response)

### Phone Number Format

- Rwanda: `+250788123456`
- Must include country code
- E.164 format

---

**Need Help?** Contact support@patientpassport.com
