package org.openmrs.module.patientpassportinteroperability;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.module.BaseModuleActivator;
import org.openmrs.module.ModuleException;

/**
 * This class contains the logic that is run every time this module is either started or stopped.
 */
public class PatientPassportInteroperabilityModuleActivator extends BaseModuleActivator {
	
	protected Log log = LogFactory.getLog(getClass());
	
	/**
	 * @see org.openmrs.module.Activator#startup()
	 */
	public void started() {
		log.info("Started Patient Passport Interoperability Module");
	}
	
	/**
	 * @see org.openmrs.module.Activator#shutdown()
	 */
	public void shutdown() {
		log.info("Shutdown Patient Passport Interoperability Module");
	}
}

