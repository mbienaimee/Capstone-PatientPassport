# Patient Passport OpenMRS Module - Deployment Guide

## Issues Fixed

✅ **Fixed the casting error**: Removed the incorrect extension point registration that was causing `PatientPassportPageController cannot be cast to org.openmrs.module.Extension`

✅ **Updated controllers**: Enhanced the PatientPassportPageController to properly handle configuration and patient context

✅ **Module built successfully**: The module now compiles without errors

## Deployment Steps

### 1. Build the Module (Already Done)
```bash
cd openmrs-modules/patientpassport
mvn clean package -DskipTests
```

### 2. Deploy to OpenMRS

#### Option A: Using OpenMRS SDK (Recommended)
```bash
# Navigate to your OpenMRS SDK project directory
cd /path/to/your/openmrs-sdk/project

# Install the module
mvn openmrs-sdk:install -DartifactId=patientpassport -Dversion=1.0.0 -DgroupId=org.openmrs.module

# Or if you have the .omod file locally:
mvn openmrs-sdk:install -Dfile=path/to/patientpassport-1.0.0.omod
```

#### Option B: Manual Installation
1. Copy the `.omod` file to your OpenMRS modules directory:
   ```bash
   cp openmrs-modules/patientpassport/omod/target/patientpassport-1.0.0.omod /path/to/openmrs/modules/
   ```

2. Restart OpenMRS server

#### Option C: Using OpenMRS Admin Interface
1. Log into OpenMRS as an administrator
2. Go to Administration → Manage Modules
3. Upload the `patientpassport-1.0.0.omod` file
4. Click "Install" and restart the server

### 3. Configure the Module

After installation, configure the module settings:

1. **Access Admin Settings**:
   - Go to Administration → Patient Passport Settings
   - Or navigate to: `http://your-openmrs-url/module/patientpassport/admin.page`

2. **Configure URLs**:
   - **Frontend URL**: `https://jade-pothos-e432d0.netlify.app` (or your deployed frontend)
   - **Backend URL**: `https://capstone-patientpassport.onrender.com/api` (or your deployed backend)
   - **Enable Patient Context**: `true` (to pass patient information)
   - **Iframe Height**: `90vh` (adjust as needed)

### 4. Access the Patient Passport

#### Main Access Points:

1. **Homepage Link**:
   - Look for "Patient Passport" link on the main OpenMRS homepage
   - Direct URL: `http://your-openmrs-url/module/patientpassport/patientPassport.page`

2. **Patient Dashboard**:
   - When viewing a patient, the Patient Passport will appear in the second column
   - It will automatically pass the patient context to the frontend

3. **Administration**:
   - Access settings at: `http://your-openmrs-url/module/patientpassport/admin.page`

### 5. Troubleshooting

#### If the module doesn't start:
1. Check OpenMRS logs for errors
2. Ensure all dependencies are met (OpenMRS 2.7.0+)
3. Verify the .omod file is in the correct modules directory

#### If Patient Passport doesn't load:
1. Check the frontend URL is accessible
2. Verify CORS settings on your frontend/backend
3. Check browser console for iframe errors

#### If patient context isn't working:
1. Verify "Enable Patient Context" is set to true
2. Check that the patient UUID is being passed correctly
3. Ensure your frontend can handle the patient parameter

### 6. Module Features

✅ **Homepage Integration**: Direct access from OpenMRS homepage
✅ **Patient Dashboard Integration**: Embedded in patient view
✅ **Administration Interface**: Configure settings
✅ **Patient Context**: Automatic patient information passing
✅ **Responsive Design**: Works on desktop and mobile
✅ **Security**: Proper privilege management

### 7. URLs and Endpoints

- **Main Page**: `/module/patientpassport/patientPassport.page`
- **Admin Page**: `/module/patientpassport/admin.page`
- **Patient Context**: `/module/patientpassport/patientPassport.page?patientId={uuid}`

### 8. Privileges Required

- **View Patient Passport**: Required to access the main interface
- **Access Patient Passport**: Required for administration settings

Make sure users have these privileges assigned to their roles.

## Next Steps

1. Deploy the module using one of the methods above
2. Configure the URLs in the admin interface
3. Test access from both homepage and patient dashboard
4. Verify patient context is being passed correctly

The module should now work without the casting error and provide seamless integration with your Patient Passport system!
