package org.openmrs.module.patientpassport.dto;

import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * DTO for Patient Passport data
 */
public class PatientPassportDTO {
    
    private String passportId;
    private String patientId;
    private String nationalId;
    private String universalId;
    
    // Personal Information
    private PersonalInfoDTO personalInfo;
    
    // Medical Information
    private MedicalInfoDTO medicalInfo;
    
    // Test Results
    private List<TestResultDTO> testResults;
    
    // Hospital Visits
    private List<HospitalVisitDTO> hospitalVisits;
    
    // Insurance Information
    private InsuranceInfoDTO insurance;
    
    // Access Control
    private List<AccessHistoryDTO> accessHistory;
    
    // Metadata
    private Date lastUpdated;
    private String lastUpdatedBy;
    private Integer version;
    private Boolean isActive;
    
    // Constructors
    public PatientPassportDTO() {}
    
    public PatientPassportDTO(String passportId, String patientId) {
        this.passportId = passportId;
        this.patientId = patientId;
    }
    
    // Getters and Setters
    public String getPassportId() {
        return passportId;
    }
    
    public void setPassportId(String passportId) {
        this.passportId = passportId;
    }
    
    public String getPatientId() {
        return patientId;
    }
    
    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }
    
    public String getNationalId() {
        return nationalId;
    }
    
    public void setNationalId(String nationalId) {
        this.nationalId = nationalId;
    }
    
    public String getUniversalId() {
        return universalId;
    }
    
    public void setUniversalId(String universalId) {
        this.universalId = universalId;
    }
    
    public PersonalInfoDTO getPersonalInfo() {
        return personalInfo;
    }
    
    public void setPersonalInfo(PersonalInfoDTO personalInfo) {
        this.personalInfo = personalInfo;
    }
    
    public MedicalInfoDTO getMedicalInfo() {
        return medicalInfo;
    }
    
    public void setMedicalInfo(MedicalInfoDTO medicalInfo) {
        this.medicalInfo = medicalInfo;
    }
    
    public List<TestResultDTO> getTestResults() {
        return testResults;
    }
    
    public void setTestResults(List<TestResultDTO> testResults) {
        this.testResults = testResults;
    }
    
    public List<HospitalVisitDTO> getHospitalVisits() {
        return hospitalVisits;
    }
    
    public void setHospitalVisits(List<HospitalVisitDTO> hospitalVisits) {
        this.hospitalVisits = hospitalVisits;
    }
    
    public InsuranceInfoDTO getInsurance() {
        return insurance;
    }
    
    public void setInsurance(InsuranceInfoDTO insurance) {
        this.insurance = insurance;
    }
    
    public List<AccessHistoryDTO> getAccessHistory() {
        return accessHistory;
    }
    
    public void setAccessHistory(List<AccessHistoryDTO> accessHistory) {
        this.accessHistory = accessHistory;
    }
    
    public Date getLastUpdated() {
        return lastUpdated;
    }
    
    public void setLastUpdated(Date lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
    
    public String getLastUpdatedBy() {
        return lastUpdatedBy;
    }
    
    public void setLastUpdatedBy(String lastUpdatedBy) {
        this.lastUpdatedBy = lastUpdatedBy;
    }
    
    public Integer getVersion() {
        return version;
    }
    
    public void setVersion(Integer version) {
        this.version = version;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    /**
     * Personal Information DTO
     */
    public static class PersonalInfoDTO {
        private String fullName;
        private String nationalId;
        private Date dateOfBirth;
        private String gender;
        private String bloodType;
        private String contactNumber;
        private String email;
        private String address;
        private EmergencyContactDTO emergencyContact;
        
        // Getters and Setters
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        
        public String getNationalId() { return nationalId; }
        public void setNationalId(String nationalId) { this.nationalId = nationalId; }
        
        public Date getDateOfBirth() { return dateOfBirth; }
        public void setDateOfBirth(Date dateOfBirth) { this.dateOfBirth = dateOfBirth; }
        
        public String getGender() { return gender; }
        public void setGender(String gender) { this.gender = gender; }
        
        public String getBloodType() { return bloodType; }
        public void setBloodType(String bloodType) { this.bloodType = bloodType; }
        
        public String getContactNumber() { return contactNumber; }
        public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        
        public EmergencyContactDTO getEmergencyContact() { return emergencyContact; }
        public void setEmergencyContact(EmergencyContactDTO emergencyContact) { this.emergencyContact = emergencyContact; }
    }
    
    /**
     * Emergency Contact DTO
     */
    public static class EmergencyContactDTO {
        private String name;
        private String relationship;
        private String phone;
        
        // Getters and Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getRelationship() { return relationship; }
        public void setRelationship(String relationship) { this.relationship = relationship; }
        
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
    }
    
    /**
     * Medical Information DTO
     */
    public static class MedicalInfoDTO {
        private List<String> allergies;
        private List<MedicationDTO> currentMedications;
        private List<MedicalConditionDTO> medicalConditions;
        private List<ImmunizationDTO> immunizations;
        private List<SurgeryDTO> surgeries;
        
        // Getters and Setters
        public List<String> getAllergies() { return allergies; }
        public void setAllergies(List<String> allergies) { this.allergies = allergies; }
        
        public List<MedicationDTO> getCurrentMedications() { return currentMedications; }
        public void setCurrentMedications(List<MedicationDTO> currentMedications) { this.currentMedications = currentMedications; }
        
        public List<MedicalConditionDTO> getMedicalConditions() { return medicalConditions; }
        public void setMedicalConditions(List<MedicalConditionDTO> medicalConditions) { this.medicalConditions = medicalConditions; }
        
        public List<ImmunizationDTO> getImmunizations() { return immunizations; }
        public void setImmunizations(List<ImmunizationDTO> immunizations) { this.immunizations = immunizations; }
        
        public List<SurgeryDTO> getSurgeries() { return surgeries; }
        public void setSurgeries(List<SurgeryDTO> surgeries) { this.surgeries = surgeries; }
    }
    
    /**
     * Medication DTO
     */
    public static class MedicationDTO {
        private String name;
        private String dosage;
        private String frequency;
        private String prescribedBy;
        private Date startDate;
        
        // Getters and Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getDosage() { return dosage; }
        public void setDosage(String dosage) { this.dosage = dosage; }
        
        public String getFrequency() { return frequency; }
        public void setFrequency(String frequency) { this.frequency = frequency; }
        
        public String getPrescribedBy() { return prescribedBy; }
        public void setPrescribedBy(String prescribedBy) { this.prescribedBy = prescribedBy; }
        
        public Date getStartDate() { return startDate; }
        public void setStartDate(Date startDate) { this.startDate = startDate; }
    }
    
    /**
     * Medical Condition DTO
     */
    public static class MedicalConditionDTO {
        private String condition;
        private Date diagnosedDate;
        private String diagnosedBy;
        private String status;
        private String notes;
        
        // Getters and Setters
        public String getCondition() { return condition; }
        public void setCondition(String condition) { this.condition = condition; }
        
        public Date getDiagnosedDate() { return diagnosedDate; }
        public void setDiagnosedDate(Date diagnosedDate) { this.diagnosedDate = diagnosedDate; }
        
        public String getDiagnosedBy() { return diagnosedBy; }
        public void setDiagnosedBy(String diagnosedBy) { this.diagnosedBy = diagnosedBy; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }
    
    /**
     * Immunization DTO
     */
    public static class ImmunizationDTO {
        private String vaccine;
        private Date date;
        private String administeredBy;
        private String batchNumber;
        
        // Getters and Setters
        public String getVaccine() { return vaccine; }
        public void setVaccine(String vaccine) { this.vaccine = vaccine; }
        
        public Date getDate() { return date; }
        public void setDate(Date date) { this.date = date; }
        
        public String getAdministeredBy() { return administeredBy; }
        public void setAdministeredBy(String administeredBy) { this.administeredBy = administeredBy; }
        
        public String getBatchNumber() { return batchNumber; }
        public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }
    }
    
    /**
     * Surgery DTO
     */
    public static class SurgeryDTO {
        private String procedure;
        private Date date;
        private String surgeon;
        private String hospital;
        private String notes;
        
        // Getters and Setters
        public String getProcedure() { return procedure; }
        public void setProcedure(String procedure) { this.procedure = procedure; }
        
        public Date getDate() { return date; }
        public void setDate(Date date) { this.date = date; }
        
        public String getSurgeon() { return surgeon; }
        public void setSurgeon(String surgeon) { this.surgeon = surgeon; }
        
        public String getHospital() { return hospital; }
        public void setHospital(String hospital) { this.hospital = hospital; }
        
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }
    
    /**
     * Test Result DTO
     */
    public static class TestResultDTO {
        private String testType;
        private Date testDate;
        private String results;
        private String normalRange;
        private String status;
        private String labTechnician;
        private String notes;
        
        // Getters and Setters
        public String getTestType() { return testType; }
        public void setTestType(String testType) { this.testType = testType; }
        
        public Date getTestDate() { return testDate; }
        public void setTestDate(Date testDate) { this.testDate = testDate; }
        
        public String getResults() { return results; }
        public void setResults(String results) { this.results = results; }
        
        public String getNormalRange() { return normalRange; }
        public void setNormalRange(String normalRange) { this.normalRange = normalRange; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public String getLabTechnician() { return labTechnician; }
        public void setLabTechnician(String labTechnician) { this.labTechnician = labTechnician; }
        
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }
    
    /**
     * Hospital Visit DTO
     */
    public static class HospitalVisitDTO {
        private Date visitDate;
        private String hospital;
        private String doctor;
        private String reason;
        private String diagnosis;
        private String treatment;
        private Boolean followUpRequired;
        private Date followUpDate;
        private String notes;
        
        // Getters and Setters
        public Date getVisitDate() { return visitDate; }
        public void setVisitDate(Date visitDate) { this.visitDate = visitDate; }
        
        public String getHospital() { return hospital; }
        public void setHospital(String hospital) { this.hospital = hospital; }
        
        public String getDoctor() { return doctor; }
        public void setDoctor(String doctor) { this.doctor = doctor; }
        
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        
        public String getDiagnosis() { return diagnosis; }
        public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
        
        public String getTreatment() { return treatment; }
        public void setTreatment(String treatment) { this.treatment = treatment; }
        
        public Boolean getFollowUpRequired() { return followUpRequired; }
        public void setFollowUpRequired(Boolean followUpRequired) { this.followUpRequired = followUpRequired; }
        
        public Date getFollowUpDate() { return followUpDate; }
        public void setFollowUpDate(Date followUpDate) { this.followUpDate = followUpDate; }
        
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }
    
    /**
     * Insurance Information DTO
     */
    public static class InsuranceInfoDTO {
        private String provider;
        private String policyNumber;
        private String groupNumber;
        private Date effectiveDate;
        private Date expiryDate;
        private String coverageType;
        
        // Getters and Setters
        public String getProvider() { return provider; }
        public void setProvider(String provider) { this.provider = provider; }
        
        public String getPolicyNumber() { return policyNumber; }
        public void setPolicyNumber(String policyNumber) { this.policyNumber = policyNumber; }
        
        public String getGroupNumber() { return groupNumber; }
        public void setGroupNumber(String groupNumber) { this.groupNumber = groupNumber; }
        
        public Date getEffectiveDate() { return effectiveDate; }
        public void setEffectiveDate(Date effectiveDate) { this.effectiveDate = effectiveDate; }
        
        public Date getExpiryDate() { return expiryDate; }
        public void setExpiryDate(Date expiryDate) { this.expiryDate = expiryDate; }
        
        public String getCoverageType() { return coverageType; }
        public void setCoverageType(String coverageType) { this.coverageType = coverageType; }
    }
    
    /**
     * Access History DTO
     */
    public static class AccessHistoryDTO {
        private String doctor;
        private Date accessDate;
        private String accessType;
        private String reason;
        private Boolean otpVerified;
        
        // Getters and Setters
        public String getDoctor() { return doctor; }
        public void setDoctor(String doctor) { this.doctor = doctor; }
        
        public Date getAccessDate() { return accessDate; }
        public void setAccessDate(Date accessDate) { this.accessDate = accessDate; }
        
        public String getAccessType() { return accessType; }
        public void setAccessType(String accessType) { this.accessType = accessType; }
        
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        
        public Boolean getOtpVerified() { return otpVerified; }
        public void setOtpVerified(Boolean otpVerified) { this.otpVerified = otpVerified; }
    }
}
