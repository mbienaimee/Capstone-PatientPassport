# 🚀 Quick Fix Guide - GitHub Actions Azure Deployment

## ⚡ TL;DR - 3 Steps to Fix

### Step 1: Run the Setup Script
```powershell
cd "C:\Users\user\OneDrive\Desktop\capp\Capstone-PatientPassport"
.\setup-azure-oidc.ps1
```

### Step 2: Update GitHub Secrets
The script will show you the values. Go to:
https://github.com/mbienaimee/Capstone-PatientPassport/settings/secrets/actions

**Add/Update these secrets:**
- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_RESOURCE_GROUP`

**Delete these old secrets:**
- ~~`CLIENTID`~~
- ~~`TENANTID`~~
- ~~`SUBSCRIPTIONID`~~
- ~~`CLIENTSECRET`~~

### Step 3: Test
```bash
git add .
git commit -m "fix: configure OIDC authentication"
git push origin main
```

Watch it work: https://github.com/mbienaimee/Capstone-PatientPassport/actions

---

## 🔧 What Was Fixed

### Changes to `.github/workflows/main_patientpassport-api.yml`

#### ❌ Before (Broken)
```yaml
- name: Login to Azure
  uses: azure/login@v2
  with:
    client-id: ${{ secrets.CLIENTID }}           # Wrong name
    tenant-id: ${{ secrets.TENANTID }}           # Wrong name
    subscription-id: ${{ secrets.SUBSCRIPTIONID }} # Wrong name
    client-secret: ${{ secrets.CLIENTSECRET }}   # Not supported with OIDC!
```

#### ✅ After (Fixed)
```yaml
- name: Login to Azure
  uses: azure/login@v2
  with:
    client-id: ${{ secrets.AZURE_CLIENT_ID }}
    tenant-id: ${{ secrets.AZURE_TENANT_ID }}
    subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
    # No client-secret needed with OIDC! 🎉
```

### Why This Fixes It

1. **Removed `client-secret`** - Not valid when using OIDC authentication
2. **Standardized secret names** - Using Azure's recommended naming convention
3. **OIDC authentication** - More secure, no long-lived secrets
4. **Federated credentials** - Setup script creates the trust relationship

---

## 🛠️ Scripts Provided

### `setup-azure-oidc.ps1`
**Main setup script** - Automatically configures everything in Azure
- Creates federated identity credential
- Verifies service principal
- Assigns roles to Web App
- Shows GitHub secret values

### `validate-github-secrets.ps1`
**Validation helper** - Checks what secrets you need
- Lists required secrets
- Shows current Azure values
- Provides checklist

---

## 📋 Detailed Setup Instructions

### Option A: Automated (Recommended)

1. **Open PowerShell** in the project directory

2. **Run the setup script**:
   ```powershell
   .\setup-azure-oidc.ps1
   ```

3. **Follow the prompts**:
   - Login to Azure when prompted
   - Script will configure everything
   - Copy the secret values shown at the end

4. **Update GitHub secrets**:
   - Go to repository settings → Secrets and variables → Actions
   - Add/update the 4 required secrets
   - Delete the 4 old secrets

5. **Test the deployment**:
   ```bash
   git push origin main
   ```

### Option B: Manual Setup

If the script doesn't work, follow these manual steps:

#### 1. Login to Azure Portal
https://portal.azure.com

#### 2. Find Your App Registration
- Go to **Microsoft Entra ID**
- Click **App registrations**
- Find **"github-actions-deployer"**
- Note the **Application (client) ID** and **Directory (tenant) ID**

#### 3. Add Federated Credential
- In your app, go to **Certificates & secrets**
- Click **Federated credentials** tab
- Click **+ Add credential**
- Select **GitHub Actions deploying Azure resources**
- Fill in:
  - **Organization**: `mbienaimee`
  - **Repository**: `Capstone-PatientPassport`
  - **Entity type**: Branch
  - **Branch name**: `main`
  - **Name**: `github-actions-main`
- Click **Add**

#### 4. Assign Role to Web App
- Go to **Resource Groups** → `passportpatient_group-364`
- Click **Access control (IAM)**
- Click **+ Add** → **Add role assignment**
- Select **Website Contributor** role
- Click **Next**
- Click **+ Select members**
- Search for `github-actions-deployer`
- Click **Select** → **Review + assign**

#### 5. Update GitHub Secrets
Go to: https://github.com/mbienaimee/Capstone-PatientPassport/settings/secrets/actions

**Add these 4 secrets:**

| Secret Name | Where to Find Value |
|------------|---------------------|
| `AZURE_CLIENT_ID` | App Registration → Overview → Application (client) ID |
| `AZURE_TENANT_ID` | App Registration → Overview → Directory (tenant) ID |
| `AZURE_SUBSCRIPTION_ID` | Subscriptions → Your subscription → Subscription ID |
| `AZURE_RESOURCE_GROUP` | Just enter: `passportpatient_group-364` |

**Delete these 4 old secrets:**
- `CLIENTID`
- `TENANTID`
- `SUBSCRIPTIONID`
- `CLIENTSECRET`

---

## ✅ Verification Checklist

Before pushing to GitHub, verify:

- [ ] Federated credential created in Azure (issuer: `https://token.actions.githubusercontent.com`)
- [ ] Subject matches: `repo:mbienaimee/Capstone-PatientPassport:ref:refs/heads/main`
- [ ] Service principal has role on Web App resource
- [ ] GitHub has 4 new secrets (AZURE_*)
- [ ] GitHub old secrets deleted (CLIENTID, etc.)
- [ ] Workflow file has been updated (no `client-secret`)

