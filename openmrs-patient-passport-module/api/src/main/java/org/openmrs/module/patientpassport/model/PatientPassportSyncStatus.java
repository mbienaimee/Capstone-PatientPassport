package org.openmrs.module.patientpassport.model;

import org.openmrs.BaseOpenmrsData;
import org.openmrs.Patient;

import java.util.Date;

/**
 * Model for Patient Passport Sync Status
 */
public class PatientPassportSyncStatus extends BaseOpenmrsData {
    
    private Integer syncId;
    private Patient patient;
    private Date lastSyncTimestamp;
    private String syncStatus;
    private String syncError;
    private Integer passportVersion;
    
    // Constructors
    public PatientPassportSyncStatus() {}
    
    public PatientPassportSyncStatus(Patient patient) {
        this.patient = patient;
        this.syncStatus = "PENDING";
        this.passportVersion = 1;
    }
    
    // Getters and Setters
    @Override
    public Integer getId() {
        return syncId;
    }
    
    @Override
    public void setId(Integer id) {
        this.syncId = id;
    }
    
    public Integer getSyncId() {
        return syncId;
    }
    
    public void setSyncId(Integer syncId) {
        this.syncId = syncId;
    }
    
    public Patient getPatient() {
        return patient;
    }
    
    public void setPatient(Patient patient) {
        this.patient = patient;
    }
    
    public Date getLastSyncTimestamp() {
        return lastSyncTimestamp;
    }
    
    public void setLastSyncTimestamp(Date lastSyncTimestamp) {
        this.lastSyncTimestamp = lastSyncTimestamp;
    }
    
    public String getSyncStatus() {
        return syncStatus;
    }
    
    public void setSyncStatus(String syncStatus) {
        this.syncStatus = syncStatus;
    }
    
    public String getSyncError() {
        return syncError;
    }
    
    public void setSyncError(String syncError) {
        this.syncError = syncError;
    }
    
    public Integer getPassportVersion() {
        return passportVersion;
    }
    
    public void setPassportVersion(Integer passportVersion) {
        this.passportVersion = passportVersion;
    }
}
