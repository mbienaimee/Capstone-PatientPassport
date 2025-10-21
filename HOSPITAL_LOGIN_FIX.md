# 🔧 Fix Hospital Login Issue - JWT_REFRESH_SECRET Missing

## 🚨 Problem Identified

**Error**: `JWT_REFRESH_SECRET is not defined`  
**Location**: Azure Backend Environment Variables  
**Impact**: Hospital login failing with 500 Internal Server Error

## ✅ Solution

The Azure backend is missing the `JWT_REFRESH_SECRET` environment variable. Here's how to fix it:

### Step 1: Set Missing Environment Variables in Azure

**Via Azure Portal:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your App Service: `patientpassport-api`
3. Go to **Settings** → **Environment variables**
4. Add these missing variables:

```bash
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-12345
JWT_REFRESH_EXPIRE=30d
JWT_RESET_SECRET=your-reset-secret-key-here-67890
JWT_RESET_EXPIRE=10m
```

**Via Azure CLI:**
```bash
az webapp config appsettings set --name patientpassport-api --resource-group <your-resource-group> --settings JWT_REFRESH_SECRET="your-super-secret-refresh-key-here-12345" JWT_REFRESH_EXPIRE="30d" JWT_RESET_SECRET="your-reset-secret-key-here-67890" JWT_RESET_EXPIRE="10m"
```

### Step 2: Restart Azure App Service

```bash
az webapp restart --name patientpassport-api --resource-group <your-resource-group>
```

### Step 3: Verify Fix

Test the hospital login again - it should now work without the 500 error.

## 🔍 Required Environment Variables

Make sure these are all set in Azure:

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-12345
JWT_REFRESH_EXPIRE=30d
JWT_RESET_SECRET=your-reset-secret-key-here-67890
JWT_RESET_EXPIRE=10m

# Other required variables
NODE_ENV=production
MONGODB_URI=<your_mongodb_connection_string>
EMAIL_USER=reine123e@gmail.com
EMAIL_PASS=<your_email_app_password>
FRONTEND_URL=https://jade-pothos-e432d0.netlify.app
```

## 🧪 Test After Fix

1. Go to: https://jade-pothos-e432d0.netlify.app/hospital-login
2. Try logging in with hospital credentials
3. Should work without 500 error

## 📞 Quick Fix Commands

If you have Azure CLI configured:

```bash
# Set the missing JWT secrets
az webapp config appsettings set --name patientpassport-api --resource-group <your-rg> --settings JWT_REFRESH_SECRET="refresh-secret-12345" JWT_REFRESH_EXPIRE="30d"

# Restart the service
az webapp restart --name patientpassport-api --resource-group <your-rg>
```

This will immediately fix the hospital login issue!
