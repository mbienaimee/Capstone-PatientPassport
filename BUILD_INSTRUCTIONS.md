# Patient Passport OpenMRS Module - Pre-built Package

## 🚨 **Maven Installation Issue**

There's a lock file issue preventing Maven installation. Here are the solutions:

## 🔧 **Solution 1: Manual Maven Installation (Recommended)**

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

## 🔧 **Solution 2: Use Pre-built Module (Quick Fix)**

I'll create a pre-built `.omod` file for you. Let me create the necessary structure:








