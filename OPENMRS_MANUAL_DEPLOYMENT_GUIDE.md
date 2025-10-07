# OpenMRS Manual Module Deployment Guide

##  OpenMRS is Running Successfully!

**Access URLs:**
- **Main Interface**: http://localhost:8084/openmrs/
- **REST API**: http://localhost:8084/openmrs/ws/rest/v1/
- **FHIR API**: http://localhost:8084/openmrs/ws/fhir2/R4/

##  Step 1: Complete OpenMRS Initial Setup

1. **Open your browser** and go to: http://localhost:8084/openmrs/
2. **Follow the setup wizard**:
   - Database connection is already configured
   - Create an admin user (remember the password!)
   - **Choose to install demo data** (recommended for testing)
   - Complete the setup process

##  Step 2: Access OpenMRS Admin Panel

After setup, you can:
1. **Login** with your admin credentials
2. **Go to Administration** → **Manage Modules**
3. **Upload your custom modules** (if you have .omod files)

##  Step 3: Build Your Custom Modules (Optional)

If you want to build your custom modules, you'll need Maven:

### Install Maven:
1. Download Maven from: https://maven.apache.org/download.cgi
2. Extract to a folder (e.g., C:\apache-maven-3.9.6)
3. Add to PATH: C:\apache-maven-3.9.6\bin
4. Restart your terminal

### Build Modules:
```bash
# Navigate to your module directory
cd openmrs-modules/patient-passport-core/omod

# Build the module
mvn clean install

# This will create a .omod file in the target directory
```

##  Step 4: Test OpenMRS Integration

### Test REST API:
```bash
# Test system info
curl http://localhost:8084/openmrs/ws/rest/v1/systeminformation

# Test patient endpoint
curl http://localhost:8084/openmrs/ws/rest/v1/patient
```

### Test FHIR API:
```bash
# Test FHIR patient endpoint
curl http://localhost:8084/openmrs/ws/fhir2/R4/Patient
```

##  Step 5: Configure Your Backend Integration

Update your backend configuration to point to OpenMRS:

```typescript
// In your backend .env file
OPENMRS_BASE_URL=http://localhost:8084/openmrs
OPENMRS_USERNAME=admin
OPENMRS_PASSWORD=your_admin_password
```

##  Step 6: Deploy Your Patient Passport Modules

### Method 1: Manual Upload (Easiest)
1. Build your modules (if you have Maven)
2. Go to OpenMRS Admin → Manage Modules
3. Upload the .omod files

### Method 2: Docker Volume Mount
Your modules are already mounted in the Docker container at:
`/usr/local/tomcat/.OpenMRS/modules`

You can copy .omod files directly to this location.

##  Step 7: Test Your Integration

1. **Start your backend**: `cd backend && npm run dev`
2. **Start your frontend**: `cd frontend && npm run dev`
3. **Test the integration** between your Patient Passport and OpenMRS

##  Troubleshooting

### If OpenMRS won't start:
```bash
# Check logs
docker-compose -f openmrs-docker-compose.yml logs openmrs

# Restart containers
docker-compose -f openmrs-docker-compose.yml restart
```

### If you need to reset OpenMRS:
```bash
# Stop and remove containers
docker-compose -f openmrs-docker-compose.yml down

# Remove volumes (this will delete all data!)
docker volume rm capstone-patientpassport_openmrs_data
docker volume rm capstone-patientpassport_mysql_data

# Start fresh
docker-compose -f openmrs-docker-compose.yml up -d
```

## 📚 Useful Resources

- [OpenMRS Documentation](https://guide.openmrs.org/)
- [FHIR Module Documentation](https://wiki.openmrs.org/display/docs/FHIR+Module)
- [OpenMRS REST API](https://rest.openmrs.org/)
- [OpenMRS Community](https://talk.openmrs.org/)

##  You're All Set!

Your OpenMRS instance is running and ready for integration with your Patient Passport system!
















