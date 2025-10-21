# 🚀 Quick Azure Deployment Commands

## Set Environment Variables in Azure

### PowerShell (Windows)
```powershell
# Login to Azure
az login

# Set the environment variables
az webapp config appsettings set `
  --name patientpassport-api `
  --resource-group <your-resource-group-name> `
  --settings `
    FRONTEND_URL="https://jade-pothos-e432d0.netlify.app" `
    NODE_ENV="production" `
    MONGODB_URI="mongodb+srv://reine:KgzYIrHtPXg4Xfc3@cluster0.fslpg5p.mongodb.net/CapstonePassportSystem?retryWrites=true&w=majority" `
    JWT_SECRET="your-super-secret-jwt-key-here" `
    EMAIL_USER="reine123e@gmail.com" `
    EMAIL_PASS="ehkx uewt etaq sylo" `
    EMAIL_FROM="PatientPassport <reine123e@gmail.com>" `
    CORS_ORIGIN="https://jade-pothos-e432d0.netlify.app"

# Enable WebSockets
az webapp config set `
  --name patientpassport-api `
  --resource-group <your-resource-group-name> `
  --web-sockets-enabled true

# Restart the app
az webapp restart `
  --name patientpassport-api `
  --resource-group <your-resource-group-name>
```

### Bash (Linux/Mac)
```bash
# Login to Azure
az login

# Set the environment variables
az webapp config appsettings set \
  --name patientpassport-api \
  --resource-group <your-resource-group-name> \
  --settings \
    FRONTEND_URL="https://jade-pothos-e432d0.netlify.app" \
    NODE_ENV="production" \
    MONGODB_URI="mongodb+srv://reine:KgzYIrHtPXg4Xfc3@cluster0.fslpg5p.mongodb.net/CapstonePassportSystem?retryWrites=true&w=majority" \
    JWT_SECRET="your-super-secret-jwt-key-here" \
    EMAIL_USER="reine123e@gmail.com" \
    EMAIL_PASS="ehkx uewt etaq sylo" \
    EMAIL_FROM="PatientPassport <reine123e@gmail.com>" \
    CORS_ORIGIN="https://jade-pothos-e432d0.netlify.app"

# Enable WebSockets
az webapp config set \
  --name patientpassport-api \
  --resource-group <your-resource-group-name> \
  --web-sockets-enabled true

# Restart the app
az webapp restart \
  --name patientpassport-api \
  --resource-group <your-resource-group-name>
```

## Find Your Resource Group Name

If you don't know your resource group name:

```powershell
# List all resource groups
az group list --output table

# Or find the specific app service
az webapp list --output table

# Or get details of your app
az webapp show --name patientpassport-api --query "{Name:name, ResourceGroup:resourceGroup, State:state}" --output table
```

## Redeploy Backend Code

### Option 1: Git Deployment
```powershell
# Navigate to backend directory
cd backend

# Add and commit changes
git add .
git commit -m "Update CORS configuration"

# Push to Azure (if configured)
git push azure main
```

### Option 2: ZIP Deployment
```powershell
# Navigate to backend directory
cd backend

# Build the project
npm run build

# Create deployment package
Compress-Archive -Path dist,package.json,package-lock.json -DestinationPath deploy.zip

# Deploy to Azure
az webapp deployment source config-zip `
  --name patientpassport-api `
  --resource-group <your-resource-group-name> `
  --src deploy.zip
```

## View Logs

```powershell
# Stream logs in real-time
az webapp log tail `
  --name patientpassport-api `
  --resource-group <your-resource-group-name>

# Download logs
az webapp log download `
  --name patientpassport-api `
  --resource-group <your-resource-group-name> `
  --log-file logs.zip
```

## Test Deployment

```powershell
# Test health endpoint
Invoke-WebRequest -Uri "https://patientpassport-api.azurewebsites.net/health" | Select-Object -ExpandProperty Content

# Test API docs
Start-Process "https://patientpassport-api.azurewebsites.net/api-docs/"

# Test frontend
Start-Process "https://jade-pothos-e432d0.netlify.app"
```

## Verify Configuration

```powershell
# View current environment variables
az webapp config appsettings list `
  --name patientpassport-api `
  --resource-group <your-resource-group-name> `
  --output table

# Check WebSocket status
az webapp config show `
  --name patientpassport-api `
  --resource-group <your-resource-group-name> `
  --query "webSocketsEnabled"
```

## Troubleshooting Commands

```powershell
# Check app state
az webapp show `
  --name patientpassport-api `
  --resource-group <your-resource-group-name> `
  --query "{Name:name, State:state, Location:location}" `
  --output table

# Restart app
az webapp restart `
  --name patientpassport-api `
  --resource-group <your-resource-group-name>

# Stop app
az webapp stop `
  --name patientpassport-api `
  --resource-group <your-resource-group-name>

# Start app
az webapp start `
  --name patientpassport-api `
  --resource-group <your-resource-group-name>
```

---

**Note**: Replace `<your-resource-group-name>` with your actual Azure resource group name.

**Quick Find Resource Group**:
```powershell
az webapp list --query "[?name=='patientpassport-api'].resourceGroup" --output tsv
```
