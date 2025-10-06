-- Patient Passport Standalone Database Schema
-- This creates a completely independent database for Patient Passport functionality
-- Hospitals can use this without giving access to their main OpenMRS database

-- Create the standalone database
CREATE DATABASE IF NOT EXISTS patient_passport_standalone;
USE patient_passport_standalone;

-- Patient Passport Records Table
CREATE TABLE IF NOT EXISTS patient_passport_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    universal_id VARCHAR(36) NOT NULL UNIQUE,
    patient_name VARCHAR(255) NOT NULL,
    national_id VARCHAR(50),
    gender VARCHAR(10),
    birth_date DATE,
    phone_number VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    hospital_id VARCHAR(50) NOT NULL,
    hospital_name VARCHAR(255),
    passport_status ENUM('ACTIVE', 'PENDING', 'SUSPENDED', 'EXPIRED') DEFAULT 'ACTIVE',
    last_sync_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    medical_summary TEXT,
    allergies TEXT,
    blood_type VARCHAR(10),
    emergency_contact TEXT,
    insurance_info TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    is_voided BOOLEAN DEFAULT FALSE,
    voided_date TIMESTAMP NULL,
    voided_by VARCHAR(100),
    void_reason TEXT,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    INDEX idx_universal_id (universal_id),
    INDEX idx_patient_name (patient_name),
    INDEX idx_national_id (national_id),
    INDEX idx_hospital_id (hospital_id),
    INDEX idx_passport_status (passport_status),
    INDEX idx_created_date (created_date)
);

-- Audit Log Table
CREATE TABLE IF NOT EXISTS patient_passport_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    universal_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    user_name VARCHAR(255),
    access_type VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    access_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    hospital_id VARCHAR(50),
    session_id VARCHAR(100),
    INDEX idx_universal_id (universal_id),
    INDEX idx_user_id (user_id),
    INDEX idx_access_time (access_time),
    INDEX idx_hospital_id (hospital_id)
);

-- Emergency Override Table
CREATE TABLE IF NOT EXISTS patient_passport_emergency_override (
    id INT AUTO_INCREMENT PRIMARY KEY,
    universal_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    user_name VARCHAR(255),
    justification TEXT NOT NULL,
    access_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    hospital_id VARCHAR(50),
    session_id VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NULL,
    INDEX idx_universal_id (universal_id),
    INDEX idx_user_id (user_id),
    INDEX idx_access_time (access_time),
    INDEX idx_hospital_id (hospital_id),
    INDEX idx_is_active (is_active)
);

-- Medical Records Table (for storing medical history)
CREATE TABLE IF NOT EXISTS patient_passport_medical_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    universal_id VARCHAR(36) NOT NULL,
    record_type ENUM('DIAGNOSIS', 'PRESCRIPTION', 'LAB_RESULT', 'VITAL', 'NOTE', 'ATTACHMENT') NOT NULL,
    record_title VARCHAR(255) NOT NULL,
    record_content TEXT,
    record_date DATE NOT NULL,
    hospital_id VARCHAR(50) NOT NULL,
    hospital_name VARCHAR(255),
    doctor_name VARCHAR(255),
    doctor_id VARCHAR(100),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_voided BOOLEAN DEFAULT FALSE,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    INDEX idx_universal_id (universal_id),
    INDEX idx_record_type (record_type),
    INDEX idx_record_date (record_date),
    INDEX idx_hospital_id (hospital_id)
);

-- Consent Management Table
CREATE TABLE IF NOT EXISTS patient_passport_consent (
    id INT AUTO_INCREMENT PRIMARY KEY,
    universal_id VARCHAR(36) NOT NULL,
    consent_type ENUM('DATA_SHARING', 'EMERGENCY_ACCESS', 'RESEARCH', 'ANALYTICS') NOT NULL,
    consent_status ENUM('GRANTED', 'DENIED', 'PENDING', 'EXPIRED') NOT NULL,
    granted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_date TIMESTAMP NULL,
    granted_by VARCHAR(100),
    hospital_id VARCHAR(50),
    consent_details TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_universal_id (universal_id),
    INDEX idx_consent_type (consent_type),
    INDEX idx_consent_status (consent_status),
    INDEX idx_hospital_id (hospital_id),
    INDEX idx_is_active (is_active)
);

-- Hospital Registry Table (for managing participating hospitals)
CREATE TABLE IF NOT EXISTS patient_passport_hospitals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hospital_id VARCHAR(50) NOT NULL UNIQUE,
    hospital_name VARCHAR(255) NOT NULL,
    hospital_code VARCHAR(20),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    contact_person VARCHAR(255),
    api_endpoint VARCHAR(500),
    api_key VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_sync_date TIMESTAMP NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_hospital_id (hospital_id),
    INDEX idx_hospital_code (hospital_code),
    INDEX idx_is_active (is_active)
);

-- Sync Log Table (for tracking data synchronization)
CREATE TABLE IF NOT EXISTS patient_passport_sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    universal_id VARCHAR(36) NOT NULL,
    source_hospital_id VARCHAR(50) NOT NULL,
    target_hospital_id VARCHAR(50) NOT NULL,
    sync_type ENUM('FULL', 'INCREMENTAL', 'EMERGENCY') NOT NULL,
    sync_status ENUM('SUCCESS', 'FAILED', 'PARTIAL', 'PENDING') NOT NULL,
    sync_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    records_synced INT DEFAULT 0,
    error_message TEXT,
    sync_duration_ms INT,
    created_by VARCHAR(100),
    INDEX idx_universal_id (universal_id),
    INDEX idx_source_hospital (source_hospital_id),
    INDEX idx_target_hospital (target_hospital_id),
    INDEX idx_sync_date (sync_date),
    INDEX idx_sync_status (sync_status)
);

-- Insert default hospital record
INSERT INTO patient_passport_hospitals (hospital_id, hospital_name, hospital_code, is_active) 
VALUES ('DEFAULT_HOSPITAL', 'Default Hospital', 'DEF001', TRUE)
ON DUPLICATE KEY UPDATE hospital_name = VALUES(hospital_name);

-- Create views for easier querying
CREATE VIEW patient_passport_summary AS
SELECT 
    ppr.universal_id,
    ppr.patient_name,
    ppr.national_id,
    ppr.gender,
    ppr.birth_date,
    ppr.hospital_name,
    ppr.passport_status,
    ppr.last_sync_date,
    COUNT(DISTINCT pmr.id) as medical_records_count,
    COUNT(DISTINCT pal.id) as access_logs_count
FROM patient_passport_records ppr
LEFT JOIN patient_passport_medical_records pmr ON ppr.universal_id = pmr.universal_id
LEFT JOIN patient_passport_audit_log pal ON ppr.universal_id = pal.universal_id
WHERE ppr.is_voided = FALSE
GROUP BY ppr.universal_id, ppr.patient_name, ppr.national_id, ppr.gender, 
         ppr.birth_date, ppr.hospital_name, ppr.passport_status, ppr.last_sync_date;

-- Create indexes for better performance
CREATE INDEX idx_patient_passport_records_status_date ON patient_passport_records(passport_status, last_sync_date);
CREATE INDEX idx_audit_log_universal_time ON patient_passport_audit_log(universal_id, access_time);
CREATE INDEX idx_medical_records_universal_date ON patient_passport_medical_records(universal_id, record_date);




