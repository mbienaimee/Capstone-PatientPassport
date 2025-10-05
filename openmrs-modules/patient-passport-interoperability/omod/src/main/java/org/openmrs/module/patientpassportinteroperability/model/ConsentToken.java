package org.openmrs.module.patientpassportinteroperability.model;

import org.openmrs.BaseOpenmrsData;

import java.util.Date;
import java.util.UUID;

/**
 * Model class for consent tokens
 */
public class ConsentToken extends BaseOpenmrsData {
	
	private Integer id;
	private String tokenId;
	private String universalId;
	private String token;
	private Date expiresAt;
	private boolean isActive;
	private String createdBy;
	
	public ConsentToken() {}
	
	public ConsentToken(String universalId, int durationMinutes) {
		this.tokenId = UUID.randomUUID().toString();
		this.universalId = universalId;
		this.token = generateToken();
		this.expiresAt = new Date(System.currentTimeMillis() + (durationMinutes * 60 * 1000));
		this.isActive = true;
	}
	
	private String generateToken() {
		// Generate a 6-digit numeric token
		return String.format("%06d", (int) (Math.random() * 1000000));
	}
	
	@Override
	public Integer getId() {
		return id;
	}
	
	@Override
	public void setId(Integer id) {
		this.id = id;
	}
	
	public String getTokenId() {
		return tokenId;
	}
	
	public void setTokenId(String tokenId) {
		this.tokenId = tokenId;
	}
	
	public String getUniversalId() {
		return universalId;
	}
	
	public void setUniversalId(String universalId) {
		this.universalId = universalId;
	}
	
	public String getToken() {
		return token;
	}
	
	public void setToken(String token) {
		this.token = token;
	}
	
	public Date getExpiresAt() {
		return expiresAt;
	}
	
	public void setExpiresAt(Date expiresAt) {
		this.expiresAt = expiresAt;
	}
	
	public boolean isActive() {
		return isActive;
	}
	
	public void setActive(boolean active) {
		isActive = active;
	}
	
	public String getCreatedBy() {
		return createdBy;
	}
	
	public void setCreatedBy(String createdBy) {
		this.createdBy = createdBy;
	}
	
	public boolean isExpired() {
		return new Date().after(expiresAt);
	}
	
	public boolean isValid() {
		return isActive && !isExpired();
	}
}

