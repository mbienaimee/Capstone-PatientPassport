# Azure OIDC Federated Credential Setup Script
# This script configures federated identity credential for GitHub Actions

Write-Host "Azure OIDC Setup for GitHub Actions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Variables - UPDATE THESE IF NEEDED
$appDisplayName = "github-actions-deployer"
$githubOrg = "mbienaimee"
$githubRepo = "Capstone-PatientPassport"
$githubBranch = "main"
$credentialName = "github-actions-main-branch"
$webAppName = "patientpassport-api"
$resourceGroup = "passportpatient_group-364"

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "   App Name: $appDisplayName" -ForegroundColor White
Write-Host "   GitHub: $githubOrg/$githubRepo" -ForegroundColor White
Write-Host "   Branch: $githubBranch" -ForegroundColor White
Write-Host ""

# Check if Azure CLI is installed
Write-Host "Checking Azure CLI installation..." -ForegroundColor Yellow
try {
    $azVersion = az version --output json | ConvertFrom-Json
    Write-Host "   Azure CLI version: $($azVersion.'azure-cli')" -ForegroundColor Green
} catch {
    Write-Host "   Azure CLI is not installed!" -ForegroundColor Red
    Write-Host "   Please install it from: https://aka.ms/installazurecli" -ForegroundColor Red
    exit 1
}

# Login to Azure
Write-Host ""
Write-Host "Logging in to Azure..." -ForegroundColor Yellow
Write-Host "   (A browser window will open for authentication)" -ForegroundColor Gray
try {
    az login --output none
    Write-Host "   Successfully logged in!" -ForegroundColor Green
} catch {
    Write-Host "   Login failed: $_" -ForegroundColor Red
    exit 1
}

# Get the app object ID
Write-Host ""
Write-Host "Finding Azure AD application..." -ForegroundColor Yellow
try {
    $appObjectId = az ad app list --display-name $appDisplayName --query "[0].id" -o tsv
    
    if ([string]::IsNullOrWhiteSpace($appObjectId)) {
        Write-Host "   Application '$appDisplayName' not found!" -ForegroundColor Red
        Write-Host "   Please create the app first or check the app name." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "   Found app with Object ID: $appObjectId" -ForegroundColor Green
    
    # Get client ID for reference
    $clientId = az ad app list --display-name $appDisplayName --query "[0].appId" -o tsv
    Write-Host "   Client ID (for GitHub secret): $clientId" -ForegroundColor Cyan
} catch {
    Write-Host "   Error finding app: $_" -ForegroundColor Red
    exit 1
}

# Check if federated credential already exists
Write-Host ""
Write-Host "Checking for existing federated credentials..." -ForegroundColor Yellow
try {
    $existingCreds = az ad app federated-credential list --id $appObjectId --query "[?name=='$credentialName']" -o json | ConvertFrom-Json
    
    if ($existingCreds.Count -gt 0) {
        Write-Host "   Federated credential '$credentialName' already exists!" -ForegroundColor Yellow
        Write-Host "   Do you want to delete and recreate it? (y/n): " -ForegroundColor Yellow -NoNewline
        $response = Read-Host
        
        if ($response -eq 'y' -or $response -eq 'Y') {
            $credId = $existingCreds[0].id
            az ad app federated-credential delete --id $appObjectId --federated-credential-id $credId
            Write-Host "   Deleted existing credential" -ForegroundColor Green
        } else {
            Write-Host "   Keeping existing credential. Exiting..." -ForegroundColor Cyan
            exit 0
        }
    }
} catch {
    Write-Host "   Error checking existing credentials: $_" -ForegroundColor Yellow
}

# Create the federated credential
Write-Host ""
Write-Host "Creating federated identity credential..." -ForegroundColor Yellow

$subject = "repo:$githubOrg/${githubRepo}:ref:refs/heads/$githubBranch"
Write-Host "   Subject: $subject" -ForegroundColor Gray

# Create credential JSON
$credentialJson = @{
    name = $credentialName
    issuer = "https://token.actions.githubusercontent.com"
    subject = $subject
    description = "GitHub Actions OIDC for $githubBranch branch"
    audiences = @("api://AzureADTokenExchange")
} | ConvertTo-Json

# Save to temp file
$tempFile = [System.IO.Path]::GetTempFileName()
$credentialJson | Out-File -FilePath $tempFile -Encoding utf8

try {
    az ad app federated-credential create --id $appObjectId --parameters $tempFile
    Write-Host "   Successfully created federated credential!" -ForegroundColor Green
} catch {
    Write-Host "   Error creating credential: $_" -ForegroundColor Red
    Remove-Item $tempFile -ErrorAction SilentlyContinue
    exit 1
} finally {
    Remove-Item $tempFile -ErrorAction SilentlyContinue
}

# Get tenant ID and subscription ID for GitHub secrets
Write-Host ""
Write-Host "GitHub Secrets Configuration" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

$tenantId = az account show --query tenantId -o tsv
$subscriptionId = az account show --query id -o tsv

Write-Host ""
Write-Host "Add these secrets to your GitHub repository:" -ForegroundColor Yellow
Write-Host "https://github.com/$githubOrg/$githubRepo/settings/secrets/actions" -ForegroundColor Blue
Write-Host ""

Write-Host "Secret Name: AZURE_CLIENT_ID" -ForegroundColor Green
Write-Host "Value: $clientId" -ForegroundColor White
Write-Host ""

Write-Host "Secret Name: AZURE_TENANT_ID" -ForegroundColor Green
Write-Host "Value: $tenantId" -ForegroundColor White
Write-Host ""

Write-Host "Secret Name: AZURE_SUBSCRIPTION_ID" -ForegroundColor Green
Write-Host "Value: $subscriptionId" -ForegroundColor White
Write-Host ""

Write-Host "Secret Name: AZURE_RESOURCE_GROUP" -ForegroundColor Green
Write-Host "Value: $resourceGroup" -ForegroundColor White
Write-Host ""

Write-Host "You can now DELETE these old secrets (no longer needed with OIDC):" -ForegroundColor Yellow
Write-Host "   - CLIENTID (replaced by AZURE_CLIENT_ID)" -ForegroundColor Gray
Write-Host "   - TENANTID (replaced by AZURE_TENANT_ID)" -ForegroundColor Gray
Write-Host "   - SUBSCRIPTIONID (replaced by AZURE_SUBSCRIPTION_ID)" -ForegroundColor Gray
Write-Host "   - CLIENTSECRET (not needed with OIDC)" -ForegroundColor Gray
Write-Host "   - AZUREAPPSERVICE_CLIENTID_* (auto-generated, not needed)" -ForegroundColor Gray
Write-Host "   - AZUREAPPSERVICE_TENANTID_* (auto-generated, not needed)" -ForegroundColor Gray
Write-Host "   - AZUREAPPSERVICE_SUBSCRIPTIONID_* (auto-generated, not needed)" -ForegroundColor Gray
Write-Host ""

# List all federated credentials for verification
Write-Host ""
Write-Host "All Federated Credentials for this app:" -ForegroundColor Cyan
az ad app federated-credential list --id $appObjectId --query "[].{Name:name, Subject:subject, Issuer:issuer}" -o table

Write-Host ""
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Add the secrets to GitHub (values shown above)" -ForegroundColor White
Write-Host "2. Delete old/auto-generated secrets from GitHub" -ForegroundColor White
Write-Host "3. Push a commit to trigger the workflow" -ForegroundColor White
Write-Host "4. Monitor the workflow at: https://github.com/$githubOrg/$githubRepo/actions" -ForegroundColor White
Write-Host ""
