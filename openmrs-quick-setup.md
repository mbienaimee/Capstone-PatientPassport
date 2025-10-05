# Quick OpenMRS Setup Guide

## Method 1: Direct Download (Easiest)

1. **Download OpenMRS Standalone**
   - Go to: https://openmrs.org/download/
   - Click on "OpenMRS Standalone" 
   - Download the latest version (currently 2.5.0)

2. **Extract and Run**
   - Extract the downloaded ZIP file to a folder (e.g., C:\openmrs)
   - Navigate to the extracted folder
   - Double-click on `openmrs-standalone.jar` OR run: `java -jar openmrs-standalone.jar`

3. **First Time Setup**
   - Follow the setup wizard
   - Choose to install demo data (recommended)
   - Set admin password

4. **Access OpenMRS**
   - URL: http://localhost:8081/openmrs-standalone/
   - Login: admin / Admin123

## Method 2: Using PowerShell Script

1. **Run the setup script**
   ```powershell
   # Right-click on setup-openmrs.ps1 and "Run with PowerShell"
   # OR run in PowerShell as Administrator:
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   .\setup-openmrs.ps1
   ```

## Method 3: Docker (When Docker Desktop is running)

1. **Start Docker Desktop**
   - Launch Docker Desktop from Start menu
   - Wait for it to start completely

2. **Run OpenMRS with Docker**
   ```bash
   docker-compose -f openmrs-docker-compose.yml up -d
   ```

3. **Access OpenMRS**
   - URL: http://localhost:8080/openmrs
   - Login: admin / Admin123

## Method 4: Using Chocolatey (If you have it installed)

```powershell
# Install OpenMRS via Chocolatey
choco install openmrs-standalone
```

## Troubleshooting

### Java Issues
- Ensure Java 8+ is installed: `java -version`
- If Java is not installed, download from: https://adoptium.net/

### Port Issues
- If port 8080/8081 is busy, OpenMRS will use the next available port
- Check the console output for the actual URL

### Memory Issues
- If you get memory errors, run with more memory:
  ```bash
  java -Xmx2g -jar openmrs-standalone.jar
  ```

### Firewall Issues
- Windows Firewall might block the connection
- Allow Java through Windows Firewall when prompted

## Next Steps After Installation

1. **Install FHIR Module**
   - Go to Administration > Manage Modules
   - Install FHIR Module for API access

2. **Configure API Access**
   - Go to Administration > Manage Modules > FHIR
   - Enable REST API
   - Configure authentication

3. **Test API Endpoints**
   ```bash
   # Test system info
   curl http://localhost:8081/openmrs-standalone/ws/rest/v1/systeminformation
   
   # Test FHIR endpoint
   curl http://localhost:8081/openmrs-standalone/ws/fhir2/R4/Patient
   ```

4. **Integration with Your Project**
   - Update your backend FHIR endpoints to point to OpenMRS
   - Test patient data exchange
   - Deploy your custom modules

## Useful URLs After Setup

- **Main Interface**: http://localhost:8081/openmrs-standalone/
- **REST API**: http://localhost:8081/openmrs-standalone/ws/rest/v1/
- **FHIR API**: http://localhost:8081/openmrs-standalone/ws/fhir2/R4/
- **Admin Panel**: http://localhost:8081/openmrs-standalone/admin/

## Default Credentials

- **Username**: admin
- **Password**: Admin123

**Important**: Change the default password after first login!
