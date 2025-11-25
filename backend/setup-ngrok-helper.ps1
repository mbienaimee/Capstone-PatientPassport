# After Download - ngrok Setup Helper
# Run this AFTER you've downloaded and placed ngrok.exe in C:\Users\user\ngrok\

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ngrok Setup Helper" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ngrokPath = "C:\Users\user\ngrok\ngrok.exe"

# Check if ngrok.exe exists
if (Test-Path $ngrokPath) {
    Write-Host "Found ngrok.exe!" -ForegroundColor Green
    Write-Host "Location: $ngrokPath" -ForegroundColor White
    Write-Host ""
    
    # Test ngrok
    Write-Host "Testing ngrok..." -ForegroundColor Cyan
    & $ngrokPath version
    Write-Host ""
    
    # Check if authtoken is configured
    Write-Host "Checking authtoken configuration..." -ForegroundColor Cyan
    $configCheck = & $ngrokPath config check 2>&1
    
    if ($configCheck -match "valid" -or $configCheck -match "OK") {
        Write-Host "Authtoken is configured!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Ready to start ngrok!" -ForegroundColor Green
        Write-Host ""
        
        $start = Read-Host "Start ngrok now? (y/n)"
        if ($start -eq "y" -or $start -eq "Y") {
            Write-Host ""
            Write-Host "Starting ngrok http 5000..." -ForegroundColor Cyan
            Write-Host "Press Ctrl+C to stop ngrok" -ForegroundColor Yellow
            Write-Host ""
            & $ngrokPath http 5000
        }
    } else {
        Write-Host "Authtoken NOT configured yet" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Steps to configure:" -ForegroundColor Cyan
        Write-Host "1. Go to: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor White
        Write-Host "2. Copy your authtoken" -ForegroundColor White
        Write-Host "3. Run this command:" -ForegroundColor White
        Write-Host "   $ngrokPath config add-authtoken YOUR_TOKEN_HERE" -ForegroundColor Yellow
        Write-Host ""
        
        $openDashboard = Read-Host "Open ngrok dashboard in browser? (y/n)"
        if ($openDashboard -eq "y" -or $openDashboard -eq "Y") {
            Start-Process "https://dashboard.ngrok.com/get-started/your-authtoken"
        }
        
        Write-Host ""
        Write-Host "After configuring authtoken, run this script again." -ForegroundColor Cyan
    }
    
} else {
    Write-Host "ngrok.exe NOT FOUND!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Expected location: $ngrokPath" -ForegroundColor White
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Download ngrok from: https://ngrok.com/download" -ForegroundColor White
    Write-Host "2. Extract the ZIP file" -ForegroundColor White
    Write-Host "3. Place ngrok.exe in: C:\Users\user\ngrok\" -ForegroundColor White
    Write-Host ""
    
    # Create the directory
    $createDir = Read-Host "Create C:\Users\user\ngrok\ directory now? (y/n)"
    if ($createDir -eq "y" -or $createDir -eq "Y") {
        New-Item -ItemType Directory -Path "C:\Users\user\ngrok" -Force
        Write-Host "Directory created!" -ForegroundColor Green
        Write-Host "Now download and extract ngrok.exe to this folder." -ForegroundColor White
    }
    
    $openDownload = Read-Host "Open ngrok download page in browser? (y/n)"
    if ($openDownload -eq "y" -or $openDownload -eq "Y") {
        Start-Process "https://ngrok.com/download"
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
