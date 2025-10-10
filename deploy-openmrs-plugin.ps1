# Patient Passport OpenMRS Plugin Deployment Script (PowerShell)
# This script ensures the Patient Passport plugin is properly integrated into OpenMRS

param(
    [switch]$SkipBuild = $false,
    [switch]$SkipDeploy = $false
)

Write-Host "🏥 Patient Passport OpenMRS Plugin Deployment" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green

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

function Write-Step {
    param([string]$Message)
    Write-Host "[STEP] $Message" -ForegroundColor Blue
}

# Check if OpenMRS is running
Write-Step "Checking if OpenMRS is running..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8084/openmrs/ws/rest/v1/systeminformation" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Status "OpenMRS is running at http://localhost:8084/openmrs/"
    }
} catch {
    Write-Error "OpenMRS is not running. Please start it first:"
    Write-Host "  docker-compose -f openmrs-docker-compose.yml up -d" -ForegroundColor Yellow
    exit 1
}

# Check if Maven is available
Write-Step "Checking for Maven..."
try {
    $mvnVersion = mvn -version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Status "Maven found: $($mvnVersion[0])"
    } else {
        throw "Maven not found"
    }
} catch {
    Write-Warning "Maven not found. Installing via Chocolatey..."
    try {
        choco install maven -y
        Write-Status "Maven installed successfully"
    } catch {
        Write-Error "Failed to install Maven. Please install manually from https://maven.apache.org/download.cgi"
        exit 1
    }
}

if (-not $SkipBuild) {
    # Build the Patient Passport plugin
    Write-Step "Building Patient Passport plugin..."
    
    if (-not (Test-Path "openmrs-modules\patient-passport-core\omod\pom.xml")) {
        Write-Error "pom.xml not found. Please ensure you're in the correct directory."
        exit 1
    }
    
    Set-Location "openmrs-modules\patient-passport-core\omod"
    
    Write-Status "Cleaning previous build..."
    mvn clean
    
    Write-Status "Compiling plugin..."
    mvn compile
    
    Write-Status "Building OMOD file..."
    mvn package
    
    # Check if build was successful
    $omodFile = "target\patientpassportcore-1.0.0.omod"
    if (-not (Test-Path $omodFile)) {
        Write-Error "Plugin build failed. OMOD file not found: $omodFile"
        exit 1
    }
    
    Write-Status "Plugin built successfully: $omodFile"
    Set-Location "..\..\.."
}

if (-not $SkipDeploy) {
    # Deploy to OpenMRS
    Write-Step "Deploying plugin to OpenMRS..."
    
    $omodFile = "openmrs-modules\patient-passport-core\omod\target\patientpassportcore-1.0.0.omod"
    
    # Method 1: Copy to Docker volume
    try {
        $openmrsContainer = docker ps --filter "name=openmrs" --format "{{.ID}}"
        if ($openmrsContainer) {
            Write-Status "Copying plugin to OpenMRS modules directory..."
            docker cp $omodFile "${openmrsContainer}:/usr/local/tomcat/.OpenMRS/modules/"
            
            Write-Status "Restarting OpenMRS to load the plugin..."
            docker-compose -f openmrs-docker-compose.yml restart openmrs
            
            Write-Status "Waiting for OpenMRS to restart..."
            Start-Sleep -Seconds 30
        } else {
            Write-Warning "OpenMRS container not found. Please copy the plugin manually:"
            Write-Host "  Copy: $omodFile" -ForegroundColor Yellow
            Write-Host "  To: OpenMRS modules directory" -ForegroundColor Yellow
            Write-Host "  Then restart OpenMRS" -ForegroundColor Yellow
        }
    } catch {
        Write-Warning "Docker deployment failed. Please copy the plugin manually."
    }
}

# Test the plugin
Write-Step "Testing plugin integration..."

# Wait for OpenMRS to be ready
Write-Status "Waiting for OpenMRS to be ready..."
for ($i = 1; $i -le 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8084/openmrs/ws/rest/v1/systeminformation" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Status "OpenMRS is ready!"
            break
        }
    } catch {
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
    }
}

# Test plugin endpoints
Write-Status "Testing Patient Passport API endpoints..."

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8084/openmrs/ws/rest/v1/patientpassport" -UseBasicParsing -TimeoutSec 10
    Write-Status "✅ Patient Passport plugin is active!"
} catch {
    Write-Warning "⚠️  Patient Passport plugin may not be fully loaded yet."
    Write-Warning "   Please check OpenMRS Admin → Manage Modules"
}

# Display success information
Write-Host ""
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host ""
Write-Host "Plugin Information:"
Write-Host "- Name: Patient Passport Core"
Write-Host "- Version: 1.0.0"
Write-Host "- File: $omodFile"
Write-Host ""
Write-Host "Access URLs:"
Write-Host "- OpenMRS: http://localhost:8084/openmrs/"
Write-Host "- Admin Panel: http://localhost:8084/openmrs/admin/"
Write-Host "- Patient Passport Admin: http://localhost:8084/openmrs/module/patientpassportcore/admin.page"
Write-Host ""
Write-Host "API Endpoints:"
Write-Host "- REST API: http://localhost:8084/openmrs/ws/rest/v1/patientpassport"
Write-Host "- FHIR API: http://localhost:8084/openmrs/ws/fhir2/R4/Patient"
Write-Host ""
Write-Host "Next Steps:"
Write-Host "1. Login to OpenMRS: http://localhost:8084/openmrs/"
Write-Host "2. Go to Administration → Manage Modules"
Write-Host "3. Verify 'Patient Passport Core' is started"
Write-Host "4. Test by creating a patient and checking the Patient Passport section"
Write-Host "5. Configure API settings in the Patient Passport admin panel"
Write-Host ""
Write-Status "Patient Passport plugin deployment completed successfully!"





























