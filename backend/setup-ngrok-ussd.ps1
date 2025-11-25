# 🚀 Quick Setup for Africa's Talking Official Simulator
# Run this script to set up ngrok and test USSD

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Africa's Talking USSD Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if backend is running
Write-Host "📡 Checking if backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET -ErrorAction Stop
    Write-Host "✅ Backend is running!`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is NOT running!" -ForegroundColor Red
    Write-Host "`nPlease start the backend first:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor White
    Write-Host "  npm run dev`n" -ForegroundColor White
    Write-Host "Then run this script again.`n" -ForegroundColor Yellow
    exit 1
}

# Check if ngrok is installed
Write-Host "🔍 Checking for ngrok..." -ForegroundColor Yellow
$ngrokPath = Get-Command ngrok -ErrorAction SilentlyContinue

if (-not $ngrokPath) {
    Write-Host "❌ ngrok is not installed!`n" -ForegroundColor Red
    Write-Host "📥 Please install ngrok:" -ForegroundColor Yellow
    Write-Host "  Option 1: Download from https://ngrok.com/download" -ForegroundColor White
    Write-Host "  Option 2: choco install ngrok (if you have Chocolatey)`n" -ForegroundColor White
    
    $install = Read-Host "Would you like to open the download page? (y/n)"
    if ($install -eq 'y' -or $install -eq 'Y') {
        Start-Process "https://ngrok.com/download"
    }
    exit 1
}

Write-Host "✅ ngrok is installed!`n" -ForegroundColor Green

# Check .env configuration
Write-Host "🔧 Checking Africa's Talking credentials..." -ForegroundColor Yellow
$envPath = ".\\.env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    
    if ($envContent -match 'AFRICASTALKING_API_KEY=your-africastalking-api-key' -or 
        $envContent -notmatch 'AFRICASTALKING_API_KEY=atsk_') {
        Write-Host "⚠️  WARNING: .env file has placeholder credentials!`n" -ForegroundColor Yellow
        Write-Host "You need to update .env with your REAL Africa's Talking API key:" -ForegroundColor Yellow
        Write-Host "  1. Go to: https://account.africastalking.com/apps/sandbox" -ForegroundColor White
        Write-Host "  2. Navigate to: Settings → API Key" -ForegroundColor White
        Write-Host "  3. Generate and copy your API key" -ForegroundColor White
        Write-Host "  4. Update backend\.env file:`n" -ForegroundColor White
        Write-Host "     AFRICASTALKING_API_KEY=atsk_YOUR_ACTUAL_KEY_HERE" -ForegroundColor Cyan
        Write-Host "     AFRICASTALKING_USERNAME=sandbox" -ForegroundColor Cyan
        Write-Host "     AFRICASTALKING_USSD_CODE=*384*40767#`n" -ForegroundColor Cyan
        
        $continue = Read-Host "Have you updated the credentials? (y/n)"
        if ($continue -ne 'y' -and $continue -ne 'Y') {
            Write-Host "`n❌ Please update .env and run this script again.`n" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "✅ Credentials look configured!`n" -ForegroundColor Green
    }
} else {
    Write-Host "❌ .env file not found!`n" -ForegroundColor Red
    exit 1
}

# Start ngrok
Write-Host "🌐 Starting ngrok...`n" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ngrok will create a public URL" -ForegroundColor Cyan
Write-Host "  Keep this window open!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Start-Sleep -Seconds 2

# Kill any existing ngrok processes
Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Start ngrok in background and capture output
$ngrokProcess = Start-Process ngrok -ArgumentList "http 5000" -PassThru -NoNewWindow

Write-Host "⏳ Waiting for ngrok to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Get ngrok URL
try {
    $ngrokApi = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
    $publicUrl = $ngrokApi.tunnels[0].public_url
    
    if ($publicUrl -match "http://") {
        $publicUrl = $publicUrl -replace "http://", "https://"
    }
    
    Write-Host "`n✅ ngrok is running!`n" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  PUBLIC URL (copy this!):" -ForegroundColor Green
    Write-Host "  $publicUrl" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Green
    
    # Construct callback URL
    $callbackUrl = "$publicUrl/api/ussd/callback"
    
    Write-Host "📋 CALLBACK URL for Africa's Talking:" -ForegroundColor Yellow
    Write-Host "  $callbackUrl`n" -ForegroundColor Cyan
    
    # Test the endpoint
    Write-Host "🧪 Testing USSD endpoint..." -ForegroundColor Yellow
    try {
        $testBody = @{
            sessionId = "test-setup-123"
            phoneNumber = "+250788123456"
            serviceCode = "*384*40767#"
            text = ""
        } | ConvertTo-Json
        
        $testResponse = Invoke-WebRequest -Uri $callbackUrl -Method POST -Body $testBody -ContentType "application/json" -ErrorAction Stop
        
        if ($testResponse.StatusCode -eq 200) {
            Write-Host "✅ USSD endpoint is working!`n" -ForegroundColor Green
            Write-Host "Response:" -ForegroundColor White
            Write-Host $testResponse.Content -ForegroundColor Cyan
        }
    } catch {
        Write-Host "⚠️  Could not test endpoint: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "This might be okay - test manually in the simulator`n" -ForegroundColor Yellow
    }
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    Write-Host "1. Go to: https://developers.africastalking.com/simulator`n" -ForegroundColor White
    
    Write-Host "2. Fill in the form:" -ForegroundColor White
    Write-Host "   Phone Number:  +250788123456" -ForegroundColor Yellow
    Write-Host "   USSD Code:     *384*40767#" -ForegroundColor Yellow
    Write-Host "   Callback URL:  $callbackUrl`n" -ForegroundColor Yellow
    
    Write-Host "3. Click 'Launch Simulator'`n" -ForegroundColor White
    
    Write-Host "4. Press 'Call' button in the simulator`n" -ForegroundColor White
    
    Write-Host "5. You should see the USSD menu!`n" -ForegroundColor White
    
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    # Copy callback URL to clipboard
    try {
        Set-Clipboard -Value $callbackUrl
        Write-Host "✅ Callback URL copied to clipboard!`n" -ForegroundColor Green
    } catch {
        # Clipboard not available, ignore
    }
    
    Write-Host "⚠️  IMPORTANT: Keep this PowerShell window open!" -ForegroundColor Red
    Write-Host "   Closing it will stop ngrok and break the connection.`n" -ForegroundColor Red
    
    Write-Host "Press Ctrl+C to stop ngrok when done testing.`n" -ForegroundColor Yellow
    
    # Keep script running
    Wait-Process -Id $ngrokProcess.Id
    
} catch {
    Write-Host "`n❌ Failed to get ngrok URL!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)`n" -ForegroundColor Red
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  1. ngrok is installed correctly" -ForegroundColor White
    Write-Host "  2. Port 4040 is not in use" -ForegroundColor White
    Write-Host "  3. ngrok is authenticated (run 'ngrok authtoken YOUR_TOKEN')`n" -ForegroundColor White
    
    Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    exit 1
}
