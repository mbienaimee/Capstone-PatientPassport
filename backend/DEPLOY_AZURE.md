# Deploy Backend to Azure App Service

This document explains how to deploy the `backend` (PatientPassport API) to Azure App Service and configure the required settings so SMTP, sockets, and sync work correctly.

Prerequisites
- Azure CLI installed and logged in: `az login`
- `zip`/PowerShell available (Windows PowerShell recommended)
- Node 18+ build environment

Recommended App Service configuration
- Platform: Linux (Node 18+) or Windows (Node via iisnode). Linux recommended for simplicity.
- Enable **Web Sockets** on the Web App.
- Set **Always On** to true (prevents app cold-starts for sockets/cron).
- Configure application settings (environment variables) listed below.

Required environment variables (App Settings)
- `NODE_ENV=production`
- `PORT` (Azure will set this automatically, leave unset unless required)
- `MONGO_URI` - Your MongoDB connection string
- `JWT_SECRET`
- `EMAIL_HOST` - e.g. `smtp.gmail.com` or `smtp.sendgrid.net`
- `EMAIL_PORT` - usually `587`
- `EMAIL_USER` - `apikey` for SendGrid or your Gmail address
- `EMAIL_PASS` - SendGrid API key or Gmail app password
- `EMAIL_FROM` - e.g. `PatientPassport <noreply@example.com>`
- `VITE_API_BASE_URL` and `VITE_SOCKET_URL` are for the frontend build (set in frontend host)

Recommended Azure CLI steps (PowerShell)
1. Login:
   ```powershell
   az login
   ```
2. Create resource group and app plan (example):
   ```powershell
   $rg = 'patientpassport-rg'
   $location = 'eastus'
   $plan = 'patientpassport-plan'
   $app = 'patientpassport-api'
   az group create --name $rg --location $location
   az appservice plan create --name $plan --resource-group $rg --sku B1 --is-linux
   ```
3. Create web app (Node 18):
   ```powershell
   az webapp create --resource-group $rg --plan $plan --name $app --runtime "NODE|18-lts"
   ```
4. Enable Web Sockets and Always On:
   ```powershell
   az webapp config set --resource-group $rg --name $app --web-sockets-enabled true
   az webapp config set --resource-group $rg --name $app --always-on true
   ```
5. Set App Settings (example placeholders):
   ```powershell
   az webapp config appsettings set --resource-group $rg --name $app --settings \
     NODE_ENV=production \
     EMAIL_HOST=smtp.gmail.com \
     EMAIL_PORT=587 \
     EMAIL_USER=you@example.com \
     EMAIL_PASS='<your-app-password-or-sendgrid-key>' \
     EMAIL_FROM='PatientPassport <noreply@example.com>'
   ```

Deployment (zip push)
1. From the repo root, build the backend and zip the output:
   ```powershell
   cd backend
   npm ci
   npm run build
   Remove-Item -Path ../backend.zip -ErrorAction Ignore
   Compress-Archive -Path * -DestinationPath ../backend.zip -Force
   ```
2. Push the zip to the web app:
   ```powershell
   az webapp deployment source config-zip --resource-group $rg --name $app --src ../backend.zip
   ```
3. Restart the app:
   ```powershell
   az webapp restart --resource-group $rg --name $app
   ```

Post-deploy verification
- Health endpoint: `https://<app>.azurewebsites.net/health`
- Test email: POST to `/api/auth/test-email` with body `{ "email": "you@example.com" }`
- Check logs with `az webapp log tail --resource-group $rg --name $app`

Troubleshooting notes
- If you see `RENDER` in environment variables, remove it to avoid the Render fallback behavior in the email service.
- If SMTP times out, ensure credentials are correct and provider allows connections from Azure (SendGrid recommended).
- If sockets do not connect, confirm `web-sockets-enabled` is `true`, and `Always On` is set.

If you'd like, run the `deploy-backend-azure.ps1` script included in this repo to automate these steps (it's interactive and will place placeholders you must update with real secrets).
