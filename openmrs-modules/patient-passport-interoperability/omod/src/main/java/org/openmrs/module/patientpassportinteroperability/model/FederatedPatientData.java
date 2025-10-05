package org.openmrs.module.patientpassportinteroperability.model;

import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * Model class for federated patient data
 */
public class FederatedPatientData {
	
	private String universalId;
	private String patientName;
	private String gender;
	private Date birthdate;
	private List<HospitalData> hospitalData;
	private Date lastUpdated;
	
	public FederatedPatientData() {}
	
	public FederatedPatientData(String universalId) {
		this.universalId = universalId;
		this.lastUpdated = new Date();
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
	
	public String getGender() {
		return gender;
	}
	
	public void setGender(String gender) {
		this.gender = gender;
	}
	
	public Date getBirthdate() {
		return birthdate;
	}
	
	public void setBirthdate(Date birthdate) {
		this.birthdate = birthdate;
	}
	
	public List<HospitalData> getHospitalData() {
		return hospitalData;
	}
	
	public void setHospitalData(List<HospitalData> hospitalData) {
		this.hospitalData = hospitalData;
	}
	
	public Date getLastUpdated() {
		return lastUpdated;
	}
	
	public void setLastUpdated(Date lastUpdated) {
		this.lastUpdated = lastUpdated;
	}
	
	public static class HospitalData {
		private String hospitalId;
		private String hospitalName;
		private String fhirData;
		private Date lastSync;
		private List<String> availableResources;
		
		public HospitalData() {}
		
		public HospitalData(String hospitalId, String hospitalName) {
			this.hospitalId = hospitalId;
			this.hospitalName = hospitalName;
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
		
		public String getFhirData() {
			return fhirData;
		}
		
		public void setFhirData(String fhirData) {
			this.fhirData = fhirData;
		}
		
		public Date getLastSync() {
			return lastSync;
		}
		
		public void setLastSync(Date lastSync) {
			this.lastSync = lastSync;
		}
		
		public List<String> getAvailableResources() {
			return availableResources;
		}
		
		public void setAvailableResources(List<String> availableResources) {
			this.availableResources = availableResources;
		}
	}
}

