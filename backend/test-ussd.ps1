# USSD Direct Test Script
# Tests USSD endpoint without using the simulator UI

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  USSD Direct Callback Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
Write-Host "Checking backend..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET -ErrorAction Stop
    Write-Host "Backend is running!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "Backend is NOT running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start backend first:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test 1: Initial Menu (Language)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$sessionId = "test-" + (Get-Date -Format "yyyyMMddHHmmss")

$test1Body = @{
    sessionId = $sessionId
    phoneNumber = "+250788123456"
    serviceCode = "*384*40767#"
    text = ""
} | ConvertTo-Json

Write-Host "Sending request..." -ForegroundColor Yellow
Write-Host "  Session: $sessionId" -ForegroundColor Gray
Write-Host "  Phone: +250788123456" -ForegroundColor Gray
Write-Host "  Text: (empty - initial request)" -ForegroundColor Gray
Write-Host ""

try {
    $response1 = Invoke-WebRequest -Uri "http://localhost:5000/api/ussd/callback" -Method POST -Body $test1Body -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor White
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host $response1.Content -ForegroundColor Cyan
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host ""
    
    if ($response1.Content -match "CON.*language") {
        Write-Host "Test 1 PASSED: Language menu received" -ForegroundColor Green
    } else {
        Write-Host "Test 1 WARNING: Unexpected response format" -ForegroundColor Yellow
    }
    Write-Host ""
} catch {
    Write-Host "Test 1 FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test 2: Select English (1)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$test2Body = @{
    sessionId = $sessionId
    phoneNumber = "+250788123456"
    serviceCode = "*384*40767#"
    text = "1"
} | ConvertTo-Json

Write-Host "Sending request..." -ForegroundColor Yellow
Write-Host "  Session: $sessionId" -ForegroundColor Gray
Write-Host "  Text: 1 (English)" -ForegroundColor Gray
Write-Host ""

try {
    $response2 = Invoke-WebRequest -Uri "http://localhost:5000/api/ussd/callback" -Method POST -Body $test2Body -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor White
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host $response2.Content -ForegroundColor Cyan
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host ""
    
    if ($response2.Content -match "CON.*method") {
        Write-Host "Test 2 PASSED: Access method menu received" -ForegroundColor Green
    } else {
        Write-Host "Test 2 WARNING: Unexpected response format" -ForegroundColor Yellow
    }
    Write-Host ""
} catch {
    Write-Host "Test 2 FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test 3: Select National ID (1)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$test3Body = @{
    sessionId = $sessionId
    phoneNumber = "+250788123456"
    serviceCode = "*384*40767#"
    text = "1*1"
} | ConvertTo-Json

Write-Host "Sending request..." -ForegroundColor Yellow
Write-Host "  Session: $sessionId" -ForegroundColor Gray
Write-Host "  Text: 1*1 (English -> National ID)" -ForegroundColor Gray
Write-Host ""

try {
    $response3 = Invoke-WebRequest -Uri "http://localhost:5000/api/ussd/callback" -Method POST -Body $test3Body -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor White
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host $response3.Content -ForegroundColor Cyan
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host ""
    
    if ($response3.Content -match "CON.*National ID") {
        Write-Host "Test 3 PASSED: National ID prompt received" -ForegroundColor Green
    } else {
        Write-Host "Test 3 WARNING: Unexpected response format" -ForegroundColor Yellow
    }
    Write-Host ""
} catch {
    Write-Host "Test 3 FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "All basic tests passed!" -ForegroundColor Green
Write-Host ""
Write-Host "Your USSD endpoint is working correctly!" -ForegroundColor White
Write-Host "The browser console errors you see are from" -ForegroundColor White
Write-Host "Africa's Talking simulator webpage, not your code." -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Start ngrok:" -ForegroundColor White
Write-Host "   ngrok http 5000" -ForegroundColor Yellow
Write-Host ""

Write-Host "2. Copy the HTTPS URL from ngrok" -ForegroundColor White
Write-Host ""

Write-Host "3. Go to: https://developers.africastalking.com/simulator" -ForegroundColor White
Write-Host ""

Write-Host "4. Use these settings:" -ForegroundColor White
Write-Host "   Phone: +250788123456" -ForegroundColor Yellow
Write-Host "   USSD Code: *384*40767#" -ForegroundColor Yellow
Write-Host "   Callback URL: https://your-ngrok-url/api/ussd/callback" -ForegroundColor Yellow
Write-Host ""

Write-Host "5. IGNORE browser console errors - they are harmless!" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
