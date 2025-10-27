# OpenMRS Patient Passport Module - Access Guide

## 🎯 Overview

This guide shows you how to access your **Patient Passport** frontend application (https://patient-passpo.netlify.app) from within your OpenMRS instance after uploading the module.

## 📋 Prerequisites

✅ OpenMRS is running locally (`mvn openmrs-sdk:run`)  
✅ Patient Passport Module (`patientpassport-1.0.0.omod`) is uploaded and started  
✅ You have OpenMRS admin or user credentials  
✅ Internet connection is available

---

## 🚀 5 Ways to Access Patient Passport

### Method 1: **Full-Screen Iframe Integration** ⭐ RECOMMENDED

This provides the best user experience with seamless integration.

#### Step 1: Login to OpenMRS
1. Open browser: `http://localhost:8080/openmrs`
2. Login with your credentials
3. Select location (if prompted)

#### Step 2: Access Patient Passport
Navigate to one of these URLs:

**Option A - Direct URL:**
```
http://localhost:8080/openmrs/module/patientpassport/iframe.htm
```

**Option B - From Admin Menu:**
1. Click **Administration** (top-right)
2. Find **Patient Passport Module** section
3. Click **"Patient Passport System"** or **"Open Patient Passport"**

#### What You'll See:
- Full-screen embedded Patient Passport application
- Green header bar with your OpenMRS username
- All features of https://patient-passpo.netlify.app available
- "Exit" button to return to OpenMRS
- "Refresh" and "Open in New Tab" options

---

### Method 2: **Patient Dashboard Integration**

Access passport from individual patient records.

#### Steps:
1. Go to **Find/Create Patient**
2. Search and select a patient
3. On the Patient Dashboard, look for:
   - **"View Patient Passport"** button/link
   - Or **Patient Passport** tab

#### What You'll See:
- Patient-specific passport data
- OTP verification option (if enabled)
- Emergency access option
- Medical records, test results, hospital visits

---

### Method 3: **Management Interface**

For administrators to configure the module.

#### Access URL:
```
http://localhost:8080/openmrs/module/patientpassport/manage.htm
```

#### Steps:
1. Login to OpenMRS as admin
2. Go to **Administration** → **Manage Modules**
3. Find **Patient Passport Module**
4. Click **"Manage"** or access the URL above

#### What You'll See:
- Configuration settings (API URL, Frontend URL)
- System statistics
- Test connection button
- Option to **"Open External System"** → Opens https://patient-passpo.netlify.app

---

### Method 4: **Direct External Access**

Open the frontend application directly in a new browser tab.

#### Steps:
1. Open new browser tab
2. Navigate to: **https://patient-passpo.netlify.app**
3. Login with your credentials

#### Note:
- This is completely separate from OpenMRS
- Use this when you want standalone access
- Full Patient Passport functionality available

---

### Method 5: **REST API Access**

For developers and programmatic access.

#### Base URL:
```
http://localhost:8080/openmrs/ws/rest/v1/patientpassport
```

#### Example Endpoints:
```bash
# Get patient passport by patient ID
GET http://localhost:8080/openmrs/ws/rest/v1/patientpassport/{patientId}

# Request OTP for access
POST http://localhost:8080/openmrs/ws/rest/v1/patientpassport/requestOtp

# Verify OTP
POST http://localhost:8080/openmrs/ws/rest/v1/patientpassport/verifyOtp

# Emergency access
POST http://localhost:8080/openmrs/ws/rest/v1/patientpassport/emergencyAccess
```

---

## 🎨 Adding Custom Navigation Links

### Add to OpenMRS Header Menu

Edit your OpenMRS configuration to add a permanent link:

#### Option 1: Add to `config.xml` (Already Done!)
The module already registers itself in the Administration section.

#### Option 2: Add Custom Link to Header

Create file: `openmrs/WEB-INF/view/module/patientpassport/extension.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<extensions>
    <extension id="patientpassport.headerlink" 
               pointId="org.openmrs.gutter.links" 
               class="org.openmrs.module.patientpassport.extension.html.HeaderLinkExt">
        <require_privilege>Patient Passport: View Patient Passport</require_privilege>
    </extension>
</extensions>
```

Create Java class: `HeaderLinkExt.java`
```java
package org.openmrs.module.patientpassport.extension.html;

import org.openmrs.module.web.extension.LinkExt;

public class HeaderLinkExt extends LinkExt {
    
    @Override
    public String getLabel() {
        return "Patient Passport";
    }
    
    @Override
    public String getUrl() {
        return "module/patientpassport/iframe.htm";
    }
    
    @Override
    public String getRequiredPrivilege() {
        return "Patient Passport: View Patient Passport";
    }
}
```

---

## 🔧 Configuration

### 1. Verify Module is Running

#### Steps:
1. Go to **Administration** → **Manage Modules**
2. Find **"Patient Passport Module"**
3. Status should be: ✅ **Started**
4. If not started, click **"Start"**

### 2. Configure Global Properties

#### Access Global Properties:
1. **Administration** → **Advanced Administration**
2. Click **"Global Properties"**
3. Look for properties starting with `patientpassport.`

#### Key Settings:
```properties
patientpassport.api.baseUrl = https://patientpassport-api.azurewebsites.net/api
patientpassport.frontend.url = https://patient-passpo.netlify.app/
patientpassport.enable.otp = true
patientpassport.audit.logging = true
```

### 3. Assign User Privileges

#### Steps:
1. Go to **Administration** → **Manage Users**
2. Select a user
3. Edit their roles
4. Add one of these roles:
   - **Patient Passport User** (Basic viewing)
   - **Patient Passport Manager** (Full management)
   - **Patient Passport Emergency** (Emergency access)

---

## 🔐 Security & Authentication

### Single Sign-On (SSO) Integration

The module passes OpenMRS authentication to the frontend:

```javascript
// Automatic context passing
{
  source: 'openmrs',
  user: {
    username: 'admin',
    name: 'Admin User',
    userId: '1'
  }
}
```

### OTP Verification

If OTP is enabled:
1. Request access to patient passport
2. OTP is sent to your registered email/phone
3. Enter OTP to verify
4. Access granted for limited time

### Emergency Override

For critical situations:
1. Click "Emergency Access" button
2. Provide justification
3. Access is granted immediately
4. All emergency access is logged and audited

---

## 📊 Testing the Integration

### 1. Test Connection
```bash
# From OpenMRS management page
1. Go to: http://localhost:8080/openmrs/module/patientpassport/manage.htm
2. Click "Test API Connection"
3. Should show: ✅ Connection successful
```

### 2. Test Iframe Loading
```bash
# Direct iframe access
1. Go to: http://localhost:8080/openmrs/module/patientpassport/iframe.htm
2. Should load: Patient Passport frontend
3. Check browser console for any errors
```

### 3. Test Patient Access
```bash
1. Select any patient in OpenMRS
2. Click "View Patient Passport"
3. Should show patient data from external system
```

---

## 🚨 Troubleshooting

### Issue 1: Module Not Appearing

**Solution:**
```bash
1. Check module is started: Administration → Manage Modules
2. Restart OpenMRS: Ctrl+C then mvn openmrs-sdk:run
3. Clear browser cache
4. Check logs: openmrs/openmrs.log
```

### Issue 2: Iframe Not Loading

**Possible Causes:**
- No internet connection
- Frontend URL is down
- Browser blocking iframe (CORS issue)

**Solution:**
```bash
1. Test frontend directly: https://patient-passpo.netlify.app
2. Check browser console for errors
3. Verify Global Property: patientpassport.frontend.url
4. Try different browser
```

### Issue 3: "Access Denied" Error

**Solution:**
```bash
1. Check user has required privilege
2. Go to: Administration → Manage Users
3. Edit user → Add role: "Patient Passport User"
4. Save and re-login
```

### Issue 4: API Connection Failed

**Solution:**
```bash
1. Check internet connection
2. Verify API is running: https://patientpassport-api.azurewebsites.net/api/health
3. Check firewall settings
4. Verify Global Property: patientpassport.api.baseUrl
```

---

## 🎯 Quick Start Checklist

After uploading the module, follow this checklist:

- [ ] **Step 1:** Verify module is started in Manage Modules
- [ ] **Step 2:** Assign "Patient Passport User" role to your user
- [ ] **Step 3:** Test iframe access: `/module/patientpassport/iframe.htm`
- [ ] **Step 4:** Test API connection in management page
- [ ] **Step 5:** Try accessing a patient's passport
- [ ] **Step 6:** Verify OTP functionality (if enabled)
- [ ] **Step 7:** Test emergency access feature

---

## 📱 Mobile & Responsive Access

The frontend (https://patient-passpo.netlify.app) is fully responsive:

- ✅ Desktop (1920x1080)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667)

Access from any device using the iframe URL!

---

## 🌐 Production Deployment

### For Multiple OpenMRS Instances

1. **Install module on each instance**
2. **Configure same API URL** (centralized backend)
3. **Configure unique instance identifiers**
4. **Enable cross-instance patient lookup**

### Configuration for Production:
```properties
patientpassport.api.baseUrl=https://patientpassport-api.azurewebsites.net/api
patientpassport.frontend.url=https://patient-passpo.netlify.app/
patientpassport.instance.id=hospital-001
patientpassport.instance.name=City Hospital
```

---

## 📚 Additional Resources

### Documentation
- **Module README:** `openmrs-patient-passport-module/README.md`
- **Deployment Guide:** `openmrs-patient-passport-module/DEPLOYMENT_GUIDE.md`
- **API Documentation:** `backend/docs/swagger.yml`

### Support URLs
- **Frontend:** https://patient-passpo.netlify.app
- **Backend API:** https://patientpassport-api.azurewebsites.net/api
- **API Health Check:** https://patientpassport-api.azurewebsites.net/api/health
- **API Documentation:** https://patientpassport-api.azurewebsites.net/api-docs

### Contact
- **Project:** Patient Passport
- **Team:** Patient Passport Team
- **Version:** 1.0.0

---

## 🎉 Success!

If you can access the iframe at:
```
http://localhost:8080/openmrs/module/patientpassport/iframe.htm
```

**Congratulations!** 🎊 Your Patient Passport module is fully integrated with OpenMRS!

You now have:
✅ Full-screen embedded Patient Passport frontend  
✅ Seamless authentication flow  
✅ Access to all patient medical records  
✅ OTP verification for secure access  
✅ Emergency override capabilities  
✅ Audit logging and compliance  

**Next Steps:**
1. Train your staff on using the system
2. Configure role-based access control
3. Set up automated patient synchronization
4. Enable notifications and alerts
5. Monitor audit logs regularly

---

**Happy Patient Management! 🏥💚**
