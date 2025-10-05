package org.openmrs.module.patientpassportcore.model;

import org.openmrs.BaseOpenmrsData;
import org.openmrs.Patient;
import org.openmrs.User;

import java.util.Date;

/**
 * Model class for audit logging
 */
public class AuditLog extends BaseOpenmrsData {
	
	private Integer id;
	private User user;
	private Patient patient;
	private String accessType; // regular, emergency, consent
	private String action; // view, create, update, delete
	private String details;
	private Date accessTime;
	private String ipAddress;
	private String userAgent;
	
	public AuditLog() {}
	
	public AuditLog(User user, Patient patient, String accessType, String action, String details) {
		this.user = user;
		this.patient = patient;
		this.accessType = accessType;
		this.action = action;
		this.details = details;
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
	
	public String getAccessType() {
		return accessType;
	}
	
	public void setAccessType(String accessType) {
		this.accessType = accessType;
	}
	
	public String getAction() {
		return action;
	}
	
	public void setAction(String action) {
		this.action = action;
	}
	
	public String getDetails() {
		return details;
	}
	
	public void setDetails(String details) {
		this.details = details;
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

