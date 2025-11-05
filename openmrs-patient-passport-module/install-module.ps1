# OpenMRS Patient Passport Module - Installation & Restart Guide

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OpenMRS Patient Passport Module Installer" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$modulePath = "openmrs-patient-passport-module\omod\target\patientpassport-1.0.0.omod"

# Check if module exists
if (-Not (Test-Path $modulePath)) {
    Write-Host "❌ ERROR: Module file not found at: $modulePath" -ForegroundColor Red
    Write-Host "`nPlease build the module first:" -ForegroundColor Yellow
    Write-Host "   cd openmrs-patient-passport-module" -ForegroundColor Yellow
    Write-Host "   mvn clean package -DskipTests" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Module file found: $modulePath`n" -ForegroundColor Green

# Possible OpenMRS locations
$possiblePaths = @(
    "$env:USERPROFILE\Application Data\OpenMRS",
    "$env:USERPROFILE\OpenMRS",
    "$env:APPDATA\OpenMRS",
    "C:\OpenMRS",
    "C:\Program Files\OpenMRS"
)

Write-Host "🔍 Searching for OpenMRS installation...`n" -ForegroundColor Yellow

$openmrsPath = $null
foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $modulesDir = Join-Path $path "modules"
        if (Test-Path $modulesDir) {
            $openmrsPath = $path
            Write-Host "✅ Found OpenMRS at: $openmrsPath" -ForegroundColor Green
            break
        }
    }
}

if (-Not $openmrsPath) {
    Write-Host "❌ Could not find OpenMRS installation automatically.`n" -ForegroundColor Red
    Write-Host "📍 Manual Installation Instructions:" -ForegroundColor Yellow
    Write-Host "-----------------------------------`n" -ForegroundColor Yellow
    Write-Host "1. Log into OpenMRS as administrator" -ForegroundColor White
    Write-Host "2. Go to: Administration → Manage Modules" -ForegroundColor White
    Write-Host "3. Click: Add or Upgrade Module" -ForegroundColor White
    Write-Host "4. Select file: $modulePath" -ForegroundColor Cyan
    Write-Host "5. Upload and wait for confirmation" -ForegroundColor White
    Write-Host "6. RESTART OpenMRS server (CRITICAL!)" -ForegroundColor Red
    Write-Host "`n7. Verify module is 'Started' in Manage Modules" -ForegroundColor White
    Write-Host "`n📝 Module file location:" -ForegroundColor Yellow
    Write-Host "   $(Resolve-Path $modulePath)" -ForegroundColor Cyan
    exit 0
}

# Ask user if they want to copy module
Write-Host "`n📦 Installation Options:" -ForegroundColor Yellow
Write-Host "1. Automatic (Copy module file and restart required)" -ForegroundColor White
Write-Host "2. Manual (Show instructions only)" -ForegroundColor White
$choice = Read-Host "`nChoose option (1 or 2)"

if ($choice -eq "1") {
    $modulesDir = Join-Path $openmrsPath "modules"
    $destPath = Join-Path $modulesDir "patientpassport-1.0.0.omod"
    
    try {
        Write-Host "`n📂 Copying module to: $destPath" -ForegroundColor Yellow
        Copy-Item $modulePath -Destination $destPath -Force
        Write-Host "✅ Module copied successfully!`n" -ForegroundColor Green
        
        Write-Host "⚠️  IMPORTANT: You MUST restart OpenMRS for changes to take effect!" -ForegroundColor Red
        Write-Host "`n🔄 Restart Instructions:" -ForegroundColor Yellow
        Write-Host "----------------------------" -ForegroundColor Yellow
        
        # Try to find Tomcat
        $tomcatPaths = @(
            "C:\Program Files\Apache Software Foundation\Tomcat 9.0",
            "C:\Program Files\Apache Software Foundation\Tomcat 8.5",
            "C:\Tomcat",
            "C:\apache-tomcat-9.0",
            "C:\apache-tomcat-8.5"
        )
        
        $tomcatPath = $null
        foreach ($path in $tomcatPaths) {
            if (Test-Path $path) {
                $tomcatPath = $path
                break
            }
        }
        
        if ($tomcatPath) {
            Write-Host "`n✅ Found Tomcat at: $tomcatPath" -ForegroundColor Green
            Write-Host "`nRun these commands to restart:" -ForegroundColor White
            Write-Host "   cd `"$tomcatPath\bin`"" -ForegroundColor Cyan
            Write-Host "   .\shutdown.bat" -ForegroundColor Cyan
            Write-Host "   Start-Sleep -Seconds 10" -ForegroundColor Cyan
            Write-Host "   .\startup.bat" -ForegroundColor Cyan
            
            $restart = Read-Host "`nDo you want to restart Tomcat now? (y/n)"
            if ($restart -eq "y") {
                Write-Host "`n🛑 Stopping Tomcat..." -ForegroundColor Yellow
                & "$tomcatPath\bin\shutdown.bat"
                Start-Sleep -Seconds 10
                Write-Host "🚀 Starting Tomcat..." -ForegroundColor Yellow
                & "$tomcatPath\bin\startup.bat"
                Write-Host "`n✅ Tomcat restarted! Wait 2-3 minutes for OpenMRS to fully start." -ForegroundColor Green
            }
        } else {
            Write-Host "`n⚠️  Could not find Tomcat automatically." -ForegroundColor Yellow
            Write-Host "Please restart your OpenMRS server manually." -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "`n❌ ERROR: Failed to copy module: $_" -ForegroundColor Red
        Write-Host "`nTry manual installation instead." -ForegroundColor Yellow
    }
} else {
    Write-Host "`n📍 Manual Installation Instructions:" -ForegroundColor Yellow
    Write-Host "-----------------------------------`n" -ForegroundColor Yellow
    Write-Host "1. Log into OpenMRS as administrator" -ForegroundColor White
    Write-Host "2. Go to: Administration → Manage Modules" -ForegroundColor White
    Write-Host "3. Click: Add or Upgrade Module" -ForegroundColor White
    Write-Host "4. Select file: $(Resolve-Path $modulePath)" -ForegroundColor Cyan
    Write-Host "5. Upload and wait for confirmation" -ForegroundColor White
    Write-Host "6. RESTART OpenMRS server (CRITICAL!)" -ForegroundColor Red
    Write-Host "`n7. Verify module is 'Started' in Manage Modules" -ForegroundColor White
}

Write-Host "`n📋 After Installation:" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Yellow
Write-Host "1. Log into OpenMRS" -ForegroundColor White
Write-Host "2. Go to: Administration → Manage Modules" -ForegroundColor White
Write-Host "3. Find 'Patient Passport Module'" -ForegroundColor White
Write-Host "4. Verify status is 'Started' (green)" -ForegroundColor White
Write-Host "5. Create a test observation" -ForegroundColor White
Write-Host "6. Check logs for: '📤 Sending diagnosis to Patient Passport'" -ForegroundColor White
Write-Host "7. Verify observation appears in Patient Passport" -ForegroundColor White

Write-Host "`n🔍 To monitor logs in real-time:" -ForegroundColor Yellow
Write-Host "   Get-Content `"$openmrsPath\openmrs.log`" -Wait -Tail 50" -ForegroundColor Cyan

Write-Host "`n✅ Installation script complete!" -ForegroundColor Green
Write-Host "See DEEP_ANALYSIS_AND_FIX.md for detailed troubleshooting." -ForegroundColor Cyan
