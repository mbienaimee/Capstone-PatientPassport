# Patient Passport OpenMRS Module - Pre-built Package

## 🎯 **Quick Solution: Pre-built Module**

Since Maven installation is blocked, I'll create a pre-built module structure that you can use directly.

## 📁 **Creating the Module Structure**

Let me create the essential files for the `.omod` module:

```powershell
# Create pre-built module directory
$moduleDir = "openmrs-modules\patient-passport-core\omod\prebuilt"
New-Item -ItemType Directory -Path $moduleDir -Force

# Create the module structure
$moduleFiles = @{
    "META-INF\MANIFEST.MF" = @"
Manifest-Version: 1.0
OpenMRS-Module-Name: patientpassportcore
OpenMRS-Module-Version: 1.0.0
OpenMRS-Module-Description: Patient Passport Core Module
OpenMRS-Module-Author: Patient Passport Team
OpenMRS-Module-Requires: webservices.rest, fhir2
"@
    "config.xml" = Get-Content "openmrs-modules\patient-passport-core\omod\src\main\resources\config.xml" -Raw
    "sql\updates.xml" = Get-Content "openmrs-modules\patient-passport-core\omod\src\main\resources\sql\updates.xml" -Raw
}

# Create the files
foreach ($file in $moduleFiles.Keys) {
    $filePath = Join-Path $moduleDir $file
    $dir = Split-Path $filePath -Parent
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force
    }
    $moduleFiles[$file] | Out-File -FilePath $filePath -Encoding UTF8
}

Write-Host "Pre-built module structure created at: $moduleDir" -ForegroundColor Green
```

## 🚀 **Alternative: Use Docker to Build**

If you have Docker running, we can use a Maven container to build the module:

```bash
# Use Maven Docker container to build
docker run -it --rm -v ${PWD}:/usr/src/mymaven -w /usr/src/mymaven maven:3.9.11-openjdk-17 mvn clean package -f openmrs-modules/patient-passport-core/omod/pom.xml
```

## 📋 **Manual Steps to Get the .omod File**

1. **Download Maven manually**:
   - Go to: https://maven.apache.org/download.cgi
   - Download: `apache-maven-3.9.11-bin.zip`
   - Extract to: `C:\apache-maven-3.9.11`

2. **Add to PATH**:
   - Open System Properties → Environment Variables
   - Add to PATH: `C:\apache-maven-3.9.11\bin`
   - Restart your terminal

3. **Build the module**:
   ```bash
   cd openmrs-modules/patient-passport-core/omod
   mvn clean package
   ```

4. **Find the .omod file**:
   ```
   openmrs-modules/patient-passport-core/omod/target/patientpassportcore-1.0.0.omod
   ```

## 🎯 **What We Need**

The `.omod` file is essentially a ZIP file containing:
- `META-INF/MANIFEST.MF` - Module metadata
- `config.xml` - Module configuration
- `sql/updates.xml` - Database updates
- Compiled Java classes
- Web resources

## ✅ **Next Steps**

1. **Choose one of the solutions above**
2. **Build or create the .omod file**
3. **Deploy it to OpenMRS**
4. **Test the integration**

Would you like me to help you with any of these steps?