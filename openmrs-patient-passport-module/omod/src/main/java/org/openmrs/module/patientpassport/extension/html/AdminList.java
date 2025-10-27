package org.openmrs.module.patientpassport.extension.html;

import java.util.LinkedHashMap;
import java.util.Map;

import org.openmrs.module.Extension;
import org.openmrs.module.web.extension.AdministrationSectionExt;

/**
 * This class defines the links that will appear on the administration page under the
 * "patientpassport.title" heading. 
 */
public class AdminList extends AdministrationSectionExt {

    /**
     * @see AdministrationSectionExt#getMediaType()
     */
    public Extension.MEDIA_TYPE getMediaType() {
        return Extension.MEDIA_TYPE.html;
    }
    
    /**
     * @see AdministrationSectionExt#getTitle()
     */
    public String getTitle() {
        return "Patient Passport";
    }
    
    /**
     * @see AdministrationSectionExt#getRequiredPrivilege()
     */
    public String getRequiredPrivilege() {
        return "View Administration Functions";
    }
    
    
    /**
     * @see AdministrationSectionExt#getLinks()
     */
    @Override
    public Map<String, String> getLinks() {
        LinkedHashMap<String, String> map = new LinkedHashMap<String, String>();
        
        map.put("module/patientpassport/iframe.form", "Patient Passport - Full Screen");
        map.put("module/patientpassport/manage.form", "Patient Passport - Settings");
        
        return map;
    }
    
}
