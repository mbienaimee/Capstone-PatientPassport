# OpenMRS Patient Passport Module - Upload Guide

## 🎯 Module Ready for Upload!

Your Patient Passport module has been successfully built and is ready for upload to OpenMRS.

### 📦 Module File Location
```
openmrs-patient-passport-module/target/patientpassport-1.0.0.omod
```

## 🚀 Upload Methods

### Method 1: OpenMRS Admin Interface (Recommended)

1. **Access OpenMRS Admin**:
   - Open your browser and go to: `http://localhost:8080/openmrs/admin`
   - Login with your admin credentials

2. **Navigate to Module Management**:
   - Click on "Manage Modules" in the admin interface
   - You should see a list of currently installed modules

3. **Upload the Module**:
   - Click "Upload Module" button
   - Browse and select the file: `patientpassport-1.0.0.omod`
   - Click "Upload"

4. **Start the Module**:
   - After upload, find "Patient Passport Module" in the module list
   - Click "Start" to activate the module

### Method 2: File System Upload

1. **Locate OpenMRS Modules Directory**:
   - Navigate to your OpenMRS installation directory
   - Go to the `modules` folder (usually `openmrs/modules/`)

2. **Copy Module File**:
   - Copy `patientpassport-1.0.0.omod` to the modules directory
   - Restart OpenMRS server

3. **Activate Module**:
   - Go to OpenMRS admin interface
   - Navigate to "Manage Modules"
   - Find "Patient Passport Module" and click "Start"

### Method 3: Using OpenMRS SDK

If you have OpenMRS SDK installed:

```bash
# Navigate to your OpenMRS instance directory
cd /path/to/your/openmrs/instance

# Deploy the module
mvn openmrs-sdk:deploy -DartifactId=patientpassport -Dversion=1.0.0 -DgroupId=org.openmrs.module
```

## ⚙️ Post-Upload Configuration

### 1. Configure Global Properties

After uploading, configure these global properties in OpenMRS:

```properties
# API Configuration
patientpassport.api.baseUrl=https://patientpassport-api.azurewebsites.net/api
patientpassport.frontend.url=https://patient-passpo.netlify.app/
patientpassport.api.timeout=30000

# Security Configuration
patientpassport.enable.otp=true
patientpassport.audit.logging=true
```

**To set these properties:**
1. Go to OpenMRS Admin → "System Administration" → "Global Properties"
2. Add each property with its value
3. Save changes

### 2. Create User Roles

The module creates these roles automatically:
- **Patient Passport User**: Basic viewing rights
- **Patient Passport Manager**: Management rights
- **Patient Passport Emergency**: Emergency access rights

### 3. Assign Roles to Users

1. Go to "System Administration" → "Manage Users"
2. Select a user to edit
3. Add appropriate Patient Passport roles
4. Save changes

## 🧪 Testing the Module

### 1. Access Module Management
- Navigate to: `http://localhost:8080/openmrs/module/patientpassport/manage.htm`
- You should see the Patient Passport management interface

### 2. Test Patient Passport Access
- Go to any patient dashboard
- Look for "Patient Passport" option (if user has appropriate privileges)
- Test the OTP verification flow

### 3. Verify API Integration
- In the management interface, click "Test API Connection"
- Verify connection to your Patient Passport API

## 🔧 Troubleshooting

### Module Not Appearing
- Check OpenMRS logs for errors
- Verify the OMOD file is in the correct location
- Restart OpenMRS server

### Permission Denied Errors
- Ensure user has appropriate Patient Passport roles
- Check global properties are configured correctly

### API Connection Issues
- Verify network connectivity to `patientpassport-api.azurewebsites.net`
- Check API URL configuration in global properties

## 📱 Module Features

Once uploaded and configured, your module provides:

✅ **Patient Passport Viewing** - Access comprehensive patient medical records  
✅ **OTP Verification** - Secure two-factor authentication  
✅ **Emergency Access** - Controlled emergency override functionality  
✅ **Audit Logging** - Complete access trail logging  
✅ **Multi-Instance Support** - Deploy across multiple OpenMRS instances  
✅ **Management Interface** - Easy configuration and monitoring  

## 🎉 Success!

Your Patient Passport module is now ready to be uploaded to OpenMRS! The module will integrate seamlessly with your existing Patient Passport system at https://patient-passpo.netlify.app/ and enable healthcare providers to access comprehensive patient medical records across multiple facilities.

### Next Steps:
1. Upload the module using one of the methods above
2. Configure the global properties
3. Assign roles to users
4. Test the functionality
5. Deploy to additional OpenMRS instances as needed

The module is designed for multi-instance deployment, so you can easily deploy it across multiple OpenMRS installations in your healthcare network.
