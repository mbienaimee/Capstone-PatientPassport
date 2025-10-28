# USSD Deployment Guide

## Prerequisites

Before deploying the USSD service, ensure you have:

- [ ] Africa's Talking account created
- [ ] Production API credentials obtained
- [ ] USSD code purchased and assigned
- [ ] Server with public HTTPS endpoint
- [ ] SSL certificate installed
- [ ] MongoDB database accessible
- [ ] Environment variables configured

## Step-by-Step Deployment

### Step 1: Africa's Talking Setup

#### 1.1 Create Account
1. Visit [Africa's Talking](https://africastalking.com/)
2. Sign up for an account
3. Verify your email and phone number
4. Complete KYC verification

#### 1.2 Create Application
1. Log into your dashboard
2. Go to "Apps" → "Create App"
3. Enter application name: "Patient Passport"
4. Select your country: Rwanda
5. Save application

#### 1.3 Get API Credentials
1. Navigate to "Settings" → "API Key"
2. Click "Generate API Key"
3. **IMPORTANT**: Save the API key securely (you won't see it again)
4. Note your username (usually your phone number or custom name)

#### 1.4 Purchase USSD Code
1. Go to "USSD" → "Get USSD Code"
2. Select country: Rwanda
3. Choose a memorable code (e.g., `*123*456#`)
4. Complete payment process
5. Wait for code activation (usually 24-48 hours)

### Step 2: Server Configuration

#### 2.1 Environment Variables

Create or update your `.env` file:

```env
# Africa's Talking Configuration
AFRICASTALKING_API_KEY=your-production-api-key
AFRICASTALKING_USERNAME=your-username
AFRICASTALKING_USSD_CODE=*123*456#

# Server Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-app.com

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/patientpassport

# JWT & Security
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-session-secret
```

#### 2.2 Build Application

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Test build
NODE_ENV=production node dist/app.js
```

### Step 3: Deploy to Server

#### Option A: Deploy to Azure App Service

```bash
# Login to Azure
az login

# Create resource group
az group create --name PatientPassport-RG --location eastus

# Create App Service plan
az appservice plan create \
  --name PatientPassport-Plan \
  --resource-group PatientPassport-RG \
  --sku B1 \
  --is-linux

# Create web app
az webapp create \
  --name patientpassport-api \
  --resource-group PatientPassport-RG \
  --plan PatientPassport-Plan \
  --runtime "NODE|18-lts"

# Configure environment variables
az webapp config appsettings set \
  --name patientpassport-api \
  --resource-group PatientPassport-RG \
  --settings \
    AFRICASTALKING_API_KEY="your-api-key" \
    AFRICASTALKING_USERNAME="your-username" \
    NODE_ENV="production"

# Deploy code
az webapp deployment source config-zip \
  --name patientpassport-api \
  --resource-group PatientPassport-RG \
  --src backend.zip
```

#### Option B: Deploy to Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create patientpassport-api

# Set environment variables
heroku config:set AFRICASTALKING_API_KEY=your-api-key
heroku config:set AFRICASTALKING_USERNAME=your-username
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Check logs
heroku logs --tail
```

#### Option C: Deploy to VPS (DigitalOcean, AWS EC2, etc.)

```bash
# SSH into server
ssh user@your-server-ip

# Clone repository
git clone https://github.com/your-repo/patient-passport.git
cd patient-passport/backend

# Install dependencies
npm install

# Create .env file
nano .env
# Paste your environment variables

# Install PM2 (process manager)
npm install -g pm2

# Start application
pm2 start dist/app.js --name patientpassport-api

# Configure PM2 to start on boot
pm2 startup
pm2 save

# Setup Nginx reverse proxy
sudo nano /etc/nginx/sites-available/patientpassport

# Add configuration:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/patientpassport /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install SSL certificate
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Step 4: Configure Webhook

#### 4.1 Set Callback URL

1. Log into Africa's Talking dashboard
2. Navigate to "USSD" → "USSD Codes"
3. Click on your USSD code
4. Set Callback URL: `https://your-domain.com/api/ussd/callback`
5. Method: `POST`
6. Save settings

#### 4.2 Test Webhook

```bash
# Test from command line
curl -X POST https://your-domain.com/api/ussd/callback \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "serviceCode": "*123*456#",
    "phoneNumber": "+250788123456",
    "text": ""
  }'

# Expected response: CON Choose a language / Hitamo ururimi...
```

### Step 5: Testing

#### 5.1 Sandbox Testing

1. Download Africa's Talking Simulator app
2. Enter sandbox USSD code: `*384*40767#`
3. Follow the prompts
4. Verify responses

#### 5.2 Production Testing

1. Dial your USSD code on a real phone
2. Test all flows:
   - English language
   - Kinyarwanda language
   - National ID lookup
   - Email lookup
3. Verify SMS delivery
4. Check access logs

### Step 6: Monitoring Setup

#### 6.1 Application Monitoring

```bash
# Install monitoring tools
npm install newrelic @sentry/node

# Configure New Relic
# Add to app.ts:
require('newrelic');

# Configure Sentry
import * as Sentry from "@sentry/node";
Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV
});
```

#### 6.2 Set Up Alerts

Configure alerts for:
- High error rates
- Slow response times
- SMS delivery failures
- Low Africa's Talking balance
- Server downtime

#### 6.3 Logging

```bash
# Configure log aggregation
npm install winston winston-cloudwatch

# Set up log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Step 7: Security Hardening

#### 7.1 Firewall Configuration

```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Verify
sudo ufw status
```

#### 7.2 Rate Limiting

Already implemented in code, but verify:
- `/api/ussd/callback`: 60 requests per minute
- Other endpoints: As configured

#### 7.3 IP Whitelisting (Optional)

Add Africa's Talking IPs to whitelist:
- Review their documentation for current IP ranges
- Configure in firewall or application level

### Step 8: Backup Strategy

#### 8.1 Database Backups

```bash
# Set up automated MongoDB backups
# Example cron job (daily at 2 AM):
0 2 * * * mongodump --uri="your-mongodb-uri" --out=/backups/$(date +\%Y-\%m-\%d)

# Keep last 30 days
0 3 * * * find /backups/* -mtime +30 -delete
```

#### 8.2 Code Backups

- Use Git for version control
- Tag releases: `git tag -a v1.0.0 -m "Production release"`
- Push to remote: `git push origin --tags`

### Step 9: Documentation

#### 9.1 Create Runbook

Document:
- How to restart service
- How to check logs
- How to update code
- Emergency contacts
- Rollback procedures

#### 9.2 User Guide

Create guide for:
- How to use USSD service
- Supported languages
- Troubleshooting steps
- Support contact

### Step 10: Go Live

#### 10.1 Pre-Launch Checklist

- [ ] All tests passing
- [ ] Webhook configured correctly
- [ ] SSL certificate valid
- [ ] Environment variables set
- [ ] Monitoring active
- [ ] Backup strategy in place
- [ ] Support team trained
- [ ] User documentation ready

#### 10.2 Launch

1. Announce USSD code to users
2. Monitor closely for first 24 hours
3. Be ready to address issues quickly
4. Collect user feedback

#### 10.3 Post-Launch

- Monitor usage metrics
- Track error rates
- Gather user feedback
- Plan improvements

## Troubleshooting

### Common Issues

#### USSD Not Responding

**Symptoms:** Users dial code but nothing happens

**Solutions:**
1. Check webhook URL is correct and accessible
2. Verify SSL certificate is valid
3. Check server logs for errors
4. Test callback URL manually
5. Verify Africa's Talking account is active

#### SMS Not Delivering

**Symptoms:** USSD works but SMS not received

**Solutions:**
1. Check Africa's Talking SMS balance
2. Verify phone number format (E.164)
3. Check SMS logs in Africa's Talking dashboard
4. Review application SMS logs
5. Test with different phone numbers

#### Slow Response Times

**Symptoms:** USSD menus load slowly

**Solutions:**
1. Optimize database queries
2. Add caching layer (Redis)
3. Increase server resources
4. Review application logs for bottlenecks
5. Check network latency

#### High Error Rates

**Symptoms:** Users seeing error messages

**Solutions:**
1. Check application logs
2. Verify database connectivity
3. Review recent code changes
4. Check third-party service status
5. Increase error logging

## Maintenance

### Regular Tasks

**Daily:**
- Check error logs
- Monitor usage metrics
- Verify SMS delivery rates

**Weekly:**
- Review Africa's Talking balance
- Check system performance
- Update documentation

**Monthly:**
- Review and optimize code
- Update dependencies
- Analyze usage patterns
- Plan improvements

### Updates

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Restart service
pm2 restart patientpassport-api

# Verify
pm2 logs patientpassport-api
```

## Support

### Emergency Contacts

- Technical Lead: +250788XXXXXX
- Africa's Talking Support: support@africastalking.com
- Server Provider: support@your-provider.com

### Escalation Process

1. **Level 1**: Check logs and restart service
2. **Level 2**: Contact technical lead
3. **Level 3**: Contact Africa's Talking support
4. **Level 4**: Emergency rollback

## Cost Management

### Monitor Costs

- Africa's Talking USSD: ~$0.01 per session
- Africa's Talking SMS: ~$0.02-$0.05 per message
- Server costs: Variable
- Database costs: Variable

### Optimization

- Cache frequent queries
- Implement usage limits
- Monitor and alert on high usage
- Review pricing regularly

## Compliance

### Data Protection

- Log USSD access for audit
- Encrypt sensitive data
- Comply with local regulations
- Regular security audits

### Privacy

- Minimal data collection
- Clear user consent
- Data retention policy
- Right to be forgotten

## Success Metrics

Track:
- Daily active users
- Success rate (passport delivered)
- Average session duration
- Error rate
- User satisfaction
- Cost per transaction

## Next Steps

After successful deployment:

1. Gather user feedback
2. Monitor metrics
3. Plan enhancements
4. Scale as needed
5. Consider additional features

---

**Deployment Date:** _____________

**Deployed By:** _____________

**Version:** _____________

**Notes:** _____________
