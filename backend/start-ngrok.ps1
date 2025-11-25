# PowerShell script to start ngrok for Africa's Talking Web Simulator
# Usage: .\start-ngrok.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Starting ngrok for USSD Testing" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if ngrok is installed
$ngrokPath = Get-Command ngrok -ErrorAction SilentlyContinue

if (-not $ngrokPath) {
    Write-Host "❌ ngrok is not installed!" -ForegroundColor Red
    Write-Host "`n📥 Install ngrok:" -ForegroundColor Yellow
    Write-Host "   1. Download from: https://ngrok.com/download" -ForegroundColor Yellow
    Write-Host "   2. Or use: npm install -g ngrok" -ForegroundColor Yellow
    Write-Host "`nAfter installing, run this script again.`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ ngrok found" -ForegroundColor Green
Write-Host "`n⚠️  Make sure your backend is running on port 5000!" -ForegroundColor Yellow
Write-Host "   If not, start it with: npm run dev`n" -ForegroundColor Yellow

$response = Read-Host "Press Enter to start ngrok (or Ctrl+C to cancel)"

Write-Host "`n🚀 Starting ngrok...`n" -ForegroundColor Green
Write-Host "📋 Your callback URL will be: https://[ngrok-url]/api/ussd/callback" -ForegroundColor Cyan
Write-Host "`n💡 Copy the HTTPS URL from ngrok and use it in Africa's Talking dashboard`n" -ForegroundColor Yellow

# Start ngrok
ngrok http 5000

