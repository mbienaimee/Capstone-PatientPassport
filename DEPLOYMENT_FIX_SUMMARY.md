# 🔧 GitHub Actions Azure Deployment - FIXED

## ✅ What Was Fixed

### The Problem
Your GitHub Actions workflow was failing with:
```
Error: AADSTS70025: The client 'github-actions-deployer' has no configured 
federated identity credentials.
```

And warning:
```
Warning: Unexpected input(s) 'client-secret', valid inputs are ['creds', 
'client-id', 'tenant-id', 'subscription-id', ...]
```

### Root Cause
1. ❌ Using `client-secret` parameter with OIDC authentication (not supported)
2. ❌ No federated identity credential configured in Azure AD

### The Solution
1. ✅ **Removed** `client-secret` from workflow (incompatible with OIDC)
2. ✅ **Created** setup guide for configuring federated credentials
3. ✅ **Created** PowerShell automation script

---

## 🚀 Quick Start - Choose Your Method

### Method 1: Automated Setup (Recommended)
Run the PowerShell script to automatically configure everything:

```powershell
cd "C:\Users\user\OneDrive\Desktop\capp\Capstone-PatientPassport"
.\setup-azure-oidc.ps1
```

The script will:
- ✅ Login to Azure
- ✅ Find your app registration
- ✅ Create the federated credential
- ✅ Display GitHub secrets to configure

### Method 2: Manual Setup
Follow the detailed guide: `AZURE_OIDC_SETUP_GUIDE.md`

---

## 📋 Required GitHub Secrets

After running the script or manual setup, ensure these secrets exist in GitHub:

| Secret Name | Description |
|------------|-------------|
| `CLIENTID` | Application (client) ID from Azure |
| `TENANTID` | Directory (tenant) ID from Azure |
| `SUBSCRIPTIONID` | Your Azure subscription ID |

**🗑️ DELETE THIS**: `CLIENTSECRET` (no longer needed with OIDC!)

---

## 🎯 What's Different Now?

### Before (Insecure - Client Secret)
```yaml
- name: Login to Azure
  uses: azure/login@v2
  with:
    client-id: ${{ secrets.CLIENTID }}
    tenant-id: ${{ secrets.TENANTID }}
    subscription-id: ${{ secrets.SUBSCRIPTIONID }}
    client-secret: ${{ secrets.CLIENTSECRET }}  # ❌ Not valid for OIDC
```

### After (Secure - OIDC)
```yaml
- name: Login to Azure
  uses: azure/login@v2
  with:
    client-id: ${{ secrets.CLIENTID }}
    tenant-id: ${{ secrets.TENANTID }}
    subscription-id: ${{ secrets.SUBSCRIPTIONID }}
    # No client-secret needed! ✅
```

---

## 🔐 Why OIDC is Better

| Feature | Client Secret | OIDC |
|---------|--------------|------|
| **Security** | Long-lived secret | Short-lived token (1 hour) |
| **Rotation** | Manual, periodic | Automatic |
| **Audit Trail** | Limited | Full (branch/workflow) |
| **Compromise Risk** | High (if leaked) | Low (scoped to repo) |
| **Microsoft Recommendation** | ❌ Deprecated | ✅ Best Practice |

---

## 📝 Files Modified/Created

### Modified
- ✅ `.github/workflows/main_patientpassport-api.yml` - Removed `client-secret` parameter

### Created
- ✅ `AZURE_OIDC_SETUP_GUIDE.md` - Complete manual setup instructions
- ✅ `setup-azure-oidc.ps1` - Automated setup script
- ✅ `DEPLOYMENT_FIX_SUMMARY.md` - This file

---

## 🧪 Testing the Fix

1. **Complete the Azure setup** (run script or follow manual guide)

2. **Update GitHub secrets** (if needed)

3. **Trigger the workflow**:
   ```bash
   git add .
   git commit -m "test: verify OIDC authentication"
   git push origin main
   ```

4. **Monitor the deployment**:
   - Go to: https://github.com/mbienaimee/Capstone-PatientPassport/actions
   - Watch the "Build and deploy Node.js app to Azure Web App" workflow
   - The "Login to Azure" step should now succeed ✅

---

## 🐛 Troubleshooting

### Still getting authentication errors?

1. **Verify the subject identifier** in Azure:
   ```
   repo:mbienaimee/Capstone-PatientPassport:ref:refs/heads/main
   ```

2. **Check GitHub secrets** match Azure values:
   - CLIENTID = Application (client) ID
   - TENANTID = Directory (tenant) ID
   - SUBSCRIPTIONID = Subscription ID

3. **Confirm permissions** in workflow (already correct):
   ```yaml
   permissions:
     id-token: write  # Required for OIDC
     contents: read
   ```

4. **Verify app has correct role** on Web App resource:
   - Go to Web App → Access control (IAM)
   - Check `github-actions-deployer` has "Contributor" or "Website Contributor"

---

## 📚 Additional Resources

- [Microsoft Docs: OIDC with GitHub Actions](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure-openid-connect)
- [Azure Login Action](https://github.com/marketplace/actions/azure-login)
- [GitHub Actions Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

---

## ✨ Summary

**Fixed**: Removed incompatible `client-secret` parameter  
**Action Required**: Configure federated credential in Azure (use script!)  
**Result**: Secure, token-based authentication with no stored secrets  

**Status**: ⏳ Waiting for Azure configuration to complete  
**Next Step**: Run `.\setup-azure-oidc.ps1` or follow manual guide  
