# Quick Fix: Remove OpenMRS Module Cache
Write-Host "`n🔧 Removing Patient Passport module cache..." -ForegroundColor Yellow

$cachePath = "C:\Users\user\openmrs\server\.openmrs-lib-cache\patientpassport"

if (Test-Path $cachePath) {
    Remove-Item $cachePath -Recurse -Force
    Write-Host "✅ Cache removed successfully!" -ForegroundColor Green
    Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Start OpenMRS" -ForegroundColor White
    Write-Host "2. OpenMRS will re-extract the module from the .omod file" -ForegroundColor White
    Write-Host "3. It should start without errors!" -ForegroundColor White
} else {
    Write-Host "✓ Cache folder doesn't exist (already clean)" -ForegroundColor Green
}

Write-Host ""
