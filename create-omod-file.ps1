# Create Patient Passport OpenMRS Module (.omod file)
# This script creates the complete .omod file for deployment

Write-Host "🏥 Creating Patient Passport OpenMRS Module (.omod file)" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green

# Create a clean target directory
$targetDir = "openmrs-modules\patient-passport-core\omod\target-clean"
if (Test-Path $targetDir) {
    Remove-Item $targetDir -Recurse -Force
}
New-Item -ItemType Directory -Path $targetDir -Force

# Create META-INF directory and manifest
New-Item -ItemType Directory -Path "$targetDir\META-INF" -Force
$manifestContent = @"
Manifest-Version: 1.0
OpenMRS-Module-Name: patientpassportcore
OpenMRS-Module-Version: 1.0.0
OpenMRS-Module-Description: Patient Passport Core Module for OpenMRS Integration
OpenMRS-Module-Author: Patient Passport Team
OpenMRS-Module-Requires: webservices.rest, fhir2
OpenMRS-Module-Maintainer: Patient Passport Development Team
OpenMRS-Module-Requires-OpenMRS-Version: 2.0.0
OpenMRS-Module-Requires-Java-Version: 1.8
"@
$manifestContent | Out-File -FilePath "$targetDir\META-INF\MANIFEST.MF" -Encoding UTF8

# Copy config.xml
Copy-Item "openmrs-modules\patient-passport-core\omod\src\main\resources\config.xml" "$targetDir\config.xml"

# Create sql directory and copy updates.xml
New-Item -ItemType Directory -Path "$targetDir\sql" -Force
Copy-Item "openmrs-modules\patient-passport-core\omod\src\main\resources\sql\updates.xml" "$targetDir\sql\updates.xml"

# Create pages directory and copy web pages
New-Item -ItemType Directory -Path "$targetDir\pages\patientpassport" -Force
Copy-Item "openmrs-modules\patient-passport-core\omod\src\main\webapp\pages\patientpassport\admin.page" "$targetDir\pages\patientpassport\admin.page"
Copy-Item "openmrs-modules\patient-passport-core\omod\src\main\webapp\pages\patientpassport\patientDashboard.page" "$targetDir\pages\patientpassport\patientDashboard.page"

# Create the .omod file (which is essentially a ZIP file)
Write-Host "Creating .omod file..." -ForegroundColor Yellow
Set-Location $targetDir
Compress-Archive -Path * -DestinationPath "..\..\..\..\patientpassportcore-1.0.0.zip" -Force
Set-Location ..\..\..\..
# Rename .zip to .omod
Rename-Item "patientpassportcore-1.0.0.zip" "patientpassportcore-1.0.0.omod"

# Verify the file was created
if (Test-Path "patientpassportcore-1.0.0.omod") {
    $fileSize = (Get-Item "patientpassportcore-1.0.0.omod").Length
    Write-Host "✅ .omod file created successfully!" -ForegroundColor Green
    Write-Host "   File: patientpassportcore-1.0.0.omod" -ForegroundColor Cyan
    Write-Host "   Size: $fileSize bytes" -ForegroundColor Cyan
} else {
    Write-Host "❌ Failed to create .omod file" -ForegroundColor Red
}

# Clean up temporary directory
Remove-Item $targetDir -Recurse -Force

Write-Host ""
Write-Host "🎉 Patient Passport OpenMRS Module is ready for deployment!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Deploy to OpenMRS: Copy patientpassportcore-1.0.0.omod to OpenMRS modules directory"
Write-Host "2. Restart OpenMRS"
Write-Host "3. Go to Administration → Manage Modules"
Write-Host "4. Start the 'Patient Passport Core' module"
Write-Host "5. Test the integration"

