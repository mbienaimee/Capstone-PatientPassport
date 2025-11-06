@echo off
REM OpenMRS Patient Passport Module - Windows Installation Script
REM This script automates the installation and configuration of the Patient Passport module

setlocal enabledelayedexpansion

REM Configuration variables
set MODULE_NAME=patientpassport
set MODULE_VERSION=1.0.0
set API_BASE_URL=https://patientpassport-api.azurewebsites.net/api
set FRONTEND_URL=https://patient-passpo.netlify.app/
set OTP_ENABLED=true
set AUDIT_LOGGING=true

echo ==========================================
echo OpenMRS Patient Passport Module Installer
echo ==========================================
echo.

REM Check if Java is installed
echo [INFO] Checking Java installation...
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Java is not installed. Please install Java 11 or higher.
    pause
    exit /b 1
)
echo [SUCCESS] Java check passed

REM Check if Maven is installed
echo [INFO] Checking Maven installation...
mvn -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Maven is not installed. Please install Maven 3.6 or higher.
    pause
    exit /b 1
)
echo [SUCCESS] Maven check passed

REM Get OpenMRS path
if "%OPENMRS_PATH%"=="" (
    set /p OPENMRS_PATH="Enter the path to your OpenMRS instance directory: "
)

if not exist "%OPENMRS_PATH%" (
    echo [ERROR] OpenMRS directory does not exist: %OPENMRS_PATH%
    pause
    exit /b 1
)
echo [SUCCESS] Using OpenMRS path: %OPENMRS_PATH%

REM Build the module
echo [INFO] Building Patient Passport module...
if not exist "pom.xml" (
    echo [ERROR] pom.xml not found. Please run this script from the module root directory.
    pause
    exit /b 1
)

mvn clean package -DskipTests
if %errorlevel% neq 0 (
    echo [ERROR] Module build failed.
    pause
    exit /b 1
)

if not exist "omod\target\%MODULE_NAME%-%MODULE_VERSION%.omod" (
    echo [ERROR] Module build failed. OMOD file not found.
    pause
    exit /b 1
)
echo [SUCCESS] Module built successfully

REM Choose installation method
echo.
echo Choose installation method:
echo 1. Using OpenMRS SDK (recommended)
echo 2. Manual installation
set /p INSTALL_METHOD="Enter your choice (1 or 2): "

if "%INSTALL_METHOD%"=="1" (
    echo [INFO] Installing module using OpenMRS SDK...
    cd /d "%OPENMRS_PATH%"
    mvn openmrs-sdk:install-module -DartifactId=%MODULE_NAME% -Dversion=%MODULE_VERSION%
    if %errorlevel% neq 0 (
        echo [ERROR] SDK installation failed.
        pause
        exit /b 1
    )
    echo [SUCCESS] Module installed successfully
) else if "%INSTALL_METHOD%"=="2" (
    echo [INFO] Installing module manually...
    set MODULE_DIR=%OPENMRS_PATH%\modules
    if not exist "%MODULE_DIR%" mkdir "%MODULE_DIR%"
    copy "omod\target\%MODULE_NAME%-%MODULE_VERSION%.omod" "%MODULE_DIR%\"
    echo [SUCCESS] Module file copied to modules directory
) else (
    echo [ERROR] Invalid choice. Exiting.
    pause
    exit /b 1
)

REM Create configuration SQL script
echo [INFO] Creating configuration SQL script...
(
echo -- Patient Passport Module Configuration
echo INSERT INTO global_property ^(property, property_value, description^) VALUES
echo ('patientpassport.api.baseUrl', '%API_BASE_URL%', 'Base URL for Patient Passport API'^),
echo ('patientpassport.frontend.url', '%FRONTEND_URL%', 'Frontend URL for Patient Passport'^),
echo ('patientpassport.api.timeout', '30000', 'API timeout in milliseconds'^),
echo ('patientpassport.enable.otp', '%OTP_ENABLED%', 'Enable OTP verification for passport access'^),
echo ('patientpassport.audit.logging', '%AUDIT_LOGGING%', 'Enable audit logging for passport access'^),
echo ('patientpassport.sync.interval', '3600', 'Sync interval in seconds'^),
echo ('patientpassport.max.retry.attempts', '3', 'Maximum retry attempts for API calls'^),
echo ('patientpassport.emergency.access.duration', '3600', 'Emergency access duration in seconds'^)
echo ON DUPLICATE KEY UPDATE property_value = VALUES^(property_value^);
) > configure_properties.sql

