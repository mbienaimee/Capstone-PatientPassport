# ============================================================
# OpenMRS Patient Passport Module - Clean Reinstall Script
# ============================================================
# This script removes old module versions and installs the new one

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "OpenMRS Patient Passport Module - Clean Reinstall" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

# Step 1: Define paths
$openmrsHome = "C:\Users\user\openmrs"
$serverPath = "$openmrsHome\server"
$modulesPath = "$serverPath\modules"
$cachePath = "$serverPath\.openmrs-lib-cache\patientpassport"
$newModulePath = ".\omod\target\patientpassport-1.0.0.omod"

# Step 2: Check if OpenMRS is running
Write-Host "Step 1: Checking if OpenMRS is running..." -ForegroundColor Yellow
$tomcatProcess = Get-Process -Name "java" -ErrorAction SilentlyContinue | Where-Object {$_.Path -like "*tomcat*" -or $_.CommandLine -like "*openmrs*"}

if ($tomcatProcess) {
    Write-Host "⚠️  WARNING: OpenMRS/Tomcat appears to be running!" -ForegroundColor Red
    Write-Host "   Please stop OpenMRS before running this script." -ForegroundColor Red
    Write-Host "   Press any key to exit..." -ForegroundColor Red
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "✓ OpenMRS is not running" -ForegroundColor Green

# Step 3: Verify new module exists
Write-Host "`nStep 2: Verifying new module file..." -ForegroundColor Yellow
if (-not (Test-Path $newModulePath)) {
    Write-Host "✗ Module file not found: $newModulePath" -ForegroundColor Red
    Write-Host "  Please run: mvn clean package -DskipTests" -ForegroundColor Red
    Write-Host "  Press any key to exit..." -ForegroundColor Red
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}
Write-Host "✓ Found new module: $newModulePath" -ForegroundColor Green

# Step 4: Remove old module from modules folder
Write-Host "`nStep 3: Removing old module files..." -ForegroundColor Yellow
if (Test-Path $modulesPath) {
    $oldModules = Get-ChildItem -Path $modulesPath -Filter "patientpassport*.omod" -ErrorAction SilentlyContinue
    if ($oldModules) {
        foreach ($module in $oldModules) {
            Write-Host "  Removing: $($module.Name)" -ForegroundColor Gray
            Remove-Item $module.FullName -Force
        }
        Write-Host "✓ Removed old module files" -ForegroundColor Green
    } else {
        Write-Host "✓ No old module files found" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  Modules folder not found: $modulesPath" -ForegroundColor Yellow
    Write-Host "  Creating modules folder..." -ForegroundColor Yellow
    New-Item -Path $modulesPath -ItemType Directory -Force | Out-Null
    Write-Host "✓ Created modules folder" -ForegroundColor Green
}

# Step 5: Remove cached module files
Write-Host "`nStep 4: Removing cached module files..." -ForegroundColor Yellow
if (Test-Path $cachePath) {
    Write-Host "  Removing cache: $cachePath" -ForegroundColor Gray
    Remove-Item $cachePath -Recurse -Force
    Write-Host "✓ Removed module cache" -ForegroundColor Green
} else {
    Write-Host "✓ No cache found (already clean)" -ForegroundColor Green
}

# Step 6: Copy new module
Write-Host "`nStep 5: Installing new module..." -ForegroundColor Yellow
Copy-Item $newModulePath $modulesPath -Force
Write-Host "✓ Installed: patientpassport-1.0.0.omod" -ForegroundColor Green

# Step 7: Summary
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "✅ MODULE REINSTALLATION COMPLETE!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start OpenMRS server" -ForegroundColor White
Write-Host "2. OpenMRS will automatically detect and load the new module" -ForegroundColor White
Write-Host "3. The module will work WITHOUT automatic event-based sync" -ForegroundColor White
Write-Host "4. Observations will sync via backend's direct database polling (every 5 minutes)" -ForegroundColor White
Write-Host ""
Write-Host "Module location: $modulesPath\patientpassport-1.0.0.omod" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
