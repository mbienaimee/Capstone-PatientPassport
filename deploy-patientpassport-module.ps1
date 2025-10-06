# Patient Passport OpenMRS Module Deployment Script (PowerShell)
# This script builds and deploys the Patient Passport module to OpenMRS

param(
    [string]$OpenMRSModuleDir = "C:\openmrs\modules",
    [switch]$SkipBuild = $false,
    [switch]$SkipDeploy = $false
)

Write-Host "🏥 Patient Passport OpenMRS Module Deployment" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green

# Configuration
$ModuleName = "patientpassportcore"
$ModuleVersion = "1.0.0"
$ModulePath = "openmrs-modules\patient-passport-core\omod"

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Maven is installed
try {
    $mvnVersion = mvn -version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Maven not found"
    }
    Write-Status "Maven found: $($mvnVersion[0])"
} catch {
    Write-Error "Maven is not installed or not in PATH. Please install Maven first."
    exit 1
}

# Check if Java is installed
try {
    $javaVersion = java -version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Java not found"
    }
    Write-Status "Java found: $($javaVersion[0])"
} catch {
    Write-Error "Java is not installed or not in PATH. Please install Java 8+ first."
    exit 1
}

if (-not $SkipBuild) {
    Write-Status "Building Patient Passport Core Module..."
    
    # Navigate to module directory
    if (-not (Test-Path $ModulePath)) {
        Write-Error "Module directory not found: $ModulePath"
        exit 1
    }
    
    Set-Location $ModulePath
    
    # Clean and build the module
    Write-Status "Cleaning previous build..."
    mvn clean
    
    Write-Status "Compiling module..."
    mvn compile
    
    Write-Status "Building OMOD file..."
    mvn package
    
    # Check if build was successful
    $omodFile = "target\$ModuleName-$ModuleVersion.omod"
    if (-not (Test-Path $omodFile)) {
        Write-Error "Module build failed. OMOD file not found: $omodFile"
        exit 1
    }
    
    Write-Status "Module built successfully!"
    Write-Status "OMOD file: $(Get-Location)\$omodFile"
}

if (-not $SkipDeploy) {
    # Check if OpenMRS modules directory exists
    if (-not (Test-Path $OpenMRSModuleDir)) {
        Write-Warning "OpenMRS modules directory not found at $OpenMRSModuleDir"
        Write-Warning "Please ensure OpenMRS is installed and running."
        Write-Warning "You can manually copy the OMOD file to your OpenMRS modules directory."
        Write-Status "OMOD file location: $(Get-Location)\target\$ModuleName-$ModuleVersion.omod"
        exit 0
    }
    
    # Stop OpenMRS if running (assuming it's running as a Windows service)
    Write-Status "Stopping OpenMRS..."
    try {
        Stop-Service -Name "Tomcat*" -Force -ErrorAction SilentlyContinue
        Write-Status "OpenMRS service stopped"
    } catch {
        Write-Warning "Could not stop OpenMRS service. Please stop it manually."
    }
    
    # Copy module to OpenMRS modules directory
    Write-Status "Copying module to OpenMRS modules directory..."
    $sourceFile = "target\$ModuleName-$ModuleVersion.omod"
    $destFile = "$OpenMRSModuleDir\$ModuleName-$ModuleVersion.omod"
    
    Copy-Item $sourceFile $destFile -Force
    
    Write-Status "Module copied to: $destFile"
    
    # Start OpenMRS
    Write-Status "Starting OpenMRS..."
    try {
        Start-Service -Name "Tomcat*" -ErrorAction SilentlyContinue
        Write-Status "OpenMRS service started"
    } catch {
        Write-Warning "Could not start OpenMRS service. Please start it manually."
    }
    
    Write-Status "Waiting for OpenMRS to start..."
    Start-Sleep -Seconds 30
    
    # Check if OpenMRS is running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/openmrs" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Status "✅ OpenMRS is running successfully!"
        }
    } catch {
        Write-Warning "OpenMRS may still be starting up. Please check the logs."
    }
}

Write-Host ""
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host ""
Write-Host "Module Information:"
Write-Host "- Name: $ModuleName"
Write-Host "- Version: $ModuleVersion"
Write-Host "- Location: $OpenMRSModuleDir\$ModuleName-$ModuleVersion.omod"
Write-Host ""
Write-Host "Next Steps:"
Write-Host "1. Log into OpenMRS: http://localhost:8080/openmrs"
Write-Host "2. Go to Administration > Manage Modules"
Write-Host "3. Find 'Patient Passport Core' and start it"
Write-Host "4. Configure the module settings"
Write-Host "5. Test the integration with your Patient Passport system"
Write-Host ""
Write-Host "API Endpoints:"
Write-Host "- REST API: http://localhost:8080/openmrs/ws/rest/v1/patientpassport"
Write-Host "- FHIR API: http://localhost:8080/openmrs/ws/fhir2/R4/Patient"
Write-Host ""
Write-Host "Admin Pages:"
Write-Host "- Administration: http://localhost:8080/openmrs/module/patientpassportcore/admin.page"
Write-Host ""
Write-Status "Deployment script completed successfully!"

# Return to original directory
Set-Location $PSScriptRoot












