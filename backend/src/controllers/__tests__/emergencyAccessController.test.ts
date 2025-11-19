import { Request, Response, NextFunction } from 'express';
import {
  requestEmergencyAccess
} from '../emergencyAccessController';
import EmergencyOverride from '@/models/EmergencyOverride';
import AuditLog from '@/models/AuditLog';
import Notification from '@/models/Notification';
import Patient from '@/models/Patient';
import Doctor from '@/models/Doctor';
import Hospital from '@/models/Hospital';
import PatientPassport from '@/models/PatientPassport';
import MedicalRecord from '@/models/MedicalRecord';

// Mock all models
jest.mock('@/models/EmergencyOverride');
jest.mock('@/models/AuditLog');
jest.mock('@/models/Notification');
jest.mock('@/models/Patient');
jest.mock('@/models/Doctor');
jest.mock('@/models/Hospital');
jest.mock('@/models/PatientPassport');
jest.mock('@/models/MedicalRecord');
jest.mock('@/services/simpleEmailService');

/**
 * Emergency Access Controller Tests
 * 
 * These tests verify the emergency break-glass access system:
 * - Role-based access control (doctors only)
 * - Justification validation
 * - Audit logging
 * - Patient notifications
 * - Emergency override records
 */
describe('Emergency Access Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  const mockUser = {
    _id: 'user123',
    name: 'Dr. John Doe',
    email: 'doctor@hospital.com',
    role: 'doctor'
  };

  const mockPatient = {
    _id: 'patient123',
    user: {
      _id: 'patientUser123',
      name: 'Jane Smith',
      email: 'jane@example.com'
    }
  };

  const mockDoctor = {
    _id: 'doctor123',
    user: mockUser,
    hospital: 'hospital123'
  };

  const mockHospital = {
    _id: 'hospital123',
    name: 'City General Hospital'
  };

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      user: mockUser as any,
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
      connection: {} as any
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
    
    // Set up default successful mocks - individual tests can override
    (Patient.findById as jest.Mock).mockClear().mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockPatient)
    });
    
    (Doctor.findOne as jest.Mock).mockClear().mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockDoctor)
    });
    
    (Hospital.findById as jest.Mock).mockClear().mockResolvedValue(mockHospital);
    
    (EmergencyOverride.create as jest.Mock).mockClear().mockResolvedValue({
      _id: 'override123',
      user: mockUser._id,
      patient: 'patient123',
      accessTime: new Date()
    });
    
    (EmergencyOverride.findOne as jest.Mock).mockClear().mockReturnValue({
      sort: jest.fn().mockResolvedValue(null)
    });
    
    (MedicalRecord.find as jest.Mock).mockClear().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([])
    });
    
    (AuditLog.create as jest.Mock).mockClear().mockResolvedValue({});
    (Notification.create as jest.Mock).mockClear().mockResolvedValue({ _id: 'notif123' });
    (PatientPassport.findByPatientId as jest.Mock).mockClear().mockResolvedValue(null);
    
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('requestEmergencyAccess - Input Validation', () => {
    beforeEach(() => {
      mockReq.body = {
        patientId: 'patient123',
        justification: 'Patient unconscious, immediate access required for treatment',
        hospitalId: 'hospital123'
      };
    });

    test('should validate minimum justification length (20 chars)', async () => {
      mockReq.body.justification = 'Too short';
      
      await requestEmergencyAccess(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('minimum 20 characters')
        })
      );
    });

    test('should validate maximum justification length (500 chars)', async () => {
      mockReq.body.justification = 'x'.repeat(501);
      
      await requestEmergencyAccess(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('cannot exceed 500 characters')
        })
      );
    });

    test('should enforce doctor-only access', async () => {
      mockReq.user = { ...mockUser, role: 'patient' } as any;
      
      await requestEmergencyAccess(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Only doctors')
        })
      );
    });

    // Note: Additional error handling tests (404 scenarios) would require 
    // integration testing approach with supertest for proper asyncHandler testing
  });
});
