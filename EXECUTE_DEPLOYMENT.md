# 🎯 Final Deployment Script - Execute This!

## Your Azure Configuration
- **App Name**: `patientpassport-api`
- **Resource Group**: `passportpatient_group-364`
- **Status**: Running ✅
- **URL**: https://patientpassport-api.azurewebsites.net

## 🚀 Execute These Commands

### Step 1: Set Environment Variables
```powershell
# Set all required environment variables
az webapp config appsettings set `
  --name patientpassport-api `
  --resource-group passportpatient_group-364 `
  --settings `
    FRONTEND_URL="https://jade-pothos-e432d0.netlify.app" `
    NODE_ENV="production" `
    CORS_ORIGIN="https://jade-pothos-e432d0.netlify.app"
```

### Step 2: Enable WebSockets (Required for Real-time Features)
```powershell
az webapp config set `
  --name patientpassport-api `
  --resource-group passportpatient_group-364 `
  --web-sockets-enabled true
```

### Step 3: Restart the Application
```powershell
az webapp restart `
  --name patientpassport-api `
  --resource-group passportpatient_group-364
```

## ✅ Verification Commands

After running the above commands, verify the configuration:

### Check Environment Variables
```powershell
az webapp config appsettings list `
  --name patientpassport-api `
  --resource-group passportpatient_group-364 `
  --query "[?name=='FRONTEND_URL' || name=='NODE_ENV' || name=='CORS_ORIGIN'].{Name:name, Value:value}" `
  --output table
```

### Check WebSocket Status
```powershell
az webapp config show `
  --name patientpassport-api `
  --resource-group passportpatient_group-364 `
  --query "webSocketsEnabled"
```

### Test Health Endpoint
```powershell
Invoke-WebRequest -Uri "https://patientpassport-api.azurewebsites.net/health" | ConvertFrom-Json | Format-List
```

### View Logs
```powershell
az webapp log tail `
  --name patientpassport-api `
  --resource-group passportpatient_group-364
```

## 📋 Optional: Redeploy Backend Code

If you want to redeploy the backend with the updated CORS configuration:

### Option 1: Quick Restart (Recommended First)
The environment variables set above should be sufficient. Just restart:
```powershell
az webapp restart `
  --name patientpassport-api `
  --resource-group passportpatient_group-364
```

### Option 2: Full Redeployment (If Needed)
If you need to redeploy the code changes:

```powershell
# Navigate to backend directory
cd backend

# Build the project
npm install
npm run build

# Deploy using ZIP
$publishFolder = "dist"
$zipPath = "deploy.zip"

# Create zip file
Compress-Archive -Path "$publishFolder\*", "package.json", "package-lock.json" -DestinationPath $zipPath -Force

# Deploy to Azure
az webapp deployment source config-zip `
  --name patientpassport-api `
  --resource-group passportpatient_group-364 `
  --src $zipPath

# Clean up
Remove-Item $zipPath
```

## 🧪 Test Your Application

After deployment, test these endpoints:

1. **Health Check**:
   ```powershell
   Invoke-WebRequest -Uri "https://patientpassport-api.azurewebsites.net/health"
   ```
   Expected: `"environment": "production"`

2. **API Documentation**:
   ```powershell
   Start-Process "https://patientpassport-api.azurewebsites.net/api-docs/"
   ```

3. **Frontend Application**:
   ```powershell
   Start-Process "https://jade-pothos-e432d0.netlify.app"
   ```

4. **Test CORS**:
   ```powershell
   $headers = @{
       "Origin" = "https://jade-pothos-e432d0.netlify.app"
   }
   Invoke-WebRequest -Uri "https://patientpassport-api.azurewebsites.net/health" -Headers $headers
   ```

## 📊 Quick Status Check

Run this single command to check everything:

```powershell
Write-Host "`n=== Azure App Service Status ===" -ForegroundColor Cyan
az webapp show --name patientpassport-api --resource-group passportpatient_group-364 --query "{Name:name, State:state, Location:location, DefaultHostName:defaultHostName}" --output table

Write-Host "`n=== WebSocket Status ===" -ForegroundColor Cyan
az webapp config show --name patientpassport-api --resource-group passportpatient_group-364 --query "webSocketsEnabled"

Write-Host "`n=== Key Environment Variables ===" -ForegroundColor Cyan
az webapp config appsettings list --name patientpassport-api --resource-group passportpatient_group-364 --query "[?name=='FRONTEND_URL' || name=='NODE_ENV' || name=='CORS_ORIGIN'].{Name:name, Value:value}" --output table

Write-Host "`n=== Health Check ===" -ForegroundColor Cyan
try {
    $health = Invoke-WebRequest -Uri "https://patientpassport-api.azurewebsites.net/health" | ConvertFrom-Json
    Write-Host "Status: $($health.message)" -ForegroundColor Green
    Write-Host "Environment: $($health.environment)" -ForegroundColor Green
    Write-Host "Version: $($health.version)" -ForegroundColor Green
} catch {
    Write-Host "Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}
```

## 🎉 Success Criteria

Your deployment is successful when:

- [x] Backend health check returns `"environment": "production"`
- [x] WebSocket is enabled (`true`)
- [x] `FRONTEND_URL` is set to `https://jade-pothos-e432d0.netlify.app`
- [x] Frontend can access backend APIs without CORS errors
- [x] Users can register/login successfully
- [x] Real-time notifications work

## 🐛 If Something Goes Wrong

### CORS Errors
```powershell
# Check CORS settings
az webapp config appsettings list --name patientpassport-api --resource-group passportpatient_group-364 --query "[?name=='CORS_ORIGIN' || name=='FRONTEND_URL']"

# Restart app
az webapp restart --name patientpassport-api --resource-group passportpatient_group-364
```

### WebSocket Issues
```powershell
# Enable WebSockets again
az webapp config set --name patientpassport-api --resource-group passportpatient_group-364 --web-sockets-enabled true

# Restart
az webapp restart --name patientpassport-api --resource-group passportpatient_group-364
```

### View Error Logs
```powershell
# Stream logs
az webapp log tail --name patientpassport-api --resource-group passportpatient_group-364

# Or download logs
az webapp log download --name patientpassport-api --resource-group passportpatient_group-364 --log-file app-logs.zip
```

---

## 📝 Summary

**Run these 3 commands to fix everything:**

```powershell
# 1. Set environment variables
az webapp config appsettings set --name patientpassport-api --resource-group passportpatient_group-364 --settings FRONTEND_URL="https://jade-pothos-e432d0.netlify.app" NODE_ENV="production" CORS_ORIGIN="https://jade-pothos-e432d0.netlify.app"

# 2. Enable WebSockets
az webapp config set --name patientpassport-api --resource-group passportpatient_group-364 --web-sockets-enabled true

# 3. Restart
az webapp restart --name patientpassport-api --resource-group passportpatient_group-364
```

**Then test**:
```powershell
# Open frontend
Start-Process "https://jade-pothos-e432d0.netlify.app"

# Check backend health
Invoke-WebRequest -Uri "https://patientpassport-api.azurewebsites.net/health"
```

Done! 🎉
