package org.openmrs.module.patientpassport.extension.html;

import org.openmrs.module.Extension;
import org.openmrs.module.web.extension.LinkExt;

/**
 * Extension to add Patient Passport link to the main navigation gutter
 */
public class GutterListExt extends LinkExt {
    
    @Override
    public Extension.MEDIA_TYPE getMediaType() {
        return Extension.MEDIA_TYPE.html;
    }
    
    @Override
    public String getLabel() {
        return "patientpassport.title";
    }
    
    @Override
    public String getUrl() {
        return "module/patientpassport/iframe.form";
    }
    
    @Override
    public String getRequiredPrivilege() {
        return "View Administration Functions";
    }
}
