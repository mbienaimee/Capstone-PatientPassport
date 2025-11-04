# GitHub Secrets Validation Script
# This script helps you verify that all required secrets are configured

Write-Host "🔍 GitHub Secrets Validation Checklist" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

$githubOrg = "mbienaimee"
$githubRepo = "Capstone-PatientPassport"
$secretsUrl = "https://github.com/$githubOrg/$githubRepo/settings/secrets/actions"

Write-Host "📋 Required GitHub Secrets for OIDC Authentication:" -ForegroundColor Yellow
Write-Host ""

$requiredSecrets = @(
    @{Name="AZURE_CLIENT_ID"; Description="Application (client) ID from Azure AD App Registration"},
    @{Name="AZURE_TENANT_ID"; Description="Directory (tenant) ID from Azure AD"},
    @{Name="AZURE_SUBSCRIPTION_ID"; Description="Your Azure Subscription ID"},
    @{Name="AZURE_RESOURCE_GROUP"; Description="Resource group name (passportpatient_group-364)"}
)

$obsoleteSecrets = @("CLIENTID", "TENANTID", "SUBSCRIPTIONID", "CLIENTSECRET")

Write-Host "✅ These secrets MUST exist:" -ForegroundColor Green
foreach ($secret in $requiredSecrets) {
    Write-Host "   [$($secret.Name)]" -ForegroundColor Cyan
    Write-Host "      → $($secret.Description)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🗑️  These OLD secrets should be DELETED:" -ForegroundColor Yellow
foreach ($secret in $obsoleteSecrets) {
    Write-Host "   [$secret]" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔗 Configure secrets here:" -ForegroundColor Cyan
Write-Host "   $secretsUrl" -ForegroundColor Blue
Write-Host ""

# Try to get values from Azure (if logged in)
Write-Host "🔍 Attempting to fetch values from Azure..." -ForegroundColor Yellow

try {
    $account = az account show --output json 2>$null | ConvertFrom-Json
    
    if ($account) {
        Write-Host "   ✅ Logged in to Azure!" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "📝 Copy these values to GitHub:" -ForegroundColor Cyan
        Write-Host ""
        
        Write-Host "AZURE_TENANT_ID:" -ForegroundColor Green
        Write-Host "   $($account.tenantId)" -ForegroundColor White
        Write-Host ""
        
        Write-Host "AZURE_SUBSCRIPTION_ID:" -ForegroundColor Green
        Write-Host "   $($account.id)" -ForegroundColor White
        Write-Host ""
        
        # Try to get client ID
        $appDisplayName = "github-actions-deployer"
        $app = az ad app list --display-name $appDisplayName --output json 2>$null | ConvertFrom-Json
        
        if ($app -and $app.Count -gt 0) {
            Write-Host "AZURE_CLIENT_ID:" -ForegroundColor Green
            Write-Host "   $($app[0].appId)" -ForegroundColor White
            Write-Host ""
        } else {
            Write-Host "AZURE_CLIENT_ID:" -ForegroundColor Green
            Write-Host "   ⚠️  Could not find app '$appDisplayName'" -ForegroundColor Yellow
            Write-Host "   Get this from Azure Portal → App Registrations → Your App → Application (client) ID" -ForegroundColor Gray
            Write-Host ""
        }
        
        Write-Host "AZURE_RESOURCE_GROUP:" -ForegroundColor Green
        Write-Host "   passportpatient_group-364" -ForegroundColor White
        Write-Host ""
        
    } else {
        Write-Host "   ℹ️  Not logged in to Azure" -ForegroundColor Gray
        Write-Host "   Run 'az login' to get values automatically" -ForegroundColor Gray
        Write-Host ""
    }
} catch {
    Write-Host "   ℹ️  Azure CLI not available or not logged in" -ForegroundColor Gray
    Write-Host "   Run 'az login' and try again to get values" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "📚 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Go to: $secretsUrl" -ForegroundColor White
Write-Host "   2. Click 'New repository secret' for each required secret" -ForegroundColor White
Write-Host "   3. Delete the old secrets (CLIENTID, TENANTID, etc.)" -ForegroundColor White
Write-Host "   4. Run the workflow to test: git push origin main" -ForegroundColor White
Write-Host ""
