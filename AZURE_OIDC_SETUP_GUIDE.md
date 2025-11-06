# Azure OIDC Setup Guide for GitHub Actions

## Problem Fixed
✅ Removed invalid `client-secret` parameter from workflow  
✅ Configured for OIDC authentication (more secure)

## What You Need to Do in Azure Portal

### Step 1: Configure Federated Identity Credential

1. **Go to Azure Portal** (https://portal.azure.com)

2. **Navigate to Microsoft Entra ID** (formerly Azure Active Directory)
   - Click on "Microsoft Entra ID" in the left sidebar

3. **Go to App Registrations**
   - Click "App registrations" in the left menu
   - Find and click your app: `github-actions-deployer`

4. **Add Federated Credential**
   - In the left menu, click **"Certificates & secrets"**
   - Click the **"Federated credentials"** tab
   - Click **"+ Add credential"**

5. **Configure the Credential**
   - **Federated credential scenario**: Select "GitHub Actions deploying Azure resources"
   - **Organization**: `mbienaimee` (your GitHub username)
   - **Repository**: `Capstone-PatientPassport`
   - **Entity type**: Select **"Branch"**
   - **GitHub branch name**: `main`
   - **Name**: `github-actions-main-branch` (or any name you prefer)
   - Click **"Add"**

   The system will auto-populate:
   - **Issuer**: `https://token.actions.githubusercontent.com`
   - **Subject identifier**: `repo:mbienaimee/Capstone-PatientPassport:ref:refs/heads/main`
   - **Audiences**: `api://AzureADTokenExchange`

### Step 2: Verify Required Permissions

1. **Check App Permissions**
   - Still in your `github-actions-deployer` app
   - Note the **Application (client) ID**, **Directory (tenant) ID**

2. **Verify Role Assignment**
   - Go to your **Resource Group**: `passportpatient_group-364`
   - Click **"Access control (IAM)"** in the left menu
   - Click **"Role assignments"**
   - Verify that `github-actions-deployer` has at least **"Contributor"** or **"Website Contributor"** role

### Step 3: Verify GitHub Secrets

Go to your GitHub repository settings and verify these secrets exist:

| Secret Name | Value | Where to Find |
|------------|-------|---------------|
| `CLIENTID` | Application (client) ID | App Registration → Overview |
| `TENANTID` | Directory (tenant) ID | App Registration → Overview |
| `SUBSCRIPTIONID` | Your Azure Subscription ID | Subscriptions in Azure Portal |

**Important**: You can now **DELETE** the `CLIENTSECRET` secret from GitHub as it's no longer needed with OIDC!

---

## How to Add/Update GitHub Secrets

1. Go to: https://github.com/mbienaimee/Capstone-PatientPassport/settings/secrets/actions
2. Click **"New repository secret"** or click the secret name to update
3. Enter the name and value
4. Click **"Add secret"** or **"Update secret"**

---

## Alternative: Using Azure CLI

If you prefer to set up the federated credential via command line:

```bash
# Login to Azure
az login

# Set variables
APP_NAME="github-actions-deployer"
REPO_OWNER="mbienaimee"
REPO_NAME="Capstone-PatientPassport"
BRANCH="main"

# Get the application object ID
APP_OBJECT_ID=$(az ad app list --display-name "$APP_NAME" --query "[0].id" -o tsv)

# Create the federated credential
az ad app federated-credential create \
  --id $APP_OBJECT_ID \
  --parameters '{
    "name": "github-actions-main-branch",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:'$REPO_OWNER'/'$REPO_NAME':ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

---

## Verification Steps

After setting up the federated credential:

1. **Commit and push** a change to trigger the workflow
2. Go to **Actions** tab in GitHub: https://github.com/mbienaimee/Capstone-PatientPassport/actions
3. Watch the workflow run - it should now authenticate successfully!

---

## Troubleshooting

### If you still get authentication errors:

1. **Double-check the subject identifier** matches exactly:
   ```
   repo:mbienaimee/Capstone-PatientPassport:ref:refs/heads/main
   ```

2. **Verify the issuer** is:
   ```
   https://token.actions.githubusercontent.com
   ```

3. **Check the workflow has proper permissions** in the `deploy` job:
   ```yaml
   permissions:
     id-token: write  # Required for OIDC
     contents: read
   ```
   ✅ Your workflow already has this configured correctly!

4. **Ensure the app has the right role** on the Web App resource

---

## Benefits of OIDC vs Client Secret

✅ **More Secure**: No long-lived secrets stored in GitHub  
✅ **No Secret Rotation**: Tokens are short-lived (1 hour)  
✅ **Better Audit Trail**: Azure can trace exactly which workflow/branch requested access  
✅ **Recommended by Microsoft**: Industry best practice  

---

## Quick Reference: Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `AADSTS70025: No federated identity credentials` | Federated credential not configured | Complete Step 1 above |
| `Unexpected input 'client-secret'` | Using wrong parameter for OIDC | ✅ Already fixed in workflow |
| `unauthorized_client` | Wrong client ID in GitHub secret | Verify `CLIENTID` secret |
| `invalid_tenant` | Wrong tenant ID in GitHub secret | Verify `TENANTID` secret |

---

## Next Steps

1. ✅ Workflow file has been updated (no more `client-secret`)
2. ⏳ **YOU MUST**: Configure federated credential in Azure Portal (Step 1 above)
3. ⏳ **OPTIONAL**: Delete `CLIENTSECRET` from GitHub secrets
4. ⏳ Test the deployment by pushing a commit

---

**Need Help?** 
- [Official Microsoft Documentation](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure-openid-connect)
- [GitHub Actions Azure Login](https://github.com/marketplace/actions/azure-login)
