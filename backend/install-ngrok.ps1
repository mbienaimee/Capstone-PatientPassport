# ngrok Installation and Setup Script
# This script helps you download and configure ngrok for USSD testing

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ngrok Installation Helper" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if ngrok is already installed
$ngrokPath = Get-Command ngrok -ErrorAction SilentlyContinue

if ($ngrokPath) {
    Write-Host "✅ ngrok is already installed at: $($ngrokPath.Source)" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "❌ ngrok is NOT installed" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📥 Installing ngrok using Chocolatey..." -ForegroundColor Cyan
    Write-Host ""
    
    # Check if Chocolatey is installed
    $chocoPath = Get-Command choco -ErrorAction SilentlyContinue
    
    if ($chocoPath) {
        Write-Host "Installing ngrok via Chocolatey..." -ForegroundColor White
        choco install ngrok -y
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ ngrok installed successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to install ngrok via Chocolatey" -ForegroundColor Red
            Write-Host ""
            Write-Host "Please install ngrok manually:" -ForegroundColor Yellow
            Write-Host "1. Go to: https://ngrok.com/download" -ForegroundColor White
            Write-Host "2. Download ngrok for Windows" -ForegroundColor White
            Write-Host "3. Extract and run ngrok.exe" -ForegroundColor White
            exit 1
        }
    } else {
        Write-Host "⚠️ Chocolatey is not installed" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "You have two options:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Option 1: Install Chocolatey (package manager)" -ForegroundColor White
        Write-Host "Run this in an ADMIN PowerShell:" -ForegroundColor Yellow
        Write-Host "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Then run this script again." -ForegroundColor White
        Write-Host ""
        Write-Host "Option 2: Download ngrok manually" -ForegroundColor White
        Write-Host "1. Go to: https://ngrok.com/download" -ForegroundColor Gray
        Write-Host "2. Download ngrok for Windows" -ForegroundColor Gray
        Write-Host "3. Extract and place ngrok.exe in a folder" -ForegroundColor Gray
        Write-Host "4. Add that folder to your PATH" -ForegroundColor Gray
        Write-Host ""
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ngrok Configuration" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "To use ngrok, you need a FREE account and authtoken" -ForegroundColor White
Write-Host ""
Write-Host "📋 Steps:" -ForegroundColor Cyan
Write-Host "1. Go to: https://dashboard.ngrok.com/signup" -ForegroundColor White
Write-Host "2. Create a FREE account" -ForegroundColor White
Write-Host "3. Copy your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor White
Write-Host "4. Run this command:" -ForegroundColor White
Write-Host "   ngrok config add-authtoken YOUR_AUTHTOKEN_HERE" -ForegroundColor Yellow
Write-Host ""

$response = Read-Host "Have you already configured your ngrok authtoken? (y/n)"

if ($response -eq "y" -or $response -eq "Y") {
    Write-Host ""
    Write-Host "✅ Great! Starting ngrok..." -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 ngrok will expose http://localhost:5000 to the internet" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️ Make sure your backend is running in another window!" -ForegroundColor Yellow
    Write-Host ""
    
    Start-Sleep -Seconds 2
    
    Write-Host "Starting ngrok http 5000..." -ForegroundColor White
    ngrok http 5000
    
} else {
    Write-Host ""
    Write-Host "⏸️ Please complete ngrok setup first:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Sign up at: https://dashboard.ngrok.com/signup" -ForegroundColor White
    Write-Host "2. Get your authtoken: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor White
    Write-Host "3. Run: ngrok config add-authtoken YOUR_AUTHTOKEN_HERE" -ForegroundColor Yellow
    Write-Host "4. Run this script again" -ForegroundColor White
    Write-Host ""
    
    # Open ngrok signup page
    $openBrowser = Read-Host "Open ngrok signup page in browser? (y/n)"
    if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
        Start-Process "https://dashboard.ngrok.com/signup"
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
