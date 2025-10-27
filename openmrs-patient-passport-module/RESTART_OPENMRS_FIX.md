# 🔴 CRITICAL: How to Fix the OpenMRS Index Page Error

## The Problem
OpenMRS homepage shows: `JSP file [/WEB-INF/viewindex.jsp] not found`

This happens because **the old module configuration is still loaded in OpenMRS's memory**, even after uploading the new OMOD.

---

## ✅ SOLUTION: Complete OpenMRS Restart

### Step 1: Stop OpenMRS Completely

#### Option A: Using Terminal (If you started with mvn openmrs-sdk:run)
1. Find the terminal window where OpenMRS is running
2. Press `Ctrl+C` to stop the server
3. Wait for it to fully shut down

#### Option B: Kill the Java Process (If terminal doesn't work)
1. Open PowerShell as Administrator
2. Run this command:
   ```powershell
   Get-Process -Name "java" | Stop-Process -Force
   ```
3. Confirm all Java processes are stopped:
   ```powershell
   Get-Process -Name "java" -ErrorAction SilentlyContinue
   ```
   (Should return nothing)

---

### Step 2: Remove the Old Module Files

**IMPORTANT**: Delete the old module from OpenMRS's module directory!

1. Navigate to your OpenMRS installation directory
2. Find the `.OpenMRS` folder in your user directory:
   ```
   C:\Users\user\.OpenMRS\modules\
   ```

3. Delete the old Patient Passport module files:
   ```powershell
   Remove-Item "C:\Users\user\.OpenMRS\modules\patientpassport*.omod" -Force -ErrorAction SilentlyContinue
   ```

**OR** if OpenMRS is in a different location, check:
```powershell
# Find where OpenMRS stores modules
Get-ChildItem -Path "C:\Users\user" -Recurse -Filter "*.OpenMRS" -Directory -ErrorAction SilentlyContinue
```

---

### Step 3: Start OpenMRS Fresh

1. Navigate to your OpenMRS SDK directory:
   ```powershell
   cd C:\Users\user\openmrs-server
   ```
   (Or wherever you have your OpenMRS setup)

2. Start OpenMRS:
   ```powershell
   mvn openmrs-sdk:run
   ```

3. Wait for OpenMRS to fully start (you'll see "Server startup complete")

---

### Step 4: Verify OpenMRS Core Works

Before uploading the module, verify OpenMRS works:

1. Open browser: `http://localhost:8080/openmrs/`
2. Should see login page ✅ (NOT the viewindex.jsp error)

If you still see the error, OpenMRS might have cached configuration. Try:

```powershell
# Clear OpenMRS temporary files
Remove-Item "C:\Users\user\.OpenMRS\*temp*" -Recurse -Force -ErrorAction SilentlyContinue
```

Then restart OpenMRS again.

---

### Step 5: Upload the New Module

Once OpenMRS core works:

1. Login to OpenMRS admin
2. Go to **Administration** → **Manage Modules**
3. Click **Add or Upgrade Module**
4. Upload: `c:\Users\user\Capstone-PatientPassport\openmrs-patient-passport-module\omod\target\patientpassport-1.0.0.omod`
5. Wait for upload and installation
6. Module should show **Started** status

---

### Step 6: Verify Everything Works

Test these URLs in order:

1. ✅ **OpenMRS Homepage**: `http://localhost:8080/openmrs/`
   - Should work without errors

2. ✅ **OpenMRS Admin**: `http://localhost:8080/openmrs/admin`
   - Should display admin page

3. ✅ **Patient Passport Manage**: `http://localhost:8080/openmrs/module/patientpassport/manage.htm`
   - Should show management page

4. ✅ **Patient Passport Iframe**: `http://localhost:8080/openmrs/module/patientpassport/iframe.htm`
   - Should load Patient Passport frontend

---

## 🔍 If Error Persists After Restart

### Check OpenMRS Logs

Look for errors in:
```
C:\Users\user\.OpenMRS\openmrs.log
```

Or wherever your OpenMRS logs are located.

### Common Issues

#### 1. Module Still in Memory
**Solution**: Make sure you completely stopped OpenMRS and removed old module files

#### 2. Multiple OpenMRS Instances Running
**Solution**: Kill all Java processes:
```powershell
Get-Process -Name "java" | Stop-Process -Force
```

#### 3. Cached Spring Configuration
**Solution**: Clear OpenMRS cache:
```powershell
Remove-Item "C:\Users\user\.OpenMRS\configuration" -Recurse -Force -ErrorAction SilentlyContinue
```

---

## 🚨 Emergency Recovery

If OpenMRS won't start at all after the module:

### 1. Start OpenMRS in Safe Mode
Some OpenMRS versions support safe mode to skip modules.

### 2. Manually Remove Module
1. Stop OpenMRS
2. Delete from: `C:\Users\user\.OpenMRS\modules\patientpassport*.omod`
3. Start OpenMRS
4. Should work without the module

### 3. Check web.xml Conflicts
Ensure there are no servlet mapping conflicts in the module.

---

## 📋 PowerShell Commands Summary

Copy and run these in PowerShell:

```powershell
# 1. Stop OpenMRS
Get-Process -Name "java" | Stop-Process -Force

# 2. Remove old module files
Remove-Item "C:\Users\user\.OpenMRS\modules\patientpassport*.omod" -Force -ErrorAction SilentlyContinue

# 3. Clear cache (optional)
Remove-Item "C:\Users\user\.OpenMRS\*temp*" -Recurse -Force -ErrorAction SilentlyContinue

# 4. Navigate to OpenMRS directory (adjust path if different)
cd C:\Users\user\openmrs-server

# 5. Start OpenMRS
mvn openmrs-sdk:run
```

---

## ✅ Expected Behavior After Fix

1. OpenMRS homepage loads normally
2. You can login and access admin
3. Module shows in Manage Modules as "Started"
4. Both module URLs work without 404 errors
5. No `/WEB-INF/viewindex.jsp` errors anywhere

---

## 🎯 The New OMOD File

The corrected OMOD is ready at:
```
c:\Users\user\Capstone-PatientPassport\openmrs-patient-passport-module\omod\target\patientpassport-1.0.0.omod
```

**Size**: 1,362.45 KB  
**Built**: October 27, 2025, 1:56:24 PM  
**Status**: No custom view resolver - OpenMRS compatible ✅

---

## 📞 Still Having Issues?

If the error persists after following all steps:

1. **Check the exact OpenMRS version** you're running
2. **Verify the module loaded** in Manage Modules
3. **Check for error stack traces** in OpenMRS logs
4. **Try uploading to a fresh OpenMRS instance** to isolate the issue

The key is: **The old module configuration must be completely cleared from memory!**