---

## 🧪 Testing

### Test the Workflow

1. Make a small change:
   ```bash
   git add .
   git commit -m "test: verify OIDC deployment"
   git push origin main
   ```

2. Monitor the workflow:
   - Go to: https://github.com/mbienaimee/Capstone-PatientPassport/actions
   - Click the latest workflow run
   - Watch the "Login to Azure" step - should now succeed ✅

### Expected Output

✅ **Login to Azure** step should show:
```
Running Azure CLI Login.
Done setting cloud: "azurecloud"
Federated token details:
  issuer - https://token.actions.githubusercontent.com
  subject claim - repo:mbienaimee/Capstone-PatientPassport:ref:refs/heads/main
Successfully logged in to Azure
```

---

## 🐛 Troubleshooting

### Error: "AADSTS70021: No matching federated identity"

**Cause**: Subject doesn't match  
**Fix**: Verify subject in Azure is exactly: `repo:mbienaimee/Capstone-PatientPassport:ref:refs/heads/main`

### Error: "AADSTS700016: Application not found"

**Cause**: Wrong client ID in GitHub secret  
**Fix**: Double-check `AZURE_CLIENT_ID` value in GitHub matches Azure

### Error: "Unauthorized to perform action"

**Cause**: Service principal doesn't have permission on Web App  
**Fix**: Re-run setup script or manually assign "Website Contributor" role

### Warning: "Unexpected input 'client-secret'"

**Cause**: Old workflow file  
**Fix**: ✅ Already fixed! Workflow updated to remove `client-secret`

---

## 📚 Additional Resources

- [Microsoft Docs: OIDC with GitHub Actions](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure-openid-connect)
- [Azure Login Action Documentation](https://github.com/marketplace/actions/azure-login)
- [GitHub Actions Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

---

## 💡 Why OIDC is Better

| Feature | Old (Client Secret) | New (OIDC) |
|---------|-------------------|-----------|
| **Security** | Long-lived secret (2 years) | Short-lived token (1 hour) |
| **Rotation** | Manual renewal required | Automatic |
| **Audit Trail** | Basic | Full (repo/branch/workflow) |
| **Compromise Risk** | High if leaked | Low (scoped) |
| **Setup Complexity** | Simple | Medium (one-time) |
| **Microsoft Recommendation** | ❌ Deprecated | ✅ Best Practice |

---

## 🎯 Summary

**What Changed**:
- ✅ Workflow file updated to use OIDC
- ✅ Secret names standardized (AZURE_* prefix)
- ✅ Removed unsupported `client-secret` parameter
- ✅ Setup scripts created for easy configuration

**What You Need to Do**:
1. Run `setup-azure-oidc.ps1`
2. Update GitHub secrets
3. Push to test

**Expected Result**:
- ✅ Secure OIDC authentication
- ✅ Successful Azure deployment
- ✅ No more credential errors

---

**Ready to proceed?** Run the setup script now! 🚀
