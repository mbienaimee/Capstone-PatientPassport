# Comprehensive Deployment Test Script
# Tests both deployed frontend and backend to ensure full functionality

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT STATUS CHECK" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$backendUrl = "https://patientpassport-api.azurewebsites.net"
$frontendUrl = "https://patient-passpo.netlify.app"

# Test 1: Backend Health Check
Write-Host "Test 1: Backend Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$backendUrl/health" -Method GET
    Write-Host " Backend Status: ONLINE" -ForegroundColor Green
    Write-Host "   Environment: $($health.environment)" -ForegroundColor White
    Write-Host "   Version: $($health.version)" -ForegroundColor White
    Write-Host "   Email Service: $($health.email.configured)" -ForegroundColor White
    Write-Host "   OpenMRS Hospitals: $($health.openmrs.connectedHospitals)" -ForegroundColor White
} catch {
    Write-Host " Backend Status: OFFLINE" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: API Docs Accessibility
Write-Host "Test 2: API Documentation..." -ForegroundColor Yellow
try {
    $docs = Invoke-WebRequest -Uri "$backendUrl/api-docs/" -Method GET
    if ($docs.StatusCode -eq 200) {
        Write-Host " API Docs: ACCESSIBLE" -ForegroundColor Green
        Write-Host "   URL: $backendUrl/api-docs/" -ForegroundColor White
    }
} catch {
    Write-Host " API Docs: INACCESSIBLE" -ForegroundColor Red
}

Write-Host ""

# Test 3: USSD Endpoint
Write-Host "Test 3: USSD Endpoint..." -ForegroundColor Yellow
try {
    $body = 'sessionId=test123&serviceCode=*384*40767%23&phoneNumber=%2B250788123456&text='
    $ussd = Invoke-WebRequest -Uri "$backendUrl/api/ussd/callback" -Method POST -Body $body -ContentType "application/x-www-form-urlencoded"
    if ($ussd.StatusCode -eq 200 -and $ussd.Content -like "*Choose a language*") {
        Write-Host " USSD Endpoint: WORKING" -ForegroundColor Green
        Write-Host "   Response: $($ussd.Content.Substring(0, 50))..." -ForegroundColor White
    }
} catch {
    Write-Host " USSD Endpoint: FAILED" -ForegroundColor Red
}

Write-Host ""

# Test 4: Frontend Accessibility
Write-Host "Test 4: Frontend Accessibility..." -ForegroundColor Yellow
try {
    $frontend = Invoke-WebRequest -Uri $frontendUrl -Method GET
    if ($frontend.StatusCode -eq 200) {
        Write-Host " Frontend Status: ONLINE" -ForegroundColor Green
        Write-Host "   URL: $frontendUrl" -ForegroundColor White
        
        # Check if frontend has backend API URL configured
        if ($frontend.Content -match "patientpassport-api\.azurewebsites\.net") {
            Write-Host "   Backend Integration: CONFIGURED" -ForegroundColor Green
        } else {
            Write-Host "   Backend Integration: CHECK NEEDED" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host " Frontend Status: OFFLINE" -ForegroundColor Red
}

Write-Host ""

# Test 5: CORS Configuration
Write-Host "Test 5: CORS Configuration..." -ForegroundColor Yellow
try {
    $headers = @{
        'Origin' = $frontendUrl
    }
    $cors = Invoke-WebRequest -Uri "$backendUrl/health" -Method GET -Headers $headers
    $corsHeader = $cors.Headers['Access-Control-Allow-Credentials']
    if ($corsHeader) {
        Write-Host " CORS: CONFIGURED" -ForegroundColor Green
        Write-Host "   Allow-Credentials: $corsHeader" -ForegroundColor White
    }
} catch {
    Write-Host " CORS: CHECK NEEDED" -ForegroundColor Yellow
}

Write-Host ""

# Test 6: Socket.IO Support
Write-Host "Test 6: WebSocket/Socket.IO Support..." -ForegroundColor Yellow
Write-Host "   Backend WebSocket URL: wss://patientpassport-api.azurewebsites.net" -ForegroundColor White
Write-Host "   Note: Socket.IO requires testing from browser" -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT SUMMARY" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend (API):" -ForegroundColor Cyan
Write-Host "   API: $backendUrl/api" -ForegroundColor White
Write-Host "   Swagger Docs: $backendUrl/api-docs/" -ForegroundColor White
Write-Host "   Health Check: $backendUrl/health" -ForegroundColor White
Write-Host "   USSD Callback: $backendUrl/api/ussd/callback" -ForegroundColor White
Write-Host ""
Write-Host "Frontend (UI):" -ForegroundColor Cyan
Write-Host "   Primary: $frontendUrl" -ForegroundColor White
Write-Host "   Alternate: https://jade-pothos-e432d0.netlify.app" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open frontend: $frontendUrl" -ForegroundColor White
Write-Host "2. Test login/registration" -ForegroundColor White
Write-Host "3. Verify real-time notifications (Socket.IO)" -ForegroundColor White
Write-Host "4. Test USSD with Africa's Talking simulator" -ForegroundColor White
Write-Host "5. Configure Africa's Talking callback URL:" -ForegroundColor White
Write-Host "   $backendUrl/api/ussd/callback" -ForegroundColor Green
Write-Host ""
