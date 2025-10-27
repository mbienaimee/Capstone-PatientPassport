# 🚨 IMMEDIATE FIX - Step by Step

## Current Situation
- OpenMRS is running with the OLD problematic module loaded
- The old module has the broken view resolver
- OpenMRS homepage shows: `/WEB-INF/viewindex.jsp` error

## ✅ EXACT STEPS TO FIX

### Step 1: Stop OpenMRS NOW

1. Find the terminal/command prompt where OpenMRS is running
2. Press `Ctrl+C` to stop it
3. Wait for "Server shutdown complete" message

**OR** if you can't find the terminal:

Open PowerShell and run:
```powershell
Get-Process -Name "java" | Stop-Process -Force
```

### Step 2: Delete the Old Module Files

Run this command in PowerShell:
```powershell
Remove-Item "C:\Users\user\.openmrs\modules\patientpassport*" -Recurse -Force
```

This will delete:
- The old OMOD file
- All extracted/cached module files

### Step 3: Verify Module is Gone

Run:
```powershell
Get-ChildItem "C:\Users\user\.openmrs\modules" -Filter "*patientpassport*"
```

Should return: **Nothing** (module deleted)

### Step 4: Start OpenMRS Fresh

Navigate to your OpenMRS directory and start it:
```powershell
cd C:\Users\user\<your-openmrs-directory>
mvn openmrs-sdk:run
```

Replace `<your-openmrs-directory>` with wherever you have OpenMRS installed.

### Step 5: Test OpenMRS Homepage

**BEFORE uploading the module**, test:
```
http://localhost:8080/openmrs/
```

✅ Should show login page (NOT the viewindex.jsp error)

If you still see the error, OpenMRS might be caching. Try:
```powershell
Remove-Item "C:\Users\user\.openmrs\*cache*" -Recurse -Force -ErrorAction SilentlyContinue
```

Then restart OpenMRS again.

### Step 6: Upload the NEW Fixed Module

Only after OpenMRS homepage works:

1. Login to OpenMRS
2. Go to: Administration → Manage Modules
3. Click: "Add or Upgrade Module"
4. Upload: `c:\Users\user\Capstone-PatientPassport\openmrs-patient-passport-module\omod\target\patientpassport-1.0.0.omod`
5. Wait for "Started" status

### Step 7: Verify Everything Works

Test in this order:

1. ✅ `http://localhost:8080/openmrs/` - OpenMRS homepage (must still work!)
2. ✅ `http://localhost:8080/openmrs/admin` - Admin page
3. ✅ `http://localhost:8080/openmrs/module/patientpassport/manage.htm` - Module manage page
4. ✅ `http://localhost:8080/openmrs/module/patientpassport/iframe.htm` - Patient Passport iframe

---

## 🔧 PowerShell Commands - Copy & Run

```powershell
# 1. STOP OpenMRS
Get-Process -Name "java" | Stop-Process -Force

# 2. DELETE old module
Remove-Item "C:\Users\user\.openmrs\modules\patientpassport*" -Recurse -Force

# 3. VERIFY it's gone
Get-ChildItem "C:\Users\user\.openmrs\modules" -Filter "*patientpassport*"

# 4. Clear cache (optional but recommended)
Remove-Item "C:\Users\user\.openmrs\*cache*" -Recurse -Force -ErrorAction SilentlyContinue

# 5. START OpenMRS (adjust path to your setup)
# cd <your-openmrs-path>
# mvn openmrs-sdk:run
```

---

## ⚠️ CRITICAL

**DO NOT** upload the new module until:
1. OpenMRS is completely stopped
2. Old module files are deleted
3. OpenMRS restarts successfully
4. Homepage works without errors

The new OMOD (1,362.45 KB, built at 1:56:24 PM) has the fix, but it won't work if the old configuration is still loaded!

---

## 📍 Module Locations Found

Old module is at:
```
C:\Users\user\.openmrs\modules\patientpassport-1.0.0.omod
```

New fixed module is at:
```
c:\Users\user\Capstone-PatientPassport\openmrs-patient-passport-module\omod\target\patientpassport-1.0.0.omod
```

**They're different!** The old one has the broken view resolver, the new one doesn't.
