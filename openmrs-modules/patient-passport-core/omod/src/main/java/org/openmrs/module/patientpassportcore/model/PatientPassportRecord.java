package org.openmrs.module.patientpassportcore.model;

import org.openmrs.BaseOpenmrsData;

import javax.persistence.*;
import java.util.Date;

/**
 * Model representing a Patient Passport record for cross-hospital access
 */
@Entity
@Table(name = "patient_passport_records")
public class PatientPassportRecord extends BaseOpenmrsData {
	
	private Integer id;
	private String universalId;
	private String patientName;
	private String nationalId;
	private String gender;
	private Date birthDate;
	private String phoneNumber;
	private String email;
	private String address;
	private String hospitalId;
	private String hospitalName;
	private String passportStatus;
	private Date lastSyncDate;
	private String medicalSummary;
	private String allergies;
	private String bloodType;
	private String emergencyContact;
	private String insuranceInfo;
	
	// Constructors
	public PatientPassportRecord() {}
	
	public PatientPassportRecord(String universalId, String patientName, String hospitalId) {
		this.universalId = universalId;
		this.patientName = patientName;
		this.hospitalId = hospitalId;
		this.passportStatus = "ACTIVE";
		this.lastSyncDate = new Date();
	}
	
	// Getters and Setters
	@Override
	public Integer getId() {
		return id;
	}
	
	@Override
	public void setId(Integer id) {
		this.id = id;
	}
	
	public String getUniversalId() {
		return universalId;
	}
	
	public void setUniversalId(String universalId) {
		this.universalId = universalId;
	}
	
	public String getPatientName() {
		return patientName;
	}
	
	public void setPatientName(String patientName) {
		this.patientName = patientName;
	}
	
	public String getNationalId() {
		return nationalId;
	}
	
	public void setNationalId(String nationalId) {
		this.nationalId = nationalId;
	}
	
	public String getGender() {
		return gender;
	}
	
	public void setGender(String gender) {
		this.gender = gender;
	}
	
	public Date getBirthDate() {
		return birthDate;
	}
	
	public void setBirthDate(Date birthDate) {
		this.birthDate = birthDate;
	}
	
	public String getPhoneNumber() {
		return phoneNumber;
	}
	
	public void setPhoneNumber(String phoneNumber) {
		this.phoneNumber = phoneNumber;
	}
	
	public String getEmail() {
		return email;
	}
	
	public void setEmail(String email) {
		this.email = email;
	}
	
	public String getAddress() {
		return address;
	}
	
	public void setAddress(String address) {
		this.address = address;
	}
	
	public String getHospitalId() {
		return hospitalId;
	}
	
	public void setHospitalId(String hospitalId) {
		this.hospitalId = hospitalId;
	}
	
	public String getHospitalName() {
		return hospitalName;
	}
	
	public void setHospitalName(String hospitalName) {
		this.hospitalName = hospitalName;
	}
	
	public String getPassportStatus() {
		return passportStatus;
	}
	
	public void setPassportStatus(String passportStatus) {
		this.passportStatus = passportStatus;
	}
	
	public Date getLastSyncDate() {
		return lastSyncDate;
	}
	
	public void setLastSyncDate(Date lastSyncDate) {
		this.lastSyncDate = lastSyncDate;
	}
	
	public String getMedicalSummary() {
		return medicalSummary;
	}
	
	public void setMedicalSummary(String medicalSummary) {
		this.medicalSummary = medicalSummary;
	}
	
	public String getAllergies() {
		return allergies;
	}
	
	public void setAllergies(String allergies) {
		this.allergies = allergies;
	}
	
	public String getBloodType() {
		return bloodType;
	}
	
	public void setBloodType(String bloodType) {
		this.bloodType = bloodType;
	}
	
	public String getEmergencyContact() {
		return emergencyContact;
	}
	
	public void setEmergencyContact(String emergencyContact) {
		this.emergencyContact = emergencyContact;
	}
	
	public String getInsuranceInfo() {
		return insuranceInfo;
	}
	
	public void setInsuranceInfo(String insuranceInfo) {
		this.insuranceInfo = insuranceInfo;
	}
	
	// Utility methods
	public boolean isActive() {
		return "ACTIVE".equals(passportStatus);
	}
	
	public boolean isPending() {
		return "PENDING".equals(passportStatus);
	}
	
	public boolean isSuspended() {
		return "SUSPENDED".equals(passportStatus);
	}
	
	public String getFormattedBirthDate() {
		if (birthDate != null) {
			return new java.text.SimpleDateFormat("yyyy-MM-dd").format(birthDate);
		}
		return null;
	}
	
	public String getFormattedLastSyncDate() {
		if (lastSyncDate != null) {
			return new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(lastSyncDate);
		}
		return null;
	}
	
	@Override
	public String toString() {
		return "PatientPassportRecord{" +
				"id=" + id +
				", universalId='" + universalId + '\'' +
				", patientName='" + patientName + '\'' +
				", nationalId='" + nationalId + '\'' +
				", hospitalId='" + hospitalId + '\'' +
				", hospitalName='" + hospitalName + '\'' +
				", passportStatus='" + passportStatus + '\'' +
				", lastSyncDate=" + lastSyncDate +
				'}';
	}
}







