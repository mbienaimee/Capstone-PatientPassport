<#
Interactive PowerShell helper to create an Azure App Service and deploy the backend via ZIP.

Run from PowerShell with Az CLI installed.
This script places placeholder app settings - replace with real secrets where indicated.
#>

param(
    [string]$ResourceGroup = 'patientpassport-rg',
    [string]$Location = 'eastus',
    [string]$Plan = 'patientpassport-plan',
    [string]$AppName = 'patientpassport-api',
    [string]$Sku = 'B1'
)

Write-Host "This script will create resources and deploy the backend to Azure App Service"
Write-Host "Resource Group: $ResourceGroup"
Write-Host "Location: $Location"
Write-Host "App Service Plan: $Plan"
Write-Host "App Name: $AppName"

Read-Host -Prompt "Press Enter to continue or Ctrl+C to abort"

# Ensure logged in
az account show > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in. Opening browser to log in..."
    az login
}

Write-Host "Creating resource group..."
az group create --name $ResourceGroup --location $Location

Write-Host "Creating App Service plan (Linux)..."
az appservice plan create --name $Plan --resource-group $ResourceGroup --sku $Sku --is-linux

Write-Host "Creating Web App (Node 18)..."
az webapp create --resource-group $ResourceGroup --plan $Plan --name $AppName --runtime "NODE|18-lts"

Write-Host "Enabling Web Sockets and Always On..."
az webapp config set --resource-group $ResourceGroup --name $AppName --web-sockets-enabled true
az webapp config set --resource-group $ResourceGroup --name $AppName --always-on true

Write-Host "Setting placeholder app settings (update secrets in Azure Portal after this finishes)"
az webapp config appsettings set --resource-group $ResourceGroup --name $AppName --settings \
  NODE_ENV=production \
  EMAIL_HOST=smtp.gmail.com \
  EMAIL_PORT=587 \
  EMAIL_USER=you@example.com \
  EMAIL_PASS='<PLACEHOLDER_REPLACE_ME>' \
  EMAIL_FROM='PatientPassport <noreply@example.com>'

# Build and zip the backend
Push-Location -Path (Join-Path $PSScriptRoot '.')
if (Test-Path './backend') { Push-Location -Path './backend' } else { Write-Host 'Run this script from the repo root where the backend folder exists.'; exit 1 }

Write-Host "Installing dependencies and building the backend (this may take a few minutes)..."
npm ci
npm run build

Pop-Location

$zipPath = Join-Path $PSScriptRoot '..\backend.zip'
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

Write-Host "Creating backend.zip..."
Compress-Archive -Path (Join-Path $PSScriptRoot 'backend\*') -DestinationPath $zipPath -Force

Write-Host "Deploying zip to App Service..."
az webapp deployment source config-zip --resource-group $ResourceGroup --name $AppName --src $zipPath

Write-Host "Restarting app..."
az webapp restart --resource-group $ResourceGroup --name $AppName

Write-Host "Deployment finished. You should update the EMAIL_PASS and any secrets in the Azure Portal, then test the app's /health and /api/auth/test-email endpoints."
