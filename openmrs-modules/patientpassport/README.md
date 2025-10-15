# Patient Passport OpenMRS Module

A comprehensive OpenMRS integration module that seamlessly connects your OpenMRS instance with the Patient Passport MERN application, enabling secure and efficient medical record management across multiple hospitals.

## 🌟 Features

- **Seamless Integration**: Direct iframe integration with your deployed Patient Passport application
- **Patient Context**: Automatic patient data passing from OpenMRS to Patient Passport
- **Multi-Hospital Support**: Works across different hospital OpenMRS instances
- **Secure Access**: Role-based access control and secure data transmission
- **Responsive UI**: Modern, responsive interface that works on all devices
- **Easy Configuration**: Simple admin interface for configuration management
- **Real-time Updates**: Live data synchronization between systems

## 🏥 Hospital Deployment

### Prerequisites

- OpenMRS 2.5.0 or higher
- Java 8 or 11 (OpenMRS is not compatible with Java 17+)
- Administrator access to OpenMRS
- Network access to Patient Passport services

### Quick Installation

1. **Download the Module**
   ```bash
   # Download the latest release
   wget https://github.com/your-repo/patientpassport-openmrs/releases/latest/download/patientpassport-1.0.0.omod
   ```

2. **Upload to OpenMRS**
   - Log in to your OpenMRS instance as administrator
   - Go to **Administration** → **Manage Modules**
   - Click **"Add or Upgrade Module"**
   - Upload the `patientpassport-1.0.0.omod` file
   - Click **"Start Module"**

3. **Configure the Module**
   - Go to **Administration** → **Patient Passport Settings**
   - Verify the frontend URL: `https://jade-pothos-e432d0.netlify.app`
   - Verify the backend URL: `https://capstone-patientpassport.onrender.com/api`
   - Adjust settings as needed

4. **Test the Integration**
   - Look for "Patient Passport" on the home page
   - Click to verify the integration works
   - Test patient-specific access from patient dashboards

## 🔧 Configuration

### Global Properties

The module uses the following OpenMRS global properties:

| Property | Default Value | Description |
|----------|---------------|-------------|
| `patientpassport.frontend.url` | `https://jade-pothos-e432d0.netlify.app` | URL of the Patient Passport frontend |
| `patientpassport.backend.url` | `https://capstone-patientpassport.onrender.com/api` | URL of the Patient Passport backend API |
| `patientpassport.enable_patient_context` | `true` | Enable passing patient data to the frontend |
| `patientpassport.iframe_height` | `90vh` | Height of the iframe containing the application |

### Access Control

The module defines the following privileges:

- **View Patient Passport**: Allows viewing the Patient Passport interface
- **Access Patient Passport**: Allows access to Patient Passport functionality

## 🚀 Usage

### For Administrators

1. **Module Management**
   - Access via Administration → Patient Passport Settings
   - Configure URLs and settings
   - Test connections to ensure everything works

2. **User Permissions**
   - Assign appropriate privileges to users
   - Control access to Patient Passport features

### For Healthcare Providers

1. **Home Page Access**
   - Click "Patient Passport" on the OpenMRS home page
   - Access the full Patient Passport application

2. **Patient-Specific Access**
   - Navigate to any patient's dashboard
   - Find the "Patient Passport" section
   - Click to access patient-specific medical records

### For Patients

- Patients can access their medical records through the Patient Passport interface
- All data is securely transmitted and managed
- Real-time updates ensure information is always current

## 🔒 Security Features

- **Secure Communication**: All data transmission uses HTTPS
- **Role-Based Access**: Granular permissions control access
- **Patient Data Protection**: Sensitive data is handled securely
- **Audit Logging**: All access is logged for compliance
- **Session Management**: Secure session handling

## 🛠️ Development

### Building from Source

1. **Prerequisites**
   ```bash
   # Install Java 8 or 11
   # Install Maven
   # Install OpenMRS SDK
   mvn org.openmrs.maven.plugins:openmrs-sdk-maven-plugin:setup-sdk
   ```

2. **Build the Module**
   ```bash
   # Clone the repository
   git clone https://github.com/your-repo/patientpassport-openmrs.git
   cd patientpassport-openmrs
   
   # Build the module
   ./build.sh
   ```

3. **Package for Distribution**
   ```bash
   # Create distribution package
   ./package.sh
   ```

### Project Structure

```
patientpassport/
├── api/                          # API module
│   ├── src/main/java/
│   │   └── org/openmrs/module/patientpassport/
│   │       ├── PatientPassportConfig.java
│   │       └── service/
│   │           └── PatientPassportService.java
│   └── pom.xml
├── omod/                         # OpenMRS module
│   ├── src/main/
│   │   ├── java/                 # Java source code
│   │   ├── resources/            # Module configuration
│   │   └── webapp/               # Web resources
│   │       ├── fragments/        # GSP fragments
│   │       └── pages/            # GSP pages
│   └── pom.xml
├── build.sh                      # Build script
├── deploy.sh                     # Deployment script
├── package.sh                    # Packaging script
└── pom.xml                       # Parent POM
```

## 📚 API Reference

### REST Endpoints

The module provides REST endpoints for integration:

- `GET /rest/v1/patientpassport/patient?patientUuid={uuid}` - Get patient data
- `GET /rest/v1/patientpassport/config` - Get module configuration
- `GET /rest/v1/patientpassport/test-connections` - Test service connections

### Example API Usage

```javascript
// Get patient data
fetch('/openmrs/rest/v1/patientpassport/patient?patientUuid=12345')
  .then(response => response.json())
  .then(data => {
    console.log('Patient data:', data.patient);
    console.log('Frontend URL:', data.frontendUrl);
  });

// Test connections
fetch('/openmrs/rest/v1/patientpassport/test-connections')
  .then(response => response.json())
  .then(data => {
    console.log('Frontend OK:', data.frontendConnection);
    console.log('Backend OK:', data.backendConnection);
  });
```

## 🐛 Troubleshooting

### Common Issues

1. **Module Won't Start**
   - Check OpenMRS logs for errors
   - Ensure Java version is compatible (8 or 11)
   - Verify module file is not corrupted

2. **Frontend Not Loading**
   - Check if the frontend URL is accessible
   - Verify network connectivity
   - Check browser console for errors

3. **Patient Context Not Working**
   - Ensure patient context is enabled in settings
   - Check that patient UUIDs are being passed correctly
   - Verify the frontend can handle patient parameters

4. **Permission Denied**
   - Check user privileges
   - Ensure proper role assignments
   - Verify module permissions

### Debug Mode

Enable debug logging by adding to your OpenMRS configuration:

```properties
# In openmrs-runtime.properties
log4j.logger.org.openmrs.module.patientpassport=DEBUG
```

### Support

For additional support:

1. Check the [documentation](docs/)
2. Review [troubleshooting guide](docs/TROUBLESHOOTING.md)
3. Contact the development team
4. Create an issue in the repository

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Contact

- **Project Repository**: https://github.com/your-repo/patientpassport-openmrs
- **Documentation**: https://github.com/your-repo/patientpassport-openmrs/docs
- **Issues**: https://github.com/your-repo/patientpassport-openmrs/issues

---

**Patient Passport OpenMRS Module** - Empowering healthcare through seamless integration and secure medical record management.


