# OpenMRS Manual Setup Script
# Run this in PowerShell as Administrator

Write-Host "Setting up OpenMRS locally..." -ForegroundColor Green

# Create directory
$openmrsDir = "C:\openmrs"
if (!(Test-Path $openmrsDir)) {
    New-Item -ItemType Directory -Path $openmrsDir
}

# Download OpenMRS Standalone
$downloadUrl = "https://sourceforge.net/projects/openmrs/files/releases/OpenMRS_2.5.0/openmrs-standalone-2.5.0.zip"
$zipFile = "$openmrsDir\openmrs-standalone-2.5.0.zip"

Write-Host "Downloading OpenMRS Standalone..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipFile -UseBasicParsing
    Write-Host "Download completed!" -ForegroundColor Green
} catch {
    Write-Host "Download failed. Please download manually from: https://openmrs.org/download/" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Extract the file
Write-Host "Extracting OpenMRS..." -ForegroundColor Yellow
try {
    Expand-Archive -Path $zipFile -DestinationPath $openmrsDir -Force
    Write-Host "Extraction completed!" -ForegroundColor Green
} catch {
    Write-Host "Extraction failed. Please extract manually." -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Find the extracted folder
$extractedFolder = Get-ChildItem -Path $openmrsDir -Directory | Where-Object { $_.Name -like "openmrs-standalone*" } | Select-Object -First 1

if ($extractedFolder) {
    Write-Host "OpenMRS extracted to: $($extractedFolder.FullName)" -ForegroundColor Green
    
    # Create a batch file to start OpenMRS
    $startScript = @"
@echo off
echo Starting OpenMRS...
cd /d "$($extractedFolder.FullName)"
java -jar openmrs-standalone.jar
pause
"@
    
    $startScript | Out-File -FilePath "$openmrsDir\start-openmrs.bat" -Encoding ASCII
    
    Write-Host "Setup completed!" -ForegroundColor Green
    Write-Host "To start OpenMRS, run: $openmrsDir\start-openmrs.bat" -ForegroundColor Cyan
    Write-Host "Or navigate to: $($extractedFolder.FullName) and run: java -jar openmrs-standalone.jar" -ForegroundColor Cyan
    Write-Host "OpenMRS will be available at: http://localhost:8081/openmrs-standalone/" -ForegroundColor Cyan
    Write-Host "Default login: admin / Admin123" -ForegroundColor Cyan
} else {
    Write-Host "Could not find extracted OpenMRS folder." -ForegroundColor Red
}

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
