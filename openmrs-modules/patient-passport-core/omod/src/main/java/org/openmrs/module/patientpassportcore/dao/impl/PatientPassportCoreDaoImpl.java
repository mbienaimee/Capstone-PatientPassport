package org.openmrs.module.patientpassportcore.dao.impl;

import org.hibernate.SessionFactory;
import org.openmrs.Patient;
import org.openmrs.module.patientpassportcore.dao.PatientPassportCoreDao;
import org.openmrs.module.patientpassportcore.model.AuditLog;
import org.openmrs.module.patientpassportcore.model.EmergencyOverride;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Implementation of PatientPassportCoreDao
 */
@Repository
public class PatientPassportCoreDaoImpl implements PatientPassportCoreDao {
	
	@Autowired
	private SessionFactory sessionFactory;
	
	@Override
	public EmergencyOverride saveEmergencyOverride(EmergencyOverride emergencyOverride) {
		sessionFactory.getCurrentSession().saveOrUpdate(emergencyOverride);
		return emergencyOverride;
	}
	
	@Override
	public AuditLog saveAuditLog(AuditLog auditLog) {
		sessionFactory.getCurrentSession().saveOrUpdate(auditLog);
		return auditLog;
	}
	
	@Override
	@SuppressWarnings("unchecked")
	public List<AuditLog> getAuditLogsForPatient(Patient patient) {
		return sessionFactory.getCurrentSession()
			.createQuery("from AuditLog a where a.patient = :patient order by a.accessTime desc")
			.setParameter("patient", patient)
			.list();
	}
	
	@Override
	@SuppressWarnings("unchecked")
	public List<EmergencyOverride> getEmergencyOverrideLogs() {
		return sessionFactory.getCurrentSession()
			.createQuery("from EmergencyOverride e order by e.accessTime desc")
			.list();
	}
	
	@Override
	@SuppressWarnings("unchecked")
	public List<EmergencyOverride> getEmergencyOverridesForPatient(Patient patient) {
		return sessionFactory.getCurrentSession()
			.createQuery("from EmergencyOverride e where e.patient = :patient order by e.accessTime desc")
			.setParameter("patient", patient)
			.list();
	}
	
	@Override
	public int getTotalPatientCount() {
		Long count = (Long) sessionFactory.getCurrentSession()
			.createQuery("select count(*) from Patient p where p.voided = false")
			.uniqueResult();
		return count != null ? count.intValue() : 0;
	}
	
	@Override
	public int getSyncedPatientCount() {
		// This is a placeholder implementation
		// In a real implementation, you would track which patients have been synced
		Long count = (Long) sessionFactory.getCurrentSession()
			.createQuery("select count(distinct p) from Patient p join p.identifiers pi where pi.identifierType.name = 'UNIVERSAL_PATIENT_ID' and p.voided = false")
			.uniqueResult();
		return count != null ? count.intValue() : 0;
	}
}

