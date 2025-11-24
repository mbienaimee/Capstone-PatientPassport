@echo off
echo ========================================
echo Starting Automatic OpenMRS Sync Worker
echo ========================================
echo.
echo This will sync observations from OpenMRS
echo to Patient Passport every 30 seconds.
echo.
echo Press Ctrl+C to stop.
echo.
cd /d "%~dp0"
node auto-sync-worker.js
pause
