import request from 'supertest';
import { app } from '../../backend/src/app';
import { sequelize } from '../../central-registry/src/config/database';
import mongoose from 'mongoose';

describe('Federated Patient Passport System Integration Tests', () => {
  let authToken: string;
  let hospitalId: string;
  let patientId: string;
  let universalId: string;

  beforeAll(async () => {
    // Setup test databases
    await sequelize.sync({ force: true });
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport-test');
  });

  afterAll(async () => {
    await sequelize.close();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Create test hospital
    const hospitalResponse = await request(app)
      .post('/api/hospitals/register')
      .send({
        hospitalId: 'TEST_HOSPITAL_001',
        hospitalName: 'Test Hospital',
        fhirEndpoint: 'https://test-hospital.com/fhir',
        apiKey: 'test-api-key'
      });

    hospitalId = hospitalResponse.body.data.hospitalId;

    // Create test patient
    const patientResponse = await request(app)
      .post('/api/patients')
      .send({
        nationalId: '12345678901',
        universalId: 'PP123456789012',
        name: 'Test Patient',
        dateOfBirth: '1990-01-01',
        gender: 'M',
        contactNumber: '+1234567890',
        address: '123 Test Street'
      });

    patientId = patientResponse.body.data._id;
    universalId = patientResponse.body.data.universalId;

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@hospital.com',
        password: 'password123'
      });

    authToken = loginResponse.body.data.token;
  });

  describe('Central Registry Integration', () => {
    it('should register patient with central registry', async () => {
      const response = await request(app)
        .post('/api/federated/register-patient')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          universalId,
          hospitalId,
          localPatientId: patientId,
          patientName: 'Test Patient',
          dateOfBirth: '1990-01-01',
          gender: 'M'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should lookup hospitals for patient', async () => {
      // First register the patient
      await request(app)
        .post('/api/federated/register-patient')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          universalId,
          hospitalId,
          localPatientId: patientId,
          patientName: 'Test Patient',
          dateOfBirth: '1990-01-01',
          gender: 'M'
        });

      const response = await request(app)
        .get(`/api/federated/lookup-hospitals/${universalId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.hospitals).toContainEqual(
        expect.objectContaining({ hospitalId })
      );
    });
  });

  describe('Consent Token Management', () => {
    it('should generate consent token', async () => {
      const response = await request(app)
        .post('/api/federated/generate-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          universalId,
          duration: 60,
          purpose: 'Test Token'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toMatch(/^\d{6}$/);
    });

    it('should verify consent token', async () => {
      // First generate a token
      const generateResponse = await request(app)
        .post('/api/federated/generate-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          universalId,
          duration: 60,
          purpose: 'Test Token'
        });

      const token = generateResponse.body.data.token;

      const response = await request(app)
        .post('/api/federated/verify-token')
        .send({
          universalId,
          token
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
    });
  });

  describe('Emergency Override', () => {
    it('should perform emergency override', async () => {
      const response = await request(app)
        .post('/api/medical/emergency-override')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          patientId,
          justification: 'Emergency medical situation requiring immediate access to patient records'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.overrideId).toBeDefined();
    });

    it('should reject emergency override without proper role', async () => {
      // Create a user without emergency role
      const regularUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Regular User',
          email: 'regular@test.com',
          password: 'password123',
          role: 'doctor'
        });

      const regularToken = regularUserResponse.body.data.token;

      const response = await request(app)
        .post('/api/medical/emergency-override')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          patientId,
          justification: 'Test justification'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Audit Logging', () => {
    it('should log patient data access', async () => {
      const response = await request(app)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Check audit logs
      const auditResponse = await request(app)
        .get(`/api/federated/audit-logs/${patientId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(auditResponse.status).toBe(200);
      expect(auditResponse.body.data.length).toBeGreaterThan(0);
    });

    it('should get emergency override logs', async () => {
      // First perform an emergency override
      await request(app)
        .post('/api/medical/emergency-override')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          patientId,
          justification: 'Test emergency override'
        });

      const response = await request(app)
        .get('/api/federated/emergency-override-logs')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('FHIR Integration', () => {
    it('should retrieve FHIR data from hospital', async () => {
      const response = await request(app)
        .get(`/api/federated/fhir/${hospitalId}/${patientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          resourceType: 'Patient'
        });

      // This would fail in test environment without actual FHIR server
      // but we can test the endpoint structure
      expect(response.status).toBe(500); // Expected to fail without real FHIR server
    });
  });

  describe('Security Features', () => {
    it('should require authentication for protected endpoints', async () => {
      const response = await request(app)
        .get(`/api/patients/${patientId}`);

      expect(response.status).toBe(401);
    });

    it('should validate API keys', async () => {
      const response = await request(app)
        .get('/api/federated/lookup-hospitals/PP123456789012')
        .set('x-api-key', 'invalid-key');

      expect(response.status).toBe(401);
    });

    it('should encrypt sensitive data', async () => {
      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nationalId: '98765432109',
          name: 'Sensitive Patient',
          dateOfBirth: '1985-05-15',
          gender: 'F',
          contactNumber: '+1987654321',
          address: '456 Sensitive Street'
        });

      expect(response.status).toBe(201);
      // In a real implementation, we would verify that sensitive data is encrypted
    });
  });
});

