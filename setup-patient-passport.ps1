# Patient Passport - Complete Setup Script
# This script sets up the entire Patient Passport application

Write-Host "🏥 Patient Passport - Complete Setup Script" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# Check prerequisites
Write-Host "📋 Checking Prerequisites..." -ForegroundColor Yellow

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18.x or higher" -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Cyan
    exit 1
}

# Check if Docker is installed
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not found. Please install Docker Desktop" -ForegroundColor Red
    Write-Host "   Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Cyan
    exit 1
}

# Check if Git is installed
try {
    $gitVersion = git --version
    Write-Host "✅ Git: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git not found. Please install Git" -ForegroundColor Red
    Write-Host "   Download from: https://git-scm.com/" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "🚀 Starting Patient Passport Setup..." -ForegroundColor Green
Write-Host ""

# Step 1: Install Frontend Dependencies
Write-Host "📦 Installing Frontend Dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
Set-Location ..

# Step 2: Install Backend Dependencies
Write-Host "📦 Installing Backend Dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
Set-Location ..

# Step 3: Install Patient Passport Service Dependencies
Write-Host "📦 Installing Patient Passport Service Dependencies..." -ForegroundColor Yellow
Set-Location patient-passport-service
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install service dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Service dependencies installed" -ForegroundColor Green
Set-Location ..

# Step 4: Start Docker Services
Write-Host "🐳 Starting Docker Services..." -ForegroundColor Yellow

# Start MongoDB
Write-Host "Starting MongoDB..." -ForegroundColor Cyan
docker run -d --name mongodb -p 27017:27017 mongo:latest
Start-Sleep -Seconds 5

# Start MySQL for OpenMRS
Write-Host "Starting MySQL..." -ForegroundColor Cyan
docker run -d --name mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=openmrs -e MYSQL_USER=openmrs -e MYSQL_PASSWORD=openmrs mysql:5.7
Start-Sleep -Seconds 10

# Start OpenMRS Platform
Write-Host "Starting OpenMRS Platform..." -ForegroundColor Cyan
docker run -d --name openmrs-platform -p 8084:8080 --link mysql:mysql openmrs/openmrs-distro-platform:2.5.0

# Start OpenMRS Reference Application
Write-Host "Starting OpenMRS Reference Application..." -ForegroundColor Cyan
docker-compose up -d

Write-Host "✅ Docker services started" -ForegroundColor Green

# Step 5: Create OpenMRS Module
Write-Host "🔧 Creating OpenMRS Module..." -ForegroundColor Yellow
.\create-omod-file.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create OpenMRS module" -ForegroundColor Red
    exit 1
}

# Step 6: Deploy OpenMRS Module
Write-Host "📤 Deploying OpenMRS Module..." -ForegroundColor Yellow
Start-Sleep -Seconds 30  # Wait for OpenMRS to start
docker cp patientpassportcore-1.0.0.omod openmrs-platform:/usr/local/tomcat/.OpenMRS/modules/
docker restart openmrs-platform
Write-Host "✅ OpenMRS module deployed" -ForegroundColor Green

# Step 7: Create Environment Files
Write-Host "⚙️ Creating Environment Files..." -ForegroundColor Yellow

# Backend .env
$backendEnv = @"
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/patient-passport
DB_HOST=localhost
DB_PORT=3306
DB_NAME=openmrs
DB_USER=openmrs
DB_PASSWORD=openmrs

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-$(Get-Random)
JWT_EXPIRES_IN=24h

# API Configuration
PORT=3000
NODE_ENV=development

# OpenMRS Integration
OPENMRS_URL=http://localhost:8084/openmrs
OPENMRS_USERNAME=admin
OPENMRS_PASSWORD=Admin123

# Patient Passport Service
PATIENT_PASSPORT_SERVICE_URL=http://localhost:3000
"@

$backendEnv | Out-File -FilePath "backend\.env" -Encoding UTF8

# Frontend .env
$frontendEnv = @"
REACT_APP_API_URL=http://localhost:3000
REACT_APP_OPENMRS_URL=http://localhost:8084/openmrs
"@

$frontendEnv | Out-File -FilePath "frontend\.env" -Encoding UTF8

Write-Host "✅ Environment files created" -ForegroundColor Green

# Step 8: Build Applications
Write-Host "🔨 Building Applications..." -ForegroundColor Yellow

# Build Frontend
Set-Location frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build frontend" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend built successfully" -ForegroundColor Green
Set-Location ..

# Build Backend
Set-Location backend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build backend" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend built successfully" -ForegroundColor Green
Set-Location ..

Write-Host ""
Write-Host "🎉 Patient Passport Setup Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Application URLs:" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Backend API: http://localhost:3000/api" -ForegroundColor Cyan
Write-Host "   OpenMRS Platform: http://localhost:8084/openmrs" -ForegroundColor Cyan
Write-Host "   OpenMRS Reference: http://localhost" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔑 Default Credentials:" -ForegroundColor Yellow
Write-Host "   OpenMRS: admin / Admin123" -ForegroundColor Cyan
Write-Host "   Patient Passport: admin@example.com / password123" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Wait 2-3 minutes for all services to fully start" -ForegroundColor White
Write-Host "   2. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "   3. Login with the default credentials" -ForegroundColor White
Write-Host "   4. Check OpenMRS integration at http://localhost:8084/openmrs" -ForegroundColor White
Write-Host ""
Write-Host "🛠️ Useful Commands:" -ForegroundColor Yellow
Write-Host "   Start all services: docker-compose up -d" -ForegroundColor White
Write-Host "   Stop all services: docker-compose down" -ForegroundColor White
Write-Host "   View logs: docker-compose logs" -ForegroundColor White
Write-Host "   Restart OpenMRS: docker restart openmrs-platform" -ForegroundColor White
Write-Host ""
Write-Host "📖 Documentation: PATIENT_PASSPORT_PROJECT_DOCUMENTATION.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "✨ Happy coding!" -ForegroundColor Green
















