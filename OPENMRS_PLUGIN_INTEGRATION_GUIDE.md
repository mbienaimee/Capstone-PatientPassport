# Patient Passport OpenMRS Plugin Integration Guide

## 🏥 **Complete OpenMRS Plugin Integration**

This guide ensures the Patient Passport feature is fully integrated as a plugin within OpenMRS, allowing doctors to manage patient records directly from the OpenMRS interface.

## 📋 **Current Status Check**

Let me verify your OpenMRS setup and ensure the Patient Passport plugin is properly integrated.

### **Step 1: Verify OpenMRS is Running**

```bash
# Check if OpenMRS is running
curl -s http://localhost:8084/openmrs/ws/rest/v1/systeminformation
```

### **Step 2: Build and Deploy Patient Passport Plugin**

```bash
# Navigate to the module directory
cd openmrs-modules/patient-passport-core/omod

# Build the plugin
mvn clean package

# The .omod file will be created in target/ directory
```

### **Step 3: Deploy Plugin to OpenMRS**

#### **Method A: Through OpenMRS Admin Interface**
1. Open http://localhost:8084/openmrs/
2. Login as admin
3. Go to **Administration** → **Manage Modules**
4. Click **Upload Module**
5. Upload the `patientpassportcore-1.0.0.omod` file
6. Click **Start** to activate the module

#### **Method B: Direct File Copy**
```bash
# Copy the .omod file to OpenMRS modules directory
cp target/patientpassportcore-1.0.0.omod /usr/local/tomcat/.OpenMRS/modules/

# Restart OpenMRS
docker-compose -f openmrs-docker-compose.yml restart openmrs
```

## 🔧 **Plugin Features in OpenMRS**

Once deployed, the Patient Passport plugin will add:

### **1. Patient Dashboard Integration**
- **Location**: Patient Dashboard → Patient Passport section
- **Features**:
  - View Universal Patient ID
  - Check Passport Status (Active/Pending/Not Created)
  - Generate Universal ID if not exists
  - Sync patient data to Patient Passport system
  - Emergency override access

### **2. Administration Panel**
- **Location**: Administration → Patient Passport
- **Features**:
  - Configure API settings
  - View sync statistics
  - Monitor emergency overrides
  - Manage audit logs

### **3. REST API Endpoints**
```
POST /openmrs/ws/rest/v1/patientpassport/generate-universal-id
GET  /openmrs/ws/rest/v1/patientpassport/find-by-universal-id
POST /openmrs/ws/rest/v1/patientpassport/emergency-override
GET  /openmrs/ws/rest/v1/patientpassport/audit-logs
POST /openmrs/ws/rest/v1/patientpassport/sync-patient
POST /openmrs/ws/rest/v1/patientpassport/sync-all
```

### **4. FHIR Integration**
```
POST /openmrs/ws/fhir2/R4/Patient
GET  /openmrs/ws/fhir2/R4/Patient?identifier={universalId}
PUT  /openmrs/ws/fhir2/R4/Patient/{id}
```

## 🎯 **How Doctors Use the Plugin**

### **Creating New Patients with Passport Integration**

1. **Create Patient in OpenMRS**:
   - Go to **Find Patient** → **Create New Patient**
   - Fill in patient details
   - Save the patient

2. **Automatic Passport Integration**:
   - System automatically generates Universal Patient ID
   - Patient data syncs to Patient Passport system
   - Passport record is created automatically

3. **View Patient Passport**:
   - Open any patient's dashboard
   - Look for **"Patient Passport"** section
   - View Universal ID and passport status

### **Emergency Access**

1. **Emergency Override**:
   - Click **"Emergency Override"** on patient dashboard
   - Provide justification
   - System grants immediate access
   - All actions are logged for audit

2. **Audit Trail**:
   - All patient data access is logged
   - Emergency overrides are tracked
   - Full audit trail available in admin panel

## 🔗 **Integration with Your Patient Passport System**

### **Backend Configuration**

Update your backend to integrate with OpenMRS:

```typescript
// backend/.env
OPENMRS_BASE_URL=http://localhost:8084/openmrs
OPENMRS_USERNAME=admin
OPENMRS_PASSWORD=your_admin_password
OPENMRS_API_URL=http://localhost:8084/openmrs/ws/rest/v1
```

### **Frontend Integration**

Your frontend can now:
- Query OpenMRS for patient data
- Sync patient records between systems
- Display unified patient information
- Handle emergency access scenarios

## 📊 **Testing the Integration**

### **Test 1: Create Patient with Passport**
```bash
# Create a test patient via OpenMRS API
curl -X POST http://localhost:8084/openmrs/ws/fhir2/R4/Patient \
  -H "Content-Type: application/json" \
  -d '{
    "resourceType": "Patient",
    "name": [{"given": ["John"], "family": "Doe"}],
    "gender": "male",
    "birthDate": "1990-01-01"
  }'
```

### **Test 2: Generate Universal ID**
```bash
# Generate universal ID for patient
curl -X POST "http://localhost:8084/openmrs/ws/rest/v1/patientpassport/generate-universal-id?patientUuid={patient-uuid}"
```

### **Test 3: View Patient Passport**
1. Open OpenMRS: http://localhost:8084/openmrs/
2. Find the patient you created
3. Open patient dashboard
4. Look for "Patient Passport" section

## 🚨 **Troubleshooting**

### **If Plugin Doesn't Appear**
1. Check OpenMRS logs: `docker-compose -f openmrs-docker-compose.yml logs openmrs`
2. Verify module is uploaded and started
3. Check for compilation errors

### **If API Endpoints Don't Work**
1. Verify module is active in Administration → Manage Modules
2. Check REST API is enabled
3. Verify user permissions

### **If Patient Data Doesn't Sync**
1. Check API configuration in admin panel
2. Verify Patient Passport API is running
3. Check network connectivity

## 📈 **Monitoring and Maintenance**

### **Admin Dashboard Features**
- **Sync Statistics**: View total patients and sync status
- **Emergency Override Logs**: Monitor emergency access
- **Audit Logs**: Track all patient data access
- **Configuration**: Manage API settings

### **Regular Maintenance**
1. Monitor sync status
2. Review emergency override logs
3. Update API configurations as needed
4. Backup audit data

## 🎉 **Success Indicators**

You'll know the integration is working when:

✅ **Patient Passport section appears on patient dashboards**
✅ **Universal Patient IDs are generated automatically**
✅ **Patient data syncs between OpenMRS and Patient Passport**
✅ **Emergency override functionality works**
✅ **Admin panel shows sync statistics**
✅ **API endpoints respond correctly**

## 🔄 **Next Steps**

1. **Deploy the plugin** using the methods above
2. **Test the integration** with sample patients
3. **Configure your backend** to use OpenMRS APIs
4. **Train your team** on the new features
5. **Monitor the system** for optimal performance

Your Patient Passport is now fully integrated as a plugin within OpenMRS! 🏥✨