echo [SUCCESS] Configuration SQL script created: configure_properties.sql

REM Create roles SQL script
echo [INFO] Creating roles SQL script...
(
echo -- Create privileges
echo INSERT INTO privilege ^(privilege, description^) VALUES
echo ('Patient Passport: View Patient Passport', 'View patient passport data'^),
echo ('Patient Passport: Update Patient Passport', 'Update patient passport data'^),
echo ('Patient Passport: Access Emergency Override', 'Access patient passport in emergency situations'^)
echo ON DUPLICATE KEY UPDATE description = VALUES^(description^);
echo.
echo -- Create roles
echo INSERT INTO role ^(role, description^) VALUES
echo ('Patient Passport User', 'Basic user with passport viewing rights'^),
echo ('Patient Passport Manager', 'User with passport management rights'^),
echo ('Patient Passport Emergency', 'Emergency access role'^)
echo ON DUPLICATE KEY UPDATE description = VALUES^(description^);
echo.
echo -- Assign privileges to roles
echo INSERT INTO role_privilege ^(role, privilege^) VALUES
echo ('Patient Passport User', 'Patient Passport: View Patient Passport'^),
echo ('Patient Passport Manager', 'Patient Passport: View Patient Passport'^),
echo ('Patient Passport Manager', 'Patient Passport: Update Patient Passport'^),
echo ('Patient Passport Emergency', 'Patient Passport: View Patient Passport'^),
echo ('Patient Passport Emergency', 'Patient Passport: Access Emergency Override'^)
echo ON DUPLICATE KEY UPDATE role = VALUES^(role^);
) > create_roles.sql

echo [SUCCESS] Role creation SQL script created: create_roles.sql

REM Test installation
echo [INFO] Testing installation...
if exist "%OPENMRS_PATH%\modules\%MODULE_NAME%-%MODULE_VERSION%.omod" (
    echo [SUCCESS] Module file found in modules directory
) else (
    echo [ERROR] Module file not found in modules directory
    pause
    exit /b 1
)

REM Create uninstall script
echo [INFO] Creating uninstall script...
(
echo @echo off
echo REM Uninstall Patient Passport Module
echo echo Uninstalling Patient Passport Module...
echo.
echo REM Remove module file
echo del /f /q "%OPENMRS_PATH%\modules\patientpassport-1.0.0.omod"
echo.
echo echo To remove global properties, run the following SQL:
echo echo DELETE FROM global_property WHERE property LIKE 'patientpassport.%%';
echo.
echo echo To remove roles and privileges, run the following SQL:
echo echo DELETE FROM role_privilege WHERE role LIKE 'Patient Passport%%';
echo echo DELETE FROM role WHERE role LIKE 'Patient Passport%%';
echo echo DELETE FROM privilege WHERE privilege LIKE 'Patient Passport%%';
echo.
echo echo Uninstall completed. Please restart OpenMRS.
echo pause
) > uninstall.bat

echo [SUCCESS] Uninstall script created: uninstall.bat

REM Display post-installation instructions
echo.
echo [INFO] Post-installation instructions:
echo.
echo 1. Start/Restart your OpenMRS instance
echo 2. Run the SQL scripts created:
echo    - configure_properties.sql ^(for global properties^)
echo    - create_roles.sql ^(for user roles^)
echo 3. Assign Patient Passport roles to appropriate users
echo 4. Test the module by accessing:
echo    http://your-openmrs-instance/openmrs/module/patientpassport/manage.htm
echo.
echo 5. Configure additional settings as needed:
echo    - API endpoints
echo    - OTP settings
echo    - Audit logging preferences
echo.
echo For detailed configuration, see DEPLOYMENT_GUIDE.md
echo.
echo [SUCCESS] Installation completed successfully!
echo.
pause
