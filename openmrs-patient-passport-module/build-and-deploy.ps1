# OpenMRS Patient Passport Module - Build and Deploy Script
# This script rebuilds the module and provides access instructions

Write-Host "==========================================" -ForegroundColor Green
Write-Host "Patient Passport OpenMRS Module Builder" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Navigate to module directory
$modulePath = "c:\Users\user\Capstone-PatientPassport\openmrs-patient-passport-module"
Set-Location $modulePath

Write-Host "📂 Current Directory: $modulePath" -ForegroundColor Cyan
Write-Host ""

# Clean and build the module
Write-Host "🔨 Building Patient Passport Module..." -ForegroundColor Yellow
Write-Host "Running: mvn clean package" -ForegroundColor Gray
Write-Host ""

try {
    mvn clean package -DskipTests
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Build Successful!" -ForegroundColor Green
        Write-Host ""
        
        # Check if OMOD file exists
        $omodFile = "$modulePath\target\patientpassport-1.0.0.omod"
        if (Test-Path $omodFile) {
            Write-Host "📦 OMOD File Created:" -ForegroundColor Green
            Write-Host "   Location: $omodFile" -ForegroundColor White
            Write-Host "   Size: $((Get-Item $omodFile).Length / 1KB) KB" -ForegroundColor White
            Write-Host ""
        } else {
            Write-Host "⚠️  Warning: OMOD file not found at expected location" -ForegroundColor Yellow
        }
        
        # Display access instructions
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host "📋 HOW TO ACCESS PATIENT PASSPORT" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "STEP 1: Upload Module to OpenMRS" -ForegroundColor Cyan
        Write-Host "--------------------------------" -ForegroundColor Gray
        Write-Host "1. Start OpenMRS: mvn openmrs-sdk:run" -ForegroundColor White
        Write-Host "2. Open browser: http://localhost:8080/openmrs" -ForegroundColor White
        Write-Host "3. Login as admin" -ForegroundColor White
        Write-Host "4. Go to: Administration → Manage Modules" -ForegroundColor White
        Write-Host "5. Click 'Add or Upgrade Module'" -ForegroundColor White
        Write-Host "6. Upload file: $omodFile" -ForegroundColor White
        Write-Host "7. Wait for module to start" -ForegroundColor White
        Write-Host ""
        
        Write-Host "STEP 2: Access Patient Passport (Choose One)" -ForegroundColor Cyan
        Write-Host "-------------------------------------------" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Option A - Full-Screen Iframe (⭐ RECOMMENDED)" -ForegroundColor Yellow
        Write-Host "  URL: http://localhost:8080/openmrs/module/patientpassport/iframe.htm" -ForegroundColor White
        Write-Host "  Description: Embedded Patient Passport frontend with full features" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Option B - Management Interface" -ForegroundColor Yellow
        Write-Host "  URL: http://localhost:8080/openmrs/module/patientpassport/manage.htm" -ForegroundColor White
        Write-Host "  Description: Configure module settings and view statistics" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Option C - Patient Dashboard" -ForegroundColor Yellow
        Write-Host "  URL: Select patient → Click 'View Patient Passport'" -ForegroundColor White
        Write-Host "  Description: Patient-specific passport data" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Option D - External Direct Access" -ForegroundColor Yellow
        Write-Host "  URL: https://patient-passpo.netlify.app" -ForegroundColor White
        Write-Host "  Description: Standalone frontend application" -ForegroundColor Gray
        Write-Host ""
        
        Write-Host "STEP 3: Configure User Permissions" -ForegroundColor Cyan
        Write-Host "----------------------------------" -ForegroundColor Gray
        Write-Host "1. Go to: Administration → Manage Users" -ForegroundColor White
        Write-Host "2. Select a user to edit" -ForegroundColor White
        Write-Host "3. Add role: 'Patient Passport User'" -ForegroundColor White
        Write-Host "4. Save and re-login" -ForegroundColor White
        Write-Host ""
        
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host "🔧 CONFIGURATION" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Global Properties (Administration → Global Properties):" -ForegroundColor Cyan
        Write-Host "  patientpassport.api.baseUrl = https://patientpassport-api.azurewebsites.net/api" -ForegroundColor White
        Write-Host "  patientpassport.frontend.url = https://patient-passpo.netlify.app/" -ForegroundColor White
        Write-Host "  patientpassport.enable.otp = true" -ForegroundColor White
        Write-Host "  patientpassport.audit.logging = true" -ForegroundColor White
        Write-Host ""
        
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host "🧪 TESTING" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Quick Test Checklist:" -ForegroundColor Cyan
        Write-Host "  ☐ Module appears in Manage Modules" -ForegroundColor White
        Write-Host "  ☐ Module status is 'Started'" -ForegroundColor White
        Write-Host "  ☐ Can access iframe URL" -ForegroundColor White
        Write-Host "  ☐ Frontend loads in iframe" -ForegroundColor White
        Write-Host "  ☐ No console errors" -ForegroundColor White
        Write-Host "  ☐ User permissions assigned" -ForegroundColor White
        Write-Host "  ☐ Can access patient passport" -ForegroundColor White
        Write-Host ""
        
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host "📚 DOCUMENTATION" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Complete guides available:" -ForegroundColor Cyan
        Write-Host "  • ACCESS_GUIDE.md - Detailed access instructions" -ForegroundColor White
        Write-Host "  • README.md - Module overview and features" -ForegroundColor White
        Write-Host "  • DEPLOYMENT_GUIDE.md - Production deployment" -ForegroundColor White
        Write-Host ""
        
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host "✨ SUCCESS!" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your Patient Passport module is ready to deploy!" -ForegroundColor Green
        Write-Host "Upload the OMOD file to OpenMRS and follow the access instructions above." -ForegroundColor White
        Write-Host ""
        Write-Host "For detailed instructions, see: ACCESS_GUIDE.md" -ForegroundColor Cyan
        Write-Host ""
        
    } else {
        Write-Host ""
        Write-Host "❌ Build Failed!" -ForegroundColor Red
        Write-Host "Please check the error messages above and try again." -ForegroundColor Yellow
        Write-Host ""
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ Error during build process:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
