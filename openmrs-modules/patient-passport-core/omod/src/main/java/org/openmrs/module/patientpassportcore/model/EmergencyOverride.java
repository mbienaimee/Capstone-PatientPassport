package org.openmrs.module.patientpassportcore.model;

import org.openmrs.BaseOpenmrsData;
import org.openmrs.Patient;
import org.openmrs.User;

import java.util.Date;

/**
 * Model class for emergency override access
 */
public class EmergencyOverride extends BaseOpenmrsData {
	
	private Integer id;
	private User user;
	private Patient patient;
	private String justification;
	private Date accessTime;
	private String ipAddress;
	private String userAgent;
	
	public EmergencyOverride() {}
	
	public EmergencyOverride(User user, Patient patient, String justification) {
		this.user = user;
		this.patient = patient;
		this.justification = justification;
		this.accessTime = new Date();
	}
	
	@Override
	public Integer getId() {
		return id;
	}
	
	@Override
	public void setId(Integer id) {
		this.id = id;
	}
	
	public User getUser() {
		return user;
	}
	
	public void setUser(User user) {
		this.user = user;
	}
	
	public Patient getPatient() {
		return patient;
	}
	
	public void setPatient(Patient patient) {
		this.patient = patient;
	}
	
	public String getJustification() {
		return justification;
	}
	
	public void setJustification(String justification) {
		this.justification = justification;
	}
	
	public Date getAccessTime() {
		return accessTime;
	}
	
	public void setAccessTime(Date accessTime) {
		this.accessTime = accessTime;
	}
	
	public String getIpAddress() {
		return ipAddress;
	}
	
	public void setIpAddress(String ipAddress) {
		this.ipAddress = ipAddress;
	}
	
	public String getUserAgent() {
		return userAgent;
	}
	
	public void setUserAgent(String userAgent) {
		this.userAgent = userAgent;
	}
}

