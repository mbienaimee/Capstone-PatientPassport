package org.openmrs.module.patientpassport.extension.html;

import org.openmrs.module.Extension;
import java.util.Map;
import java.util.LinkedHashMap;

/**
 * Extension to add Patient Passport link to the main navigation gutter
 */
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
