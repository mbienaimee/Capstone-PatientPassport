@echo off
REM Patient Passport OpenMRS Module Build Script for Windows
REM This script builds the OpenMRS module for deployment

echo  Building Patient Passport OpenMRS Module...
echo ==============================================

REM Check if Maven is installed
mvn -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Maven is not installed. Please install Maven first.
    echo    Download from: https://maven.apache.org/download.cgi
    pause
    exit /b 1
)

REM Check if Java is installed
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Java is not installed. Please install Java 8 or 11 first.
    echo    Download from: https://adoptium.net/
    pause
    exit /b 1
)

echo  Prerequisites check passed
echo.

REM Clean previous builds
echo 🧹 Cleaning previous builds...
call mvn clean

REM Compile and package
echo 🔨 Compiling and packaging module...
call mvn compile package

REM Check if build was successful
if %errorlevel% equ 0 (
    echo.
    echo  Build successful!
    echo.
    echo  Generated files:
    echo    - omod\target\patientpassport-1.0.0.omod
    echo.
    echo  Next steps:
    echo    1. Upload the .omod file to your OpenMRS instance
    echo    2. Go to Administration → Manage Modules
    echo    3. Click 'Add or Upgrade Module'
    echo    4. Upload the patientpassport-1.0.0.omod file
    echo    5. Click 'Start Module'
    echo.
    echo 📋 Module will be available at:
    echo    - Home page: Patient Passport link
    echo    - Patient dashboard: Patient Passport fragment
    echo    - Admin page: Patient Passport Settings
    echo.
) else (
    echo  Build failed. Please check the error messages above.
    pause
    exit /b 1
)

pause


