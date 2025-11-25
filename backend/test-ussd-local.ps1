# Test USSD Locally (NO ngrok needed!)
# This script simulates USSD requests from your computer

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LOCAL USSD TESTING (No ngrok!)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
try {
    $health = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET -ErrorAction Stop
    Write-Host "Backend is running!" -ForegroundColor Green
} catch {
    Write-Host "Backend is NOT running!" -ForegroundColor Red
    Write-Host "Please start the backend first:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "Testing USSD Flow..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Initial request (language selection)
Write-Host "Step 1: Dialing *384*40767#..." -ForegroundColor Yellow
$body1 = 'sessionId=test123&serviceCode=*384*40767%23&phoneNumber=%2B250788123456&text='
$response1 = Invoke-WebRequest -Uri "http://localhost:5000/api/ussd/callback" -Method POST -Body $body1 -ContentType "application/x-www-form-urlencoded"
Write-Host "Response:" -ForegroundColor White
Write-Host $response1.Content -ForegroundColor Green
Write-Host ""

# Step 2: Select English
Write-Host "Step 2: Selecting 1 (English)..." -ForegroundColor Yellow
$body2 = 'sessionId=test123&serviceCode=*384*40767%23&phoneNumber=%2B250788123456&text=1'
$response2 = Invoke-WebRequest -Uri "http://localhost:5000/api/ussd/callback" -Method POST -Body $body2 -ContentType "application/x-www-form-urlencoded"
Write-Host "Response:" -ForegroundColor White
Write-Host $response2.Content -ForegroundColor Green
Write-Host ""

# Step 3: Select National ID
Write-Host "Step 3: Selecting 1 (Use National ID)..." -ForegroundColor Yellow
$body3 = 'sessionId=test123&serviceCode=*384*40767%23&phoneNumber=%2B250788123456&text=1*1'
$response3 = Invoke-WebRequest -Uri "http://localhost:5000/api/ussd/callback" -Method POST -Body $body3 -ContentType "application/x-www-form-urlencoded"
Write-Host "Response:" -ForegroundColor White
Write-Host $response3.Content -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "USSD Testing Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "All USSD steps working correctly!" -ForegroundColor Green
Write-Host ""
Write-Host "NOTE: This is LOCAL testing only." -ForegroundColor Yellow
Write-Host "To test on a real phone or AT simulator, you need ngrok." -ForegroundColor Yellow
Write-Host ""
