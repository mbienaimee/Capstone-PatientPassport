# Patient Passport USSD Service

## Overview

The Patient Passport USSD service allows patients to access their medical passport information using USSD codes on any mobile phone, including basic feature phones. This is powered by [Africa's Talking](https://africastalking.com/) USSD API.

## Features

- 📱 **Universal Access**: Works on any phone (smartphones and feature phones)
- 🌍 **Multi-language Support**: English and Kinyarwanda
- 🔐 **Secure Authentication**: National ID or Email-based verification
- 📨 **SMS Delivery**: Passport information sent via SMS
- 🚀 **Real-time**: Instant access to patient data
- 📊 **Access Logging**: All USSD access is tracked and audited

## USSD Flow

### Main Menu
```
Choose a language / Hitamo ururimi
1. English
2. Kinyarwanda
```

### Access Method Selection (English)
```
View my Patient Passport
1. Use National ID
2. Use Email
```

### Access Method Selection (Kinyarwanda)
```
Reba Passport yawe y'ubuzima
1. Koresha Irangamuntu
2. Koresha Email
```

### Input Prompts

**National ID (English)**
```
Enter your National ID (16 digits):
```

**National ID (Kinyarwanda)**
```
Shyiramo Irangamuntu (imibare 16):
```

**Email (English)**
```
Enter your Email address:
```

**Email (Kinyarwanda)**
```
Shyiramo Email yawe:
```

### Success Response

**English**
```
Your Patient Passport has been sent to your phone via SMS. Thank you!
```

**Kinyarwanda**
```
Passport yawe y'ubuzima yoherejwe kuri telephone yawe binyuze kuri SMS. Murakoze!
```

## Setup

### 1. Africa's Talking Account

1. Sign up at [Africa's Talking](https://africastalking.com/)
2. Create an application
3. Get your API credentials:
   - API Key
   - Username
4. Purchase a USSD code or use sandbox for testing

### 2. Environment Configuration

Add the following to your `.env` file:

```env
# Africa's Talking Configuration
AFRICASTALKING_API_KEY=your-api-key-here
AFRICASTALKING_USERNAME=your-username
AFRICASTALKING_USSD_CODE=*123#
```

### 3. Install Dependencies

```bash
cd backend
npm install africastalking
```

### 4. Configure Webhook

In your Africa's Talking dashboard:

1. Go to USSD → Settings
2. Set callback URL to: `https://your-domain.com/api/ussd/callback`
3. Method: POST
4. Save settings

## Testing

### Sandbox Testing

Africa's Talking provides a sandbox environment for testing:

1. Use sandbox credentials
2. Download the Africa's Talking Simulator app
3. Test USSD code: `*384*40767#`

### Local Testing with ngrok

For local development:

```bash
# Install ngrok
npm install -g ngrok

# Start your backend server
npm run dev

# In another terminal, expose your local server
ngrok http 5000

# Use the ngrok URL in Africa's Talking webhook
# Example: https://abc123.ngrok.io/api/ussd/callback
```

### Testing API Endpoint

```bash
# Test USSD flow programmatically
curl -X POST http://localhost:5000/api/ussd/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "sessionId": "test-session-123",
    "phoneNumber": "+250788123456",
    "text": "1*1*1234567890123456"
  }'
```

## API Endpoints

### Public Endpoints

#### USSD Callback
```
POST /api/ussd/callback
```

**Request Body:**
```json
{
  "sessionId": "ATUid_abc123",
  "serviceCode": "*123#",
  "phoneNumber": "+250788123456",
  "text": "1*1*1234567890123456"
}
```

**Response:**
```
CON Enter your National ID (16 digits):
```

### Protected Endpoints (Admin Only)

#### Test USSD Flow
```
POST /api/ussd/test
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "sessionId": "test-session",
  "phoneNumber": "+250788123456",
  "text": "1*1"
}
```

#### Get USSD Statistics
```
GET /api/ussd/stats
Authorization: Bearer <admin-token>
```

## SMS Format

The patient passport is sent via SMS in the following format:

### English
```
PATIENT PASSPORT
Name: John Doe
ID: 1234567890123456
DOB: 01/01/1990
Blood: O+
Allergies: Penicillin
Emergency: Jane Doe (+250788111222)

For full details, visit: https://your-app.com/patient-passport
Passport ID: 507f1f77bcf86cd799439011
```

### Kinyarwanda
```
PASSPORT Y'UBUZIMA
Amazina: John Doe
Irangamuntu: 1234567890123456
Itariki y'amavuko: 01/01/1990
Ubwoko bw'amaraso: O+
Imiti itemewe: Penicillin
Uhamagarwa mu byihutirwa: Jane Doe (+250788111222)

Kugira ngo ubone ibisobanuro byuzuye, sura: https://your-app.com/patient-passport
ID ya Passport: 507f1f77bcf86cd799439011
```

## Architecture

### Components

1. **USSD Controller** (`ussdController.ts`)
   - Handles Africa's Talking webhook
   - Processes USSD requests
   - Returns USSD responses

2. **USSD Service** (`ussdService.ts`)
   - Implements USSD menu logic
   - Manages session state
   - Validates user input
   - Fetches patient data
   - Triggers SMS sending

3. **SMS Service** (`smsService.ts`)
   - Integrates with Africa's Talking SMS API
   - Formats messages
   - Handles delivery
   - Validates phone numbers

### Data Flow

```
User Dials USSD Code
        ↓
Africa's Talking Platform
        ↓
POST /api/ussd/callback
        ↓
USSD Controller
        ↓
USSD Service (Process Request)
        ↓
Patient Database Query
        ↓
Format Response
        ↓
Send SMS (if final step)
        ↓
Return USSD Response
        ↓
Display to User
```

## Security

### Authentication
- National ID validation (16 digits)
- Email format validation
- Patient record verification

### Access Logging
All USSD access is logged with:
- Timestamp
- Phone number
- Access method (national ID or email)
- Patient ID
- Success/failure status

### Data Protection
- SMS messages contain summary information only
- Full passport details available via secure web link
- Access logs for audit trail
- Rate limiting on USSD endpoint

## Error Handling

### Invalid National ID
```
END Error: Invalid National ID. Must be 16 digits.
```

### Patient Not Found
```
END Error: Patient not found with this National ID.
```

### System Error
```
END An error occurred. Please try again later.
```

### Invalid Input Format
```
END Error: Invalid email format.
```

## Monitoring

### Metrics to Track
- Total USSD sessions
- Successful passport retrievals
- Failed attempts
- Popular access methods
- Language preferences
- Average response time
- SMS delivery rates

### Logging

All USSD interactions are logged:

```typescript
console.log('📱 USSD Request - Session: ${sessionId}, Phone: ${phoneNumber}');
console.log('✅ Passport SMS sent to ${phoneNumber}');
console.log('❌ Error processing passport request:', error);
```

## Cost Considerations

### Africa's Talking Pricing
- **USSD**: ~$0.01 per session
- **SMS**: ~$0.02-$0.05 per message
- **Setup Fee**: Varies by country

### Cost Optimization
- Limit passport summary in first SMS
- Provide web link for full details
- Implement caching for frequent requests
- Set up usage alerts

## Troubleshooting

### USSD Not Working

1. **Check Webhook URL**
   - Verify callback URL in Africa's Talking dashboard
   - Ensure URL is publicly accessible
   - Check for HTTPS requirement

2. **Verify Credentials**
   - API Key is correct
   - Username matches your application
   - USSD code is registered

3. **Test Connection**
   ```bash
   curl -X POST https://your-domain.com/api/ussd/callback \
     -H "Content-Type: application/json" \
     -d '{"sessionId":"test","phoneNumber":"+250788123456","text":""}'
   ```

### SMS Not Delivered

1. **Check Phone Number Format**
   - Must be E.164 format (+250XXXXXXXXX)
   - Country code included

2. **Verify SMS Balance**
   ```bash
   # Check account balance
   curl -X GET https://your-domain.com/api/ussd/balance \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

3. **Review SMS Logs**
   - Check Africa's Talking dashboard
   - Review application logs

## Production Deployment

### Pre-launch Checklist

- [ ] Production API credentials configured
- [ ] USSD code purchased and registered
- [ ] Webhook URL pointing to production server
- [ ] SSL certificate installed (HTTPS required)
- [ ] Error monitoring set up
- [ ] SMS balance sufficient
- [ ] Load testing completed
- [ ] User acceptance testing done

### Scaling Considerations

- Use Redis for session management
- Implement request queuing
- Set up database read replicas
- Configure CDN for static assets
- Monitor Africa's Talking rate limits

## Support

### Resources
- [Africa's Talking Documentation](https://developers.africastalking.com/docs)
- [USSD Best Practices](https://developers.africastalking.com/docs/ussd/overview)
- [SMS API Guide](https://developers.africastalking.com/docs/sms/overview)

### Contact
- Email: support@patientpassport.com
- Slack: #ussd-support
- Emergency: +250788XXXXXX

## Roadmap

### Future Enhancements
- [ ] Multi-patient lookup
- [ ] Appointment scheduling via USSD
- [ ] Emergency alerts
- [ ] Medical record updates
- [ ] Prescription refill requests
- [ ] Voice call integration
- [ ] USSD-based consent management
- [ ] Integration with health insurance

## License

MIT License - See LICENSE file for details
