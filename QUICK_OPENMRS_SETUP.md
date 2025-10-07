# Quick OpenMRS Setup Guide

## 🚀 **Method 1: Download OpenMRS Standalone (Recommended)**

### Step 1: Download OpenMRS
1. **Go to**: https://openmrs.org/download/
2. **Click**: "OpenMRS Standalone" 
3. **Download**: The latest version (2.5.0 or newer)
4. **Save to**: `C:\openmrs\` (create this folder first)

### Step 2: Extract and Run
1. **Extract** the downloaded ZIP file to `C:\openmrs\`
2. **Navigate** to the extracted folder
3. **Double-click** on `openmrs-standalone.jar`
4. **OR** run in command prompt:
   ```cmd
   cd C:\openmrs\openmrs-standalone
   java -jar openmrs-standalone.jar
   ```

### Step 3: Initial Setup
1. **Follow** the setup wizard
2. **Choose** to install demo data (recommended)
3. **Set** admin password
4. **Complete** the setup

### Step 4: Access OpenMRS
- **URL**: http://localhost:8081/openmrs-standalone/
- **Login**: admin / Admin123 (or your chosen password)

---

## 🔧 **Method 2: Fix Docker and Use Docker Method**

### Step 1: Restart Docker Desktop
1. **Close** Docker Desktop completely
2. **Restart** your computer
3. **Start** Docker Desktop again
4. **Wait** for it to fully start

### Step 2: Start OpenMRS with Docker
```bash
# Navigate to your project directory
cd C:\Users\user\OneDrive\Desktop\Capstone-PatientPassport

# Start OpenMRS
docker-compose -f openmrs-docker-compose.yml up -d

# Check status
docker-compose -f openmrs-docker-compose.yml ps
```

### Step 3: Access OpenMRS
- **URL**: http://localhost:8084/openmrs/
- **Login**: admin / Admin123

---

## 🎯 **Method 3: Use Your Backend Without OpenMRS (Temporary)**

If you just want to test your Patient Passport system without OpenMRS:

### Step 1: Start Your Backend
```bash
cd backend
npm run dev
```

### Step 2: Start Your Frontend
```bash
cd frontend
npm run dev
```

### Step 3: Test Your System
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

---

## 🔍 **Troubleshooting**

### If Java Issues:
```bash
# Check Java version
java -version

# If not installed, download from: https://adoptium.net/
```

### If Port Issues:
- OpenMRS will use the next available port
- Check the console output for the actual URL

### If Memory Issues:
```bash
# Run with more memory
java -Xmx2g -jar openmrs-standalone.jar
```

---

## 📋 **Quick Commands Reference**

```bash
# Check if OpenMRS is running
netstat -an | findstr :8081

# Check Docker status
docker ps

# Start OpenMRS with Docker
docker-compose -f openmrs-docker-compose.yml up -d

# Stop OpenMRS
docker-compose -f openmrs-docker-compose.yml down

# View OpenMRS logs
docker-compose -f openmrs-docker-compose.yml logs openmrs
```

---

## 🎉 **After Setup**

Once OpenMRS is running, you can:

1. **Test REST API**: http://localhost:8081/openmrs-standalone/ws/rest/v1/systeminformation
2. **Test FHIR API**: http://localhost:8081/openmrs-standalone/ws/fhir2/R4/Patient
3. **Access Admin Panel**: http://localhost:8081/openmrs-standalone/admin/
4. **Manage Modules**: Administration → Manage Modules

---

## 💡 **Recommendation**

**Use Method 1 (Standalone)** - it's the most reliable and doesn't depend on Docker. Once you have OpenMRS running, you can integrate it with your Patient Passport system.















