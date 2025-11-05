# Azure Deployment Fixes Applied

## Summary
Fixed multiple deployment issues for the Patient Passport backend API on Azure Windows Web App.

## Issues Fixed

### 1. OIDC Authentication Error (AADSTS70025)
**Problem:** GitHub Actions workflow failed with "The client has no configured federated identity credentials"

**Root Cause:** 
- Using `client-secret` parameter with OIDC authentication
- No federated identity credential configured in Azure AD

**Solution:**
- Removed `client-secret` parameter from workflow
- Created federated identity credential using `setup-azure-oidc.ps1` script
- Configured trust relationship: `repo:mbienaimee/Capstone-PatientPassport:ref:refs/heads/main`

**Files Modified:**
- `.github/workflows/main_patientpassport-api.yml`

### 2. Windows Deployment Configuration Error
**Problem:** Workflow failed with "startup-command is not a valid input for Windows web app"

**Root Cause:** 
- Using Linux-specific deployment parameters on Windows Web App
- Missing IIS configuration file

**Solution:**
- Removed `startup-command`, `type`, and `restart` parameters from workflow
- Created `backend/web.config` for IIS/iisnode configuration

**Files Modified:**
- `.github/workflows/main_patientpassport-api.yml`
- `backend/web.config` (created)

### 3. HTTP 500 Error - Wrong Entry Point
**Problem:** Deployed app returned HTTP 500 error

**Root Cause:** 
- `web.config` pointed to `dist/server.js` which exports the app but doesn't start the server
- Correct entry point is `dist/app.js` which calls `server.listen()`

**Solution:**
- Updated `web.config` to use `dist/app.js` as entry point in:
  - Handler mappings
  - Rewrite rules

**Files Modified:**
- `backend/web.config`

### 4. Missing Environment Variables
**Problem:** App couldn't connect to MongoDB - all environment variables were null

**Root Cause:** 
- Azure App Settings not configured
- Application expects environment variables for MongoDB, JWT, etc.

**Solution:**
Set required environment variables in Azure App Settings:
```bash
az webapp config appsettings set \
  --name patientpassport-api \
  --resource-group passportpatient_group-364 \
  --settings \
    MONGODB_URI="mongodb+srv://reine:KgzYIrHtPXg4Xfc3@cluster0.fslpg5p.mongodb.net/CapstonePassportSystem" \
    JWT_SECRET="your-super-secret-jwt-key-change-in-production" \
    NODE_ENV="production"
```

### 5. Swagger Documentation Not Loading (API Docs Empty)
**Problem:** Visiting https://patientpassport-api.azurewebsites.net/api-docs/ showed "No operations defined in spec!"

**Root Cause:** 
- `swagger.json` file was NOT being copied to the deployment package
- The build process only copied the `dist` folder, `package.json`, and `web.config`
- Application tried to load `swagger.json` from project root but it wasn't there in production

**Solution:**
Updated GitHub Actions workflow to include `swagger.json` in deployment package:
```yaml
# Copy swagger documentation (CRITICAL for API docs)
[ -f swagger.json ] && cp swagger.json deploy-package/
```

**Files Modified:**
- `.github/workflows/main_patientpassport-api.yml`

## Current Configuration

### Azure Resources
- **App Name:** patientpassport-api
- **Resource Group:** passportpatient_group-364
- **App Type:** Windows Web App
- **Node Version:** 18.x
- **URL:** https://patientpassport-api.azurewebsites.net

### Azure AD App Registration
- **Name:** github-actions-deployer
- **Client ID:** 8ef7b427-0917-481c-aee1-65eee96b29f4
- **Tenant ID:** 6af129fa-a02a-4303-bd2f-603ddd73c67d
- **Federated Credential:** Configured for GitHub Actions

### GitHub Secrets Required
Add these secrets to your GitHub repository:
1. `AZURE_CLIENT_ID`: 8ef7b427-0917-481c-aee1-65eee96b29f4
2. `AZURE_TENANT_ID`: 6af129fa-a02a-4303-bd2f-603ddd73c67d
3. `AZURE_SUBSCRIPTION_ID`: 736b4173-e1ed-46ae-be69-2241d0f855e8
4. `AZURE_RESOURCE_GROUP`: passportpatient_group-364

## Files Created/Modified

### New Files
1. `backend/web.config` - IIS configuration for Windows deployment
2. `setup-azure-oidc.ps1` - Script to configure OIDC federated credentials
3. `ADD_GITHUB_SECRETS.md` - Instructions for adding GitHub secrets
4. `WINDOWS_DEPLOYMENT_FIX.md` - Documentation of Windows-specific fixes

### Modified Files
1. `.github/workflows/main_patientpassport-api.yml` - Fixed OIDC, Windows compatibility, and swagger.json inclusion
2. `backend/web.config` - Corrected entry point from dist/server.js to dist/app.js

## Verification Steps

1. **Check GitHub Actions:**
   - Go to https://github.com/mbienaimee/Capstone-PatientPassport/actions
   - Verify the latest workflow run completes successfully

2. **Test API Endpoint:**
   - Visit https://patientpassport-api.azurewebsites.net
   - Should return API response (not HTTP 500)

3. **Check Application Logs:**
   ```bash
   az webapp log tail --name patientpassport-api --resource-group passportpatient_group-364
   ```

4. **Verify Environment Variables:**
   ```bash
   az webapp config appsettings list --name patientpassport-api --resource-group passportpatient_group-364
   ```

## Next Steps

1. **Add GitHub Secrets:**
   - Follow instructions in `ADD_GITHUB_SECRETS.md`
   - Add all 4 required secrets

2. **Monitor Deployment:**
   - Watch GitHub Actions workflow
   - Check Azure portal for deployment status

3. **Security Improvements:**
   - Change JWT_SECRET to a strong random value
   - Consider using Azure Key Vault for secrets
   - Review MongoDB user permissions

4. **Optional Enhancements:**
   - Set up Application Insights for monitoring
   - Configure custom domain
   - Enable HTTPS only
   - Set up staging slots for zero-downtime deployments

## Troubleshooting

### If app still returns 500:
1. Check application logs: `az webapp log tail --name patientpassport-api --resource-group passportpatient_group-364`
2. Verify MongoDB connection string is correct
3. Check that all required environment variables are set
4. Verify Node.js version matches (18.x)

### If deployment fails:
1. Check GitHub Actions logs
2. Verify GitHub secrets are correctly set
3. Ensure Azure AD app has correct permissions
4. Verify federated credential configuration

## References
- [Azure Web Apps for Windows](https://docs.microsoft.com/en-us/azure/app-service/overview)
- [GitHub Actions with OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-azure)
- [IIS node Integration](https://github.com/azure/iisnode)
