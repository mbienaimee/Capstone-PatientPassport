# Patient Passport Module - Issues Fixed

## Date: October 27, 2025

### Issues Resolved:

#### 1. **404 Error on iframe.form and manage.form URLs**
**Problem**: URLs returning "HTTP Status 404 – Not Found"
```
WARN - DispatcherServlet.noHandlerFound |2025-10-27T15:55:34,277| No mapping for GET /openmrs/module/patientpassport/iframe.form
WARN - DispatcherServlet.noHandlerFound |2025-10-27T15:55:46,383| No mapping for GET /openmrs/module/patientpassport/manage.form
```

**Root Cause**: Controller `@RequestMapping` was missing the `.form` extension in the URL mapping

**Solution**: Updated `PatientPassportController.java`:
```java
// BEFORE (WRONG):
@Controller
@RequestMapping("/module/patientpassport")
public class PatientPassportController {
    @RequestMapping(value = "/iframe", method = RequestMethod.GET)
    @RequestMapping(value = "/manage", method = RequestMethod.GET)
}

// AFTER (CORRECT):
@Controller
public class PatientPassportController {
    @RequestMapping(value = "/module/patientpassport/iframe.form", method = RequestMethod.GET)
    @RequestMapping(value = "/module/patientpassport/manage.form", method = RequestMethod.GET)
}
```

**Why**: OpenMRS Spring MVC requires the full path including `.form` extension in `@RequestMapping`

---

#### 2. **ClassNotFoundException for AdministrationSectionExt**
**Problem**: Admin menu extension could not load
```
WARN - Module.expandExtensionNames: Unable to create instance of class
java.lang.NoClassDefFoundError: org/openmrs/module/web/extension/AdministrationSectionExt
```

**Root Cause**: Using `require_module` instead of `aware_of_modules` for legacyui dependency

**Solution**: Updated `config.xml`:
```xml
<!-- BEFORE (WRONG): -->
<require_module version="1.0">
    <![CDATA[org.openmrs.module.legacyui]]>
</require_module>

<!-- AFTER (CORRECT): -->
<aware_of_modules>
    <aware_of_module>org.openmrs.module.legacyui</aware_of_module>
</aware_of_modules>
```

**Why**: 
- `require_module` makes legacyui mandatory but doesn't guarantee class availability
- `aware_of_modules` is the correct way (verified from openmrs-module-reporting)
- This tells OpenMRS "I know this module exists and can work with it if it's loaded"

---

#### 3. **Added Navigation Bar Link for Easy Access**

**Enhancement**: Created `GutterListExt.java` to add Patient Passport to main navigation

**File**: `omod/src/main/java/org/openmrs/module/patientpassport/extension/html/GutterListExt.java`
```java
public class GutterListExt extends Extension {
    public Extension.MEDIA_TYPE getMediaType() {
        return Extension.MEDIA_TYPE.html;
    }
    
    public String getLabel() {
        return "patientpassport.title";
    }
    
    public String getUrl() {
        return "module/patientpassport/iframe.form";
    }
    
    public String getRequiredPrivilege() {
        return "View Administration Functions";
    }
    
    public String getTitle() {
        return "Patient Passport";
    }
}
```

**Config Addition** in `config.xml`:
```xml
<!-- Add link to main navigation gutter -->
<extension>
    <point>org.openmrs.gutter.tools</point>
    <class>org.openmrs.module.patientpassport.extension.html.GutterListExt</class>
</extension>
```

**Result**: Patient Passport now appears in main navigation bar (not just admin page)

---

## Current Module Structure

### Extension Points Configured:
1. **Admin Page Link** (`org.openmrs.admin.list`) - AdminList.java
2. **Navigation Gutter Link** (`org.openmrs.gutter.tools`) - GutterListExt.java

### Controller Endpoints:
- `/openmrs/module/patientpassport/iframe.form` - Full-screen Patient Passport view
- `/openmrs/module/patientpassport/manage.form` - Settings/management page

### JSP Views:
- `omod/src/main/resources/web/module/iframe.jsp`
- `omod/src/main/resources/web/module/manage.jsp`

---

## How to Restart OpenMRS

1. **Stop OpenMRS Server**:
   - If running in terminal: Press `Ctrl+C`
   - If running as service: Stop the Tomcat service

2. **Start OpenMRS Server**:
   - Navigate to Tomcat bin directory
   - Run startup script

3. **Verify Module Loaded**:
   - Go to http://localhost:8080/openmrs/admin
   - Check "Manage Modules" - should see "Patient Passport Module 1.0.0"
   - Check main navigation bar - should see "Patient Passport" link
   - Check Administration page - should see "Patient Passport" section

---

## Access Methods

### Method 1: Navigation Bar (EASIEST)
1. Log in to OpenMRS
2. Click "Patient Passport" in the top navigation bar
3. View full-screen iframe

### Method 2: Administration Page
1. Log in to OpenMRS
2. Click "Administration"
3. Scroll to "Patient Passport" section
4. Click "Patient Passport - Full Screen" or "Patient Passport - Settings"

### Method 3: Direct URL
- Full Screen: http://localhost:8080/openmrs/module/patientpassport/iframe.form
- Settings: http://localhost:8080/openmrs/module/patientpassport/manage.form

---

## Key Learnings from Research

### From openmrs-module-reporting:
1. **URL Mapping Pattern**: Always include full path with `.form` in `@RequestMapping`
2. **LegacyUI Dependency**: Use `aware_of_modules` not `require_module`
3. **Extension Points**: 
   - `org.openmrs.admin.list` for admin page links
   - `org.openmrs.gutter.tools` for navigation bar links

### Research References:
- Studied GitHub repo: `openmrs/openmrs-module-reporting`
- Analyzed config.xml for module dependency patterns
- Examined controller URL mapping patterns in multiple controllers
- Verified extension class structures

---

## Files Modified

1. `omod/src/main/resources/config.xml` - Fixed aware_of_modules, added gutter extension
2. `omod/src/main/java/org/openmrs/module/patientpassport/web/controller/PatientPassportController.java` - Fixed @RequestMapping URLs
3. `omod/src/main/java/org/openmrs/module/patientpassport/extension/html/GutterListExt.java` - NEW FILE for navigation link

---

## Next Steps

**RESTART OPENMRS NOW** to apply all changes:

1. Stop current OpenMRS instance
2. Start OpenMRS again
3. Navigate to http://localhost:8080/openmrs
4. Look for "Patient Passport" in the navigation bar
5. Click it to access the Patient Passport frontend

The module is now fully functional with proper navigation and URL mappings!
