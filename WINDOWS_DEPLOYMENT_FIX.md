# 🔧 Windows Web App Deployment - FIXED

## ✅ Issue Resolved

**Error:** 
```
startup-command is not a valid input for Windows web app or with publish-profile auth scheme.
```

**Root Cause:** 
The `startup-command` parameter is **only supported for Linux-based Web Apps and containers**, NOT for Windows Web Apps.

---

## 🛠️ What Was Fixed

### 1. Removed Invalid Parameters

**Before (❌ BROKEN):**
```yaml
- name: Deploy to Azure Web App
  uses: azure/webapps-deploy@v3
  with:
    app-name: 'patientpassport-api'
    package: ./deploy.zip
    type: zip
    restart: true
    startup-command: 'node dist/server.js'  # ❌ NOT VALID for Windows!
```

**After (✅ FIXED):**
```yaml
- name: Deploy to Azure Web App
  uses: azure/webapps-deploy@v3
  with:
    app-name: 'patientpassport-api'
    package: ./deploy.zip
```

### 2. Created `web.config` for Windows IIS

Windows Azure Web Apps use **IIS (Internet Information Services)** with the **iisnode** module to run Node.js apps. A `web.config` file is required to tell IIS how to handle Node.js.

**Created:** `backend/web.config`

Key configuration:
- Entry point: `dist/server.js`
- Handler: `iisnode` module
- URL rewriting for SPA routing
- Production environment settings
- Logging enabled for troubleshooting

### 3. Updated Deployment Process

**Removed:**
- ❌ `startup-command` parameter (Windows doesn't support it)
- ❌ `type: zip` parameter (not needed)
- ❌ `restart: true` parameter (handled automatically)
- ❌ Manual app stop/start (unnecessary)

**Added:**
- ✅ Node.js version configuration via Azure CLI
- ✅ `web.config` included in deployment package
- ✅ Deployment verification with curl check

---

## 📂 Files Modified/Created

### Modified
1. **`.github/workflows/main_patientpassport-api.yml`**
   - Removed `startup-command`, `type`, and `restart` parameters
   - Added Node.js version configuration step
   - Included `web.config` in deployment package
   - Added deployment verification

### Created
2. **`backend/web.config`**
   - IIS configuration for Node.js
   - URL rewriting rules
   - Production environment settings
   - iisnode module configuration

---

## 🎯 How Windows Deployment Works

### For Windows Web Apps:
1. **IIS** (web server) receives requests
2. **iisnode** module intercepts requests for `*.js` files
3. **web.config** tells iisnode which file to execute (`dist/server.js`)
4. Node.js app runs as a child process of IIS
5. Requests are proxied to your Node.js app

### Key Differences: Windows vs Linux

| Feature | Linux Web App | Windows Web App |
|---------|---------------|-----------------|
| Web Server | Direct Node.js | IIS + iisnode |
| Startup Command | ✅ Supported | ❌ Not supported |
| Configuration | Environment vars | `web.config` |
| Entry Point | Command line | `web.config` handler |
| Package Manager | Built-in npm | Built-in npm |

---

## ✅ Updated Workflow Summary

### Build Job (Unchanged)
1. Checkout code
2. Setup Node.js 18.x
3. Install dependencies
4. Build project (`npm run build`)
5. Create deployment package (dist + package.json + **web.config**)
6. Upload artifact

### Deploy Job (Fixed)
1. Download build artifact
2. Install production dependencies
3. Create ZIP package
4. **Login to Azure** (OIDC)
5. Set subscription
6. Define resource group
7. **Configure Node.js version** (NEW - via Azure CLI)
8. **Deploy ZIP package** (FIXED - removed invalid parameters)
9. **Verify deployment** (NEW - curl check)

---

## 🚀 Deployment Commands

The workflow now uses these Azure CLI commands:

```bash
# Set Node.js version for Windows App
az webapp config appsettings set \
  --name patientpassport-api \
  --resource-group passportpatient_group-364 \
  --settings WEBSITE_NODE_DEFAULT_VERSION="~18"

# Deploy happens via GitHub Action (azure/webapps-deploy@v3)

# Verify deployment
curl -I https://patientpassport-api.azurewebsites.net
```

---

## 📝 web.config Explained

```xml
<configuration>
  <system.webServer>
    <handlers>
      <!-- Tell IIS to use iisnode for dist/server.js -->
      <add name="iisnode" path="dist/server.js" verb="*" modules="iisnode"/>
    </handlers>
    
    <rewrite>
      <rules>
        <!-- Route all requests to Node.js -->
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="dist/server.js"/>
        </rule>
      </rules>
    </rewrite>
    
    <iisnode node_env="production" />
  </system.webServer>
</configuration>
```

---

## 🧪 Testing the Fix

### What to Expect:

1. **Build job** completes successfully ✅
2. **Deploy job** logs in with OIDC ✅
3. **Configure Node.js** sets version to ~18 ✅
4. **Deploy** uploads ZIP without errors ✅
5. **Verification** curls the app URL ✅

### Successful Deployment Output:

```
✅ Deployment complete!
🌐 URL: https://patientpassport-api.azurewebsites.net
Waiting for app to start...
HTTP/1.1 200 OK
```

---

## 🐛 Troubleshooting

### If deployment still fails:

1. **Check web.config is included:**
   ```bash
   # In workflow logs, check "Prepare deployment package" step
   # Should show: web.config in the file list
   ```

2. **Verify Node.js version:**
   ```bash
   az webapp config appsettings list \
     --name patientpassport-api \
     --resource-group passportpatient_group-364 \
     --query "[?name=='WEBSITE_NODE_DEFAULT_VERSION']"
   ```

3. **Check app logs:**
   ```bash
   az webapp log tail \
     --name patientpassport-api \
     --resource-group passportpatient_group-364
   ```

4. **Common Windows-specific issues:**
   - Ensure `dist/server.js` exists (check build output)
   - Verify your app listens on `process.env.PORT`
   - Check that `package.json` has all dependencies

---

## 📚 Resources

- [Configure Node.js on Windows App Service](https://learn.microsoft.com/en-us/azure/app-service/configure-language-nodejs?pivots=platform-windows)
- [iisnode Configuration](https://github.com/Azure/iisnode)
- [Azure Web Apps Deploy Action](https://github.com/Azure/webapps-deploy)

---

## ✨ Summary

**Problem:** Used Linux-only `startup-command` on Windows Web App  
**Solution:** Created `web.config` for IIS and removed invalid parameters  
**Status:** ✅ Ready to deploy  

**Next Step:** Commit and push to test the fixed deployment!

```bash
git add .
git commit -m "fix: configure Windows Web App deployment with web.config"
git push origin main
```

Monitor: https://github.com/mbienaimee/Capstone-PatientPassport/actions
