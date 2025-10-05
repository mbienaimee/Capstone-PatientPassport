# OpenMRS Local Setup Guide

## Option 1: OpenMRS Standalone (Recommended for Quick Start)

### Prerequisites
- Java 8 or higher installed on your system
- At least 2GB RAM available
- 1GB free disk space

### Steps:

1. **Download OpenMRS Standalone**
   ```bash
   # Create a directory for OpenMRS
   mkdir openmrs-local
   cd openmrs-local
   
   # Download the latest standalone version
   # Visit: https://openmrs.org/download/
   # Download: openmrs-standalone-2.5.0.zip (or latest version)
   ```

2. **Extract and Run**
   ```bash
   # Extract the downloaded file
   unzip openmrs-standalone-*.zip
   
   # Navigate to the extracted folder
   cd openmrs-standalone
   
   # Run OpenMRS
   java -jar openmrs-standalone.jar
   ```

3. **Initial Setup**
   - Follow the setup wizard
   - Choose to install demo data (recommended for testing)
   - Set admin password

4. **Access OpenMRS**
   - URL: http://localhost:8081/openmrs-standalone/
   - Default credentials: admin / Admin123

## Option 2: Docker Setup (For Development)

### Prerequisites
- Docker and Docker Compose installed
- Git

### Steps:

1. **Clone OpenMRS Platform**
   ```bash
   git clone https://github.com/openmrs/openmrs-core.git
   cd openmrs-core
   ```

2. **Run with Docker Compose**
   ```bash
   # Start MySQL and OpenMRS
   docker-compose up -d
   
   # Check logs
   docker-compose logs -f
   ```

3. **Access OpenMRS**
   - URL: http://localhost:8080/openmrs
   - Default credentials: admin / Admin123

## Option 3: Manual Setup (For Custom Development)

### Prerequisites
- Java 8+
- MySQL 5.7+ or PostgreSQL 9.6+
- Tomcat 8.5+ or Jetty
- Maven 3.6+

### Steps:

1. **Database Setup**
   ```sql
   CREATE DATABASE openmrs;
   CREATE USER 'openmrs'@'localhost' IDENTIFIED BY 'openmrs';
   GRANT ALL PRIVILEGES ON openmrs.* TO 'openmrs'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. **Build OpenMRS**
   ```bash
   git clone https://github.com/openmrs/openmrs-core.git
   cd openmrs-core
   mvn clean install -DskipTests
   ```

3. **Deploy to Tomcat**
   ```bash
   # Copy WAR file to Tomcat webapps
   cp webapp/target/openmrs.war $TOMCAT_HOME/webapps/
   
   # Start Tomcat
   $TOMCAT_HOME/bin/startup.sh
   ```

## Integration with Your Patient Passport Project

Since you have OpenMRS modules in your project (`openmrs-modules/`), you can:

1. **Deploy Your Custom Modules**
   ```bash
   # Build your modules
   cd openmrs-modules/patient-passport-core
   mvn clean install
   
   # Copy to OpenMRS modules directory
   cp omod/target/patient-passport-core-*.omod $OPENMRS_HOME/modules/
   ```

2. **Configure FHIR Integration**
   - Enable FHIR module in OpenMRS
   - Configure FHIR endpoints in your backend
   - Test data exchange between systems

## Troubleshooting

### Common Issues:

1. **Port Conflicts**
   - Change ports in configuration if 8080/8081 are busy
   - Check what's running: `netstat -an | findstr :8080`

2. **Java Version Issues**
   - Ensure Java 8+ is installed: `java -version`
   - Set JAVA_HOME environment variable

3. **Database Connection Issues**
   - Verify database is running
   - Check connection parameters
   - Ensure database user has proper permissions

4. **Memory Issues**
   - Increase heap size: `java -Xmx2g -jar openmrs-standalone.jar`
   - Close other applications to free memory

## Next Steps

1. **Install FHIR Module**
   - Download FHIR module from OpenMRS Add-Ons
   - Enable in Administration > Manage Modules

2. **Configure API Access**
   - Set up API authentication
   - Configure CORS for your frontend

3. **Test Integration**
   - Verify FHIR endpoints work
   - Test patient data exchange
   - Validate your custom modules

## Useful Commands

```bash
# Check OpenMRS status
curl http://localhost:8080/openmrs/ws/rest/v1/systeminformation

# Test FHIR endpoint
curl http://localhost:8080/openmrs/ws/fhir2/R4/Patient

# View logs
tail -f $OPENMRS_HOME/logs/openmrs.log
```

## Resources

- [OpenMRS Documentation](https://guide.openmrs.org/)
- [FHIR Module Documentation](https://wiki.openmrs.org/display/docs/FHIR+Module)
- [OpenMRS Community](https://talk.openmrs.org/)
- [API Documentation](https://rest.openmrs.org/)
