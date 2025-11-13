<#
Simple PowerShell integration tests for the deployed backend.
Usage: run from any machine with network access to the app.
Replace $apiBase with your actual Azure app URL.
#>

param(
    [string]$apiBase = 'https://patientpassport-api.azurewebsites.net'
)

Write-Host "Running integration checks against: $apiBase"

try {
    $health = Invoke-RestMethod -Uri "$apiBase/health" -Method Get -ErrorAction Stop
    Write-Host "Health OK:" $health
} catch {
    Write-Host "Health check failed:`n" $_.Exception.Message
}

# Test email (you should set a real test email address)
$testEmail = Read-Host -Prompt 'Enter a test email to send (or leave empty to skip)'
if ($testEmail) {
    try {
        $body = @{ email = $testEmail } | ConvertTo-Json
        $res = Invoke-RestMethod -Uri "$apiBase/api/auth/test-email" -Method Post -Body $body -ContentType 'application/json' -ErrorAction Stop
        Write-Host "Test email endpoint response:" $res
    } catch {
        Write-Host "Test email failed:`n" $_.Exception.Message
    }
}

Write-Host "If you need a WebSocket test, run the included node script: node scripts/socket-test.js --url $apiBase"
