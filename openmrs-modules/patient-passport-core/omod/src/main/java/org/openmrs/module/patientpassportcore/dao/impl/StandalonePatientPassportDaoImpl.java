package org.openmrs.module.patientpassportcore.dao.impl;

import org.openmrs.module.patientpassportcore.dao.PatientPassportCoreDao;
import org.openmrs.module.patientpassportcore.model.AuditLog;
import org.openmrs.module.patientpassportcore.model.EmergencyOverride;
import org.openmrs.module.patientpassportcore.model.PatientPassportRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;
import java.util.List;
import java.util.UUID;

/**
 * Standalone implementation of PatientPassportCoreDao that uses its own database
 * This allows the module to work independently without accessing the main OpenMRS database
 */
@Repository("standalonePatientPassportDao")
@Transactional("patientPassportTransactionManager")
public class StandalonePatientPassportDaoImpl implements PatientPassportCoreDao {
    
    @PersistenceContext(unitName = "patientPassportPU")
    private EntityManager entityManager;
    
    @Override
    public EmergencyOverride saveEmergencyOverride(EmergencyOverride emergencyOverride) {
        if (emergencyOverride.getUuid() == null) {
            emergencyOverride.setUuid(UUID.randomUUID().toString());
        }
        entityManager.persist(emergencyOverride);
        return emergencyOverride;
    }
    
    @Override
    public AuditLog saveAuditLog(AuditLog auditLog) {
        if (auditLog.getUuid() == null) {
            auditLog.setUuid(UUID.randomUUID().toString());
        }
        entityManager.persist(auditLog);
        return auditLog;
    }
    
    @Override
    @SuppressWarnings("unchecked")
    public List<AuditLog> getAuditLogsForPatient(Patient patient) {
        // Since we're using standalone database, we need to work with universal_id instead of Patient object
        String universalId = getUniversalIdForPatient(patient);
        if (universalId == null) {
            return List.of();
        }
        
        Query query = entityManager.createQuery(
            "SELECT a FROM AuditLog a WHERE a.universalId = :universalId ORDER BY a.accessTime DESC"
        );
        query.setParameter("universalId", universalId);
        return query.getResultList();
    }
    
    @Override
    @SuppressWarnings("unchecked")
    public List<EmergencyOverride> getEmergencyOverrideLogs() {
        Query query = entityManager.createQuery(
            "SELECT e FROM EmergencyOverride e ORDER BY e.accessTime DESC"
        );
        return query.getResultList();
    }
    
    @Override
    @SuppressWarnings("unchecked")
    public List<EmergencyOverride> getEmergencyOverridesForPatient(Patient patient) {
        String universalId = getUniversalIdForPatient(patient);
        if (universalId == null) {
            return List.of();
        }
        
        Query query = entityManager.createQuery(
            "SELECT e FROM EmergencyOverride e WHERE e.universalId = :universalId ORDER BY e.accessTime DESC"
        );
        query.setParameter("universalId", universalId);
        return query.getResultList();
    }
    
    @Override
    public int getTotalPatientCount() {
        Query query = entityManager.createQuery(
            "SELECT COUNT(p) FROM PatientPassportRecord p WHERE p.isVoided = false"
        );
        Long count = (Long) query.getSingleResult();
        return count != null ? count.intValue() : 0;
    }
    
    @Override
    public int getSyncedPatientCount() {
        Query query = entityManager.createQuery(
            "SELECT COUNT(p) FROM PatientPassportRecord p WHERE p.passportStatus = 'ACTIVE' AND p.isVoided = false"
        );
        Long count = (Long) query.getSingleResult();
        return count != null ? count.intValue() : 0;
    }
    
    // Additional methods for standalone functionality
    
    public PatientPassportRecord savePatientPassportRecord(PatientPassportRecord record) {
        if (record.getUuid() == null) {
            record.setUuid(UUID.randomUUID().toString());
        }
        if (record.getUniversalId() == null) {
            record.setUniversalId(UUID.randomUUID().toString());
        }
        entityManager.persist(record);
        return record;
    }
    
    public PatientPassportRecord getPatientPassportRecordByUniversalId(String universalId) {
        Query query = entityManager.createQuery(
            "SELECT p FROM PatientPassportRecord p WHERE p.universalId = :universalId AND p.isVoided = false"
        );
        query.setParameter("universalId", universalId);
        try {
            return (PatientPassportRecord) query.getSingleResult();
        } catch (Exception e) {
            return null;
        }
    }
    
    @SuppressWarnings("unchecked")
    public List<PatientPassportRecord> getAllPatientPassportRecords() {
        Query query = entityManager.createQuery(
            "SELECT p FROM PatientPassportRecord p WHERE p.isVoided = false ORDER BY p.createdDate DESC"
        );
        return query.getResultList();
    }
    
    @SuppressWarnings("unchecked")
    public List<PatientPassportRecord> getPatientPassportRecordsByHospital(String hospitalId) {
        Query query = entityManager.createQuery(
            "SELECT p FROM PatientPassportRecord p WHERE p.hospitalId = :hospitalId AND p.isVoided = false ORDER BY p.createdDate DESC"
        );
        query.setParameter("hospitalId", hospitalId);
        return query.getResultList();
    }
    
    public void deletePatientPassportRecord(String universalId) {
        Query query = entityManager.createQuery(
            "UPDATE PatientPassportRecord p SET p.isVoided = true, p.voidedDate = CURRENT_TIMESTAMP WHERE p.universalId = :universalId"
        );
        query.setParameter("universalId", universalId);
        query.executeUpdate();
    }
    
    // Helper method to get universal ID from OpenMRS Patient
    private String getUniversalIdForPatient(Patient patient) {
        if (patient == null) {
            return null;
        }
        
        // Try to find existing passport record by patient identifiers
        for (org.openmrs.PatientIdentifier identifier : patient.getIdentifiers()) {
            if ("UNIVERSAL_PATIENT_ID".equals(identifier.getIdentifierType().getName())) {
                return identifier.getIdentifier();
            }
        }
        
        // If no universal ID found, try to find by other identifiers
        Query query = entityManager.createQuery(
            "SELECT p FROM PatientPassportRecord p WHERE p.nationalId = :nationalId AND p.isVoided = false"
        );
        query.setParameter("nationalId", patient.getPatientIdentifier().getIdentifier());
        try {
            PatientPassportRecord record = (PatientPassportRecord) query.getSingleResult();
            return record.getUniversalId();
        } catch (Exception e) {
            return null;
        }
    }
}










