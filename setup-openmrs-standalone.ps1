# OpenMRS Standalone Setup Script
# This script downloads and sets up OpenMRS Standalone for reliable operation

Write-Host "Setting up OpenMRS Standalone..." -ForegroundColor Green

# Create directory
$openmrsDir = "openmrs-standalone"
if (!(Test-Path $openmrsDir)) {
    New-Item -ItemType Directory -Path $openmrsDir
}

# Download OpenMRS Standalone
$downloadUrl = "https://sourceforge.net/projects/openmrs/files/releases/OpenMRS_2_5_0/openmrs-standalone-2.5.0.zip/download"
$zipFile = "$openmrsDir\openmrs-standalone-2.5.0.zip"

Write-Host "Downloading OpenMRS Standalone..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipFile -UseBasicParsing
    Write-Host "Download completed!" -ForegroundColor Green
} catch {
    Write-Host "Download failed. Trying alternative approach..." -ForegroundColor Red
    
    # Alternative download URL
    $altUrl = "https://github.com/openmrs/openmrs-distro-platform/releases/download/2.5.0/openmrs-standalone-2.5.0.zip"
    try {
        Invoke-WebRequest -Uri $altUrl -OutFile $zipFile -UseBasicParsing
        Write-Host "Alternative download completed!" -ForegroundColor Green
    } catch {
        Write-Host "Both downloads failed. Please download manually from: https://openmrs.org/download/" -ForegroundColor Red
        Write-Host "Save the file as: $zipFile" -ForegroundColor Yellow
        exit 1
    }
}

# Extract the zip file
Write-Host "Extracting OpenMRS..." -ForegroundColor Yellow
try {
    Expand-Archive -Path $zipFile -DestinationPath $openmrsDir -Force
    Write-Host "Extraction completed!" -ForegroundColor Green
} catch {
    Write-Host "Extraction failed. Please extract manually." -ForegroundColor Red
    exit 1
}

# Find the extracted folder
$extractedFolder = Get-ChildItem -Path $openmrsDir -Directory | Where-Object { $_.Name -like "openmrs-standalone*" } | Select-Object -First 1

if ($extractedFolder) {
    Write-Host "OpenMRS Standalone extracted to: $($extractedFolder.FullName)" -ForegroundColor Green
    
    # Create a simple startup script
    $startScript = @"
@echo off
echo Starting OpenMRS Standalone...
cd /d "$($extractedFolder.FullName)"
java -Xmx2g -jar openmrs-standalone.jar
pause
"@
    
    $startScript | Out-File -FilePath "$openmrsDir\start-openmrs.bat" -Encoding ASCII
    
    Write-Host "Setup completed!" -ForegroundColor Green
    Write-Host "To start OpenMRS, run: .\openmrs-standalone\start-openmrs.bat" -ForegroundColor Cyan
    Write-Host "Or navigate to the folder and run: java -Xmx2g -jar openmrs-standalone.jar" -ForegroundColor Cyan
} else {
    Write-Host "Could not find extracted OpenMRS folder." -ForegroundColor Red
}





