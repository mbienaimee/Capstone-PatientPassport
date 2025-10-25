# OpenMRS Patient Passport Module

## Overview

The Patient Passport Module is an OpenMRS integration module that connects OpenMRS instances with the Patient Passport system (https://patient-passpo.netlify.app/). This module enables healthcare providers to access comprehensive patient medical records across multiple healthcare facilities through a secure, unified interface.

## Features

### Core Functionality
- **Patient Passport Access**: View comprehensive patient medical records from external Patient Passport system
- **OTP Verification**: Secure access control with One-Time Password verification
- **Emergency Access**: Emergency override functionality for critical situations
- **Multi-Instance Support**: Deploy across multiple OpenMRS instances with unified patient data
- **Audit Logging**: Complete audit trail of all passport access attempts
- **Data Synchronization**: Automatic synchronization of patient data between systems

### Security Features
- **Role-based Access Control**: Granular permissions for different user types
- **OTP Authentication**: Two-factor authentication for sensitive data access
- **Emergency Override**: Controlled emergency access with justification tracking
- **Audit Trail**: Comprehensive logging of all access attempts and modifications
- **IP Tracking**: Monitor access patterns and detect suspicious activity

### Integration Features
- **REST API Integration**: Seamless integration with Patient Passport API
- **Real-time Data**: Live access to patient passport data
- **Cross-Facility Access**: Access patient records from any connected OpenMRS instance
- **Unified Interface**: Consistent user experience across all installations

## Architecture

### System Components
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   OpenMRS       │    │  Patient Passport │    │   External      │
│   Instance A    │◄──►│      Module       │◄──►│   API           │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
┌─────────────────┐              │              ┌─────────────────┐
│   OpenMRS       │              │              │   Frontend      │
│   Instance B    │◄─────────────┘              │   Application   │
└─────────────────┘                             └─────────────────┘
```

### Data Flow
1. **User Authentication**: User logs into OpenMRS with appropriate privileges
2. **Patient Selection**: User selects patient to view passport
3. **Access Request**: Module requests access from Patient Passport API
4. **OTP Verification**: If enabled, OTP is sent and verified
5. **Data Retrieval**: Patient passport data is fetched and displayed
6. **Audit Logging**: All access attempts are logged for compliance

## Installation

### Prerequisites
- OpenMRS 2.5.0 or higher
- Java 11 or higher
- Maven 3.6 or higher
- MySQL 5.7+ or PostgreSQL 9.6+
- Network access to Patient Passport API

### Quick Installation
```bash
# Using OpenMRS SDK
mvn openmrs-sdk:install-module -DartifactId=patientpassport -Dversion=1.0.0

# Manual installation
mvn clean package
cp omod/target/patientpassport-1.0.0.omod /path/to/openmrs/modules/
```

## Configuration

### Global Properties
```properties
# API Configuration
patientpassport.api.baseUrl=https://patientpassport-api.azurewebsites.net/api
patientpassport.frontend.url=https://patient-passpo.netlify.app/
patientpassport.api.timeout=30000

# Security Configuration
patientpassport.enable.otp=true
patientpassport.audit.logging=true
```

### User Roles
- **Patient Passport User**: Basic viewing rights
- **Patient Passport Manager**: Management and update rights
- **Patient Passport Emergency**: Emergency access rights

## Usage

### Accessing Patient Passport
1. Navigate to Patient Dashboard in OpenMRS
2. Click "View Patient Passport" (if user has privileges)
3. Complete OTP verification (if enabled)
4. View comprehensive patient medical records

### Emergency Access
1. Click "Emergency Access" button
2. Provide detailed justification
3. Access patient passport immediately
4. All access is logged and monitored

### Management Interface
1. Navigate to Administration → Patient Passport Management
2. Configure module settings
3. Monitor access logs
4. Manage user permissions

## API Endpoints

### REST Endpoints
- `GET /module/webservices/rest/v1/patientpassport/{patientId}` - Get patient passport
- `POST /module/webservices/rest/v1/patientpassport/requestOtp` - Request OTP
- `POST /module/webservices/rest/v1/patientpassport/verifyOtp` - Verify OTP
- `POST /module/webservices/rest/v1/patientpassport/emergencyAccess` - Emergency access

### Web Interface
- `/module/patientpassport/view.htm` - Patient passport view
- `/module/patientpassport/manage.htm` - Module management
- `/module/patientpassport/accessHistory.htm` - Access history

## Database Schema

### Tables Created
- `patientpassport_access_log` - Access logging
- `patientpassport_config` - Module configuration
- `patientpassport_sync_status` - Sync status tracking
- `patientpassport_mapping` - Patient ID mapping

### Key Fields
```sql
-- Access Log
access_log_id, patient_id, user_id, access_type, access_reason, 
otp_verified, emergency_override, ip_address, access_timestamp

-- Sync Status
sync_id, patient_id, last_sync_timestamp, sync_status, sync_error, passport_version

-- Configuration
config_id, config_key, config_value, description
```

## Security Model

### Access Control Levels
1. **View Access**: Read-only access to patient passport
2. **Update Access**: Modify patient passport data
3. **Emergency Access**: Override normal restrictions for emergencies

### Authentication Methods
1. **Standard Authentication**: OpenMRS user authentication
2. **OTP Verification**: Additional layer for sensitive data
3. **Emergency Override**: Justification-based emergency access

### Audit Requirements
- All access attempts logged with timestamp
- User identification and IP address tracking
- Access type and reason documentation
- Emergency access justification recording

## Multi-Instance Deployment

### Hospital Network Setup
```properties
# Hospital A Configuration
patientpassport.hospital.id=HOSPITAL_A
patientpassport.api.baseUrl=https://patientpassport-api.azurewebsites.net/api

# Hospital B Configuration  
patientpassport.hospital.id=HOSPITAL_B
patientpassport.api.baseUrl=https://patientpassport-api.azurewebsites.net/api
```

### Regional Deployment
```properties
# Regional Instance Configuration
patientpassport.region.id=REGION_NORTH
patientpassport.sync.enabled=true
patientpassport.cross.instance.access=true
```

## Troubleshooting

### Common Issues
1. **Module Not Loading**: Check OpenMRS logs and Java version
2. **API Connection Failed**: Verify network connectivity and API URL
3. **OTP Not Working**: Check OTP service configuration
4. **Permission Denied**: Verify user roles and privileges

### Log Locations
- OpenMRS Logs: `/path/to/openmrs/logs/openmrs.log`
- Module Logs: `/path/to/openmrs/logs/patientpassport.log`
- Database Logs: Check `patientpassport_access_log` table

### Debug Mode
```properties
# Enable debug logging
patientpassport.debug.enabled=true
patientpassport.log.level=DEBUG
```

## Performance Considerations

### Optimization Tips
1. **Caching**: Enable response caching for frequently accessed data
2. **Connection Pooling**: Configure appropriate connection pool sizes
3. **Rate Limiting**: Implement rate limiting to prevent API overload
4. **Database Indexing**: Ensure proper database indexes are created

### Monitoring
- API response times
- Database query performance
- Memory usage patterns
- User access patterns

## Compliance and Privacy

### HIPAA Compliance
- All access is logged and auditable
- Data encryption in transit
- Access controls and user authentication
- Regular security assessments

### GDPR Compliance
- Data minimization principles
- User consent tracking
- Right to be forgotten implementation
- Data breach notification procedures

## Support and Maintenance

### Version Compatibility
- OpenMRS 2.5.0+ (tested)
- Java 11+ (required)
- MySQL 5.7+ / PostgreSQL 9.6+ (tested)

### Update Procedures
1. Backup current configuration
2. Test updates in staging environment
3. Deploy during maintenance windows
4. Verify functionality post-update

### Support Channels
- GitHub Issues: Bug reports and feature requests
- Email Support: Enterprise support
- Community Forum: General questions

## License

This module is licensed under the MIT License. See LICENSE file for details.

## Contributing

Contributions are welcome! Please see CONTRIBUTING.md for guidelines.

## Changelog

### Version 1.0.0
- Initial release
- Basic passport access functionality
- OTP verification system
- Emergency access features
- Multi-instance support
- Comprehensive audit logging
