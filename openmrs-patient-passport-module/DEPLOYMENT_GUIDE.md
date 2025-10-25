# OpenMRS Patient Passport Module - Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Patient Passport module to multiple OpenMRS instances. The module integrates your existing Patient Passport system (https://patient-passpo.netlify.app/) with OpenMRS installations.

## Prerequisites

### System Requirements
- OpenMRS 2.5.0 or higher
- Java 11 or higher
- Maven 3.6 or higher
- MySQL 5.7+ or PostgreSQL 9.6+
- Access to your Patient Passport API (https://patientpassport-api.azurewebsites.net/api)

### Network Requirements
- OpenMRS instances must have internet access to reach the Patient Passport API
- Firewall rules should allow HTTPS traffic to `patientpassport-api.azurewebsites.net`
- If using OTP functionality, ensure SMS/email services are accessible

## Installation Methods

### Method 1: Using OpenMRS SDK (Recommended)

1. **Install OpenMRS SDK** (if not already installed):
   ```bash
   mvn org.openmrs.maven.plugins:openmrs-sdk-maven-plugin:setup-sdk
   ```

2. **Navigate to your OpenMRS instance directory**:
   ```bash
   cd /path/to/your/openmrs/instance
   ```

3. **Install the module**:
   ```bash
   mvn openmrs-sdk:install-module -DartifactId=patientpassport -Dversion=1.0.0
   ```

4. **Restart OpenMRS**:
   ```bash
   mvn openmrs-sdk:run
   ```

### Method 2: Manual Installation

1. **Build the module**:
   ```bash
   cd openmrs-patient-passport-module
   mvn clean package
   ```

2. **Copy the OMOD file**:
   ```bash
   cp omod/target/patientpassport-1.0.0.omod /path/to/openmrs/modules/
   ```

3. **Restart OpenMRS**

### Method 3: Using OpenMRS Admin Interface

1. **Access OpenMRS Admin**:
   - Navigate to `http://your-openmrs-instance/openmrs/admin`
   - Login with admin credentials

2. **Upload Module**:
   - Go to "Manage Modules"
   - Click "Upload Module"
   - Select the `patientpassport-1.0.0.omod` file
   - Click "Upload"

3. **Start Module**:
   - Find "Patient Passport Module" in the module list
   - Click "Start"

## Configuration

### 1. Global Properties Configuration

After installation, configure the following global properties in OpenMRS:

#### Required Configuration
```properties
# API Configuration
patientpassport.api.baseUrl=https://patientpassport-api.azurewebsites.net/api
patientpassport.frontend.url=https://patient-passpo.netlify.app/
patientpassport.api.timeout=30000

# Security Configuration
patientpassport.enable.otp=true
patientpassport.audit.logging=true

# Sync Configuration
patientpassport.sync.interval=3600
patientpassport.max.retry.attempts=3
patientpassport.emergency.access.duration=3600
```

#### Optional Configuration
```properties
# Advanced Settings
patientpassport.cache.enabled=true
patientpassport.cache.ttl=1800
patientpassport.rate.limit.enabled=true
patientpassport.rate.limit.requests=100
patientpassport.rate.limit.window=3600
```

### 2. Database Configuration

The module automatically creates the following tables:
- `patientpassport_access_log` - Logs all passport access attempts
- `patientpassport_config` - Stores module configuration
- `patientpassport_sync_status` - Tracks sync status for patients
- `patientpassport_mapping` - Maps OpenMRS patients to passport IDs

### 3. User Roles and Privileges

The module creates the following roles and privileges:

#### Privileges
- `Patient Passport: View Patient Passport`
- `Patient Passport: Update Patient Passport`
- `Patient Passport: Access Emergency Override`

#### Roles
- `Patient Passport User` - Basic viewing rights
- `Patient Passport Manager` - Management rights
- `Patient Passport Emergency` - Emergency access rights

### 4. Assign Roles to Users

1. **Access User Management**:
   - Go to `http://your-openmrs-instance/openmrs/admin/users/user.list`

2. **Edit User**:
   - Select the user you want to assign roles to
   - Click "Edit User"

3. **Assign Roles**:
   - Add appropriate Patient Passport roles
   - Save changes

## Multi-Instance Deployment

### Scenario 1: Hospital Network Deployment

For deploying across multiple hospitals in a network:

1. **Central Configuration**:
   ```bash
   # Hospital A
   patientpassport.api.baseUrl=https://patientpassport-api.azurewebsites.net/api
   patientpassport.hospital.id=HOSPITAL_A
   
   # Hospital B
   patientpassport.api.baseUrl=https://patientpassport-api.azurewebsites.net/api
   patientpassport.hospital.id=HOSPITAL_B
   ```

2. **Patient Mapping**:
   - Each hospital will have its own patient IDs
   - The module maps these to universal passport IDs
   - Patients can be accessed across hospitals using their passport

### Scenario 2: Regional Deployment

For regional health systems:

1. **Regional Configuration**:
   ```properties
   # Regional Instance 1
   patientpassport.api.baseUrl=https://patientpassport-api.azurewebsites.net/api
   patientpassport.region.id=REGION_NORTH
   
   # Regional Instance 2
   patientpassport.api.baseUrl=https://patientpassport-api.azurewebsites.net/api
   patientpassport.region.id=REGION_SOUTH
   ```

2. **Data Synchronization**:
   - Patients are synchronized across regions
   - Access logs are maintained per region
   - Emergency access works across all regions

## API Integration

### 1. Authentication Setup

The module integrates with your existing Patient Passport API. Ensure:

1. **API Endpoints are accessible** from OpenMRS instances
2. **Authentication tokens** are properly configured
3. **Rate limiting** is respected

### 2. Endpoint Mapping

| OpenMRS Module Endpoint | Patient Passport API Endpoint |
|------------------------|-------------------------------|
| `/module/patientpassport/view` | `/api/patients/passport/{patientId}` |
| `/module/patientpassport/requestOtp` | `/api/passport-access/request-otp` |
| `/module/patientpassport/verifyOtp` | `/api/passport-access/verify-otp` |
| `/module/patientpassport/emergencyAccess` | `/api/passport-access/emergency` |

### 3. Data Synchronization

The module supports automatic synchronization:

1. **Patient Data Sync**:
   - Syncs patient demographics
   - Updates medical information
   - Maintains version control

2. **Access Logging**:
   - Logs all access attempts
   - Tracks OTP verifications
   - Monitors emergency access

## Testing the Installation

### 1. Basic Functionality Test

1. **Access Module Management**:
   - Navigate to `http://your-openmrs-instance/openmrs/module/patientpassport/manage.htm`
   - Verify configuration is loaded

2. **Test API Connection**:
   - Click "Test API Connection"
   - Verify successful connection to Patient Passport API

3. **Search for Patient**:
   - Use the search functionality
   - Verify patient lookup works

### 2. Passport Access Test

1. **Find a Patient**:
   - Search for an existing patient
   - Click "View Passport"

2. **Test OTP Flow** (if enabled):
   - Click "Request OTP Access"
   - Enter reason for access
   - Verify OTP is sent
   - Enter OTP code
   - Verify passport data loads

3. **Test Emergency Access**:
   - Click "Emergency Access"
   - Enter justification
   - Verify emergency access works

### 3. Integration Test

1. **Create Test Patient**:
   - Create a patient in OpenMRS
   - Sync with Patient Passport system
   - Verify passport is created

2. **Cross-Instance Test**:
   - Access same patient from different OpenMRS instance
   - Verify data consistency

## Troubleshooting

### Common Issues

#### 1. Module Not Loading
**Symptoms**: Module doesn't appear in OpenMRS
**Solutions**:
- Check OpenMRS logs for errors
- Verify module file is in correct location
- Check Java version compatibility

#### 2. API Connection Failed
**Symptoms**: "API call failed" errors
**Solutions**:
- Verify network connectivity
- Check API URL configuration
- Verify API is running and accessible

#### 3. OTP Not Working
**Symptoms**: OTP requests fail
**Solutions**:
- Check OTP service configuration
- Verify patient contact information
- Check SMS/email service status

#### 4. Permission Denied
**Symptoms**: "Access denied" errors
**Solutions**:
- Verify user has correct privileges
- Check role assignments
- Verify patient permissions

### Log Analysis

#### 1. OpenMRS Logs
```bash
# Check OpenMRS logs
tail -f /path/to/openmrs/logs/openmrs.log | grep patientpassport
```

#### 2. Module Logs
```bash
# Check module-specific logs
tail -f /path/to/openmrs/logs/patientpassport.log
```

#### 3. Database Logs
```sql
-- Check access logs
SELECT * FROM patientpassport_access_log ORDER BY access_timestamp DESC LIMIT 10;

-- Check sync status
SELECT * FROM patientpassport_sync_status WHERE sync_status = 'ERROR';
```

## Security Considerations

### 1. Network Security
- Use HTTPS for all API communications
- Implement proper firewall rules
- Use VPN for sensitive deployments

### 2. Access Control
- Regularly audit user roles and privileges
- Monitor access logs for suspicious activity
- Implement session timeouts

### 3. Data Protection
- Encrypt sensitive data in transit
- Implement proper backup procedures
- Follow HIPAA/GDPR compliance requirements

## Maintenance

### 1. Regular Updates
- Monitor for module updates
- Test updates in staging environment
- Plan maintenance windows

### 2. Performance Monitoring
- Monitor API response times
- Check database performance
- Monitor memory usage

### 3. Backup Procedures
- Regular database backups
- Configuration backups
- Module file backups

## Support and Documentation

### 1. Module Documentation
- API documentation: `/module/patientpassport/api-docs`
- User guide: Available in module interface
- Configuration guide: This document

### 2. Support Channels
- GitHub Issues: For bug reports and feature requests
- Email Support: For enterprise support
- Community Forum: For general questions

### 3. Version Compatibility
- OpenMRS 2.5.0+ (tested)
- Java 11+ (required)
- MySQL 5.7+ / PostgreSQL 9.6+ (tested)

## Conclusion

This deployment guide provides comprehensive instructions for installing and configuring the Patient Passport module across multiple OpenMRS instances. The module seamlessly integrates your existing Patient Passport system with OpenMRS, enabling secure access to patient medical records across different healthcare facilities.

For additional support or customization requirements, please refer to the module documentation or contact the development team.
