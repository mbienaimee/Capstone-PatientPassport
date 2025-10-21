# Patient Passport OpenMRS Module - Deployment Guide

## 🚀 Ready for Distribution!

The Patient Passport OpenMRS module is now ready for deployment to any OpenMRS instance. This guide explains how to install and configure it.

## 📦 Distribution Files

The following files are ready for distribution:

1. **`patientpassport-1.0.0.omod`** - Main module file for OpenMRS installation
2. **`patientpassport-1.0.0.zip`** - Complete module package
3. **`patientpassport-omod-1.0.0.jar`** - Alternative JAR format

## 🏥 Installation Instructions

### For OpenMRS Administrators

#### Method 1: Web Interface Installation (Recommended)

1. **Log in to OpenMRS** as an administrator
2. **Go to Administration** → **Manage Modules**
3. **Click "Add or Upgrade Module"**
4. **Upload the file**: `patientpassport-1.0.0.omod`
5. **Click "Upload"**
6. **Start the module** by clicking "Start" next to "Patient Passport Connector"

#### Method 2: File System Installation

1. **Copy the module file** to your OpenMRS modules directory:
   ```bash
   cp patientpassport-1.0.0.omod /path/to/openmrs/modules/
   ```
2. **Restart OpenMRS**
3. **Go to Administration** → **Manage Modules**
4. **Start the module**

### Post-Installation Configuration

1. **Go to Administration** → **Manage Global Properties**
2. **Configure these properties** (optional, defaults are provided):

| Property | Default Value | Description |
|----------|---------------|-------------|
| `patientpassport.frontend.url` | `https://jade-pothos-e432d0.netlify.app` | URL of Patient Passport frontend |
| `patientpassport.backend.url` | `https://capstone-patientpassport.onrender.com/api` | URL of Patient Passport backend API |
| `patientpassport.enable_patient_context` | `true` | Enable patient data passing |
| `patientpassport.iframe_height` | `90vh` | Height of iframe |

## 🎯 Accessing Patient Passport

After installation, users can access Patient Passport in several ways:

### 1. Home Page Access
- **"Patient Passport"** link appears on the OpenMRS home page
- **Requires**: `View Patient Passport` privilege

### 2. Administration Access
- **"Patient Passport Settings"** appears in Administration menu
- **Requires**: `Access Patient Passport` privilege

### 3. Patient Dashboard Access
- **"Patient Passport"** section appears on patient dashboards
- **Requires**: `View Patient Passport` privilege
- **Feature**: Automatically passes patient context

### 4. Direct URL Access
- **Main Page**: `/openmrs/module/patientpassport/patientPassport.page`
- **Admin Page**: `/openmrs/module/patientpassport/admin.page`

## 👥 User Permissions

The module creates two privileges:

1. **`View Patient Passport`** - Allows viewing Patient Passport interface
2. **`Access Patient Passport`** - Allows access to Patient Passport functionality

### Assigning Permissions

1. **Go to Administration** → **Manage Users**
2. **Select a user**
3. **Add the appropriate privileges**:
   - For regular users: `View Patient Passport`
   - For administrators: Both privileges

## 🔧 Features

### Core Features
- ✅ **Seamless iframe integration** with Patient Passport frontend
- ✅ **Patient context passing** - automatically sends patient data
- ✅ **Responsive design** - works on all devices
- ✅ **Admin configuration** - easy settings management
- ✅ **Role-based access** - secure permission system

### Integration Features
- ✅ **Home page integration** - appears on OpenMRS home page
- ✅ **Administration integration** - appears in admin menu
- ✅ **Patient dashboard integration** - appears on patient pages
- ✅ **Direct URL access** - can be accessed directly

## 🌐 Network Requirements

### Required URLs
- **Frontend**: `https://jade-pothos-e432d0.netlify.app`
- **Backend**: `https://capstone-patientpassport.onrender.com/api`

### Firewall Configuration
Ensure these URLs are accessible from your OpenMRS server:
- **Outbound HTTPS** to Netlify (frontend)
- **Outbound HTTPS** to Render (backend)

## 🚨 Troubleshooting

### Common Issues

#### 1. Module Won't Start
- **Check OpenMRS logs** for errors
- **Verify Java version** (8 or 11 required)
- **Check module file** is not corrupted

#### 2. Patient Passport Links Not Visible
- **Check user privileges** are assigned
- **Verify module is started** (not just loaded)
- **Clear browser cache**

#### 3. Frontend Not Loading
- **Check network connectivity** to frontend URL
- **Verify firewall settings**
- **Test frontend URL** in browser

#### 4. Patient Context Not Working
- **Check global property** `patientpassport.enable_patient_context`
- **Verify patient UUIDs** are being passed
- **Check OpenMRS logs** for errors

### Debug Mode

Enable debug logging by adding to OpenMRS configuration:
```properties
# In openmrs-runtime.properties
log4j.logger.org.openmrs.module.patientpassport=DEBUG
```

## 📋 System Requirements

### OpenMRS Requirements
- **OpenMRS Version**: 2.7.0 or higher
- **Java Version**: 8 or 11 (not compatible with Java 17+)
- **Memory**: Minimum 2GB RAM recommended

### Network Requirements
- **Internet access** for frontend and backend URLs
- **HTTPS support** for secure communication
- **Firewall configuration** to allow outbound connections

## 🔒 Security Considerations

### Data Security
- **All communication** uses HTTPS
- **Patient data** is securely transmitted
- **No sensitive data** is stored in the module

### Access Control
- **Role-based permissions** control access
- **Patient context** only passed when enabled
- **Admin functions** require special privileges

## 📞 Support

### Documentation
- **Module README**: `openmrs-modules/patientpassport/README.md`
- **API Documentation**: `https://capstone-patientpassport.onrender.com/api-docs`

### Getting Help
1. **Check this deployment guide**
2. **Review OpenMRS logs**
3. **Test individual components**
4. **Contact the development team**

## 🎉 Success Indicators

Your installation is working correctly when:
- ✅ **Module starts** without errors
- ✅ **"Patient Passport"** appears on home page
- ✅ **"Patient Passport Settings"** appears in Administration
- ✅ **Patient Passport loads** in iframe
- ✅ **Patient context** is passed correctly
- ✅ **All features** work as expected

---

**Patient Passport OpenMRS Module** - Empowering healthcare through seamless integration and secure medical record management.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
