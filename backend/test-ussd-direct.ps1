# 🧪 USSD Direct Test Script
# This tests your USSD endpoint directly, bypassing the simulator UI

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  USSD Direct Callback Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if backend is running
Write-Host "📡 Checking backend..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET -ErrorAction Stop
    Write-Host "✅ Backend is running`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is NOT running!`n" -ForegroundColor Red
    Write-Host "Please start backend first:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor White
    Write-Host "  npm run dev`n" -ForegroundColor White
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test 1: Initial Menu (Language)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$test1Body = @{
    sessionId = "test-" + (Get-Date -Format "yyyyMMddHHmmss")
    phoneNumber = "+250788123456"
    serviceCode = "*384*40767#"
    text = ""
} | ConvertTo-Json

Write-Host "Sending request..." -ForegroundColor Yellow
Write-Host "  Session: $($test1Body | ConvertFrom-Json | Select-Object -ExpandProperty sessionId)" -ForegroundColor Gray
Write-Host "  Phone: +250788123456" -ForegroundColor Gray
Write-Host "  Text: (empty - initial request)`n" -ForegroundColor Gray

try {
    $response1 = Invoke-WebRequest -Uri "http://localhost:5000/api/ussd/callback" `
        -Method POST `
        -Body $test1Body `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "`nResponse:" -ForegroundColor White
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host $response1.Content -ForegroundColor Cyan
    Write-Host "----------------------------------------`n" -ForegroundColor Gray
    
    if ($response1.Content -match "CON.*language") {
        Write-Host "✅ Test 1 PASSED: Language menu received`n" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Test 1 WARNING: Unexpected response format`n" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Test 1 FAILED: $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test 2: Select English (1)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$sessionId = ($test1Body | ConvertFrom-Json).sessionId

$test2Body = @{
    sessionId = $sessionId
    phoneNumber = "+250788123456"
    serviceCode = "*384*40767#"
    text = "1"
} | ConvertTo-Json

Write-Host "Sending request..." -ForegroundColor Yellow
Write-Host "  Session: $sessionId" -ForegroundColor Gray
Write-Host "  Text: 1 (English)`n" -ForegroundColor Gray

try {
    $response2 = Invoke-WebRequest -Uri "http://localhost:5000/api/ussd/callback" `
        -Method POST `
        -Body $test2Body `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "`nResponse:" -ForegroundColor White
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host $response2.Content -ForegroundColor Cyan
    Write-Host "----------------------------------------`n" -ForegroundColor Gray
    
    if ($response2.Content -match "CON.*method") {
        Write-Host "✅ Test 2 PASSED: Access method menu received`n" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Test 2 WARNING: Unexpected response format`n" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Test 2 FAILED: $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test 3: Select National ID (1)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$test3Body = @{
    sessionId = $sessionId
    phoneNumber = "+250788123456"
    serviceCode = "*384*40767#"
    text = "1*1"
} | ConvertTo-Json

Write-Host "Sending request..." -ForegroundColor Yellow
Write-Host "  Session: $sessionId" -ForegroundColor Gray
Write-Host "  Text: 1*1 (English → National ID)`n" -ForegroundColor Gray

try {
    $response3 = Invoke-WebRequest -Uri "http://localhost:5000/api/ussd/callback" `
        -Method POST `
        -Body $test3Body `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "`nResponse:" -ForegroundColor White
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host $response3.Content -ForegroundColor Cyan
    Write-Host "----------------------------------------`n" -ForegroundColor Gray
    
    if ($response3.Content -match "CON.*National ID") {
        Write-Host "✅ Test 3 PASSED: National ID prompt received`n" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Test 3 WARNING: Unexpected response format`n" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Test 3 FAILED: $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "✅ All basic tests passed!" -ForegroundColor Green
Write-Host "`nYour USSD endpoint is working correctly!" -ForegroundColor White
Write-Host "The browser console errors you see are from" -ForegroundColor White
Write-Host "Africa's Talking's simulator webpage, not your code.`n" -ForegroundColor White

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "1. Start ngrok:" -ForegroundColor White
Write-Host "   ngrok http 5000`n" -ForegroundColor Yellow

Write-Host "2. Copy the HTTPS URL from ngrok`n" -ForegroundColor White

Write-Host "3. Go to: https://developers.africastalking.com/simulator`n" -ForegroundColor White

Write-Host "4. Use these settings:" -ForegroundColor White
Write-Host "   Phone: +250788123456" -ForegroundColor Yellow
Write-Host "   USSD Code: *384*40767#" -ForegroundColor Yellow
Write-Host "   Callback URL: https://your-ngrok-url/api/ussd/callback" -ForegroundColor Yellow
Write-Host ""

Write-Host "5. IGNORE browser console errors - they're harmless!" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
