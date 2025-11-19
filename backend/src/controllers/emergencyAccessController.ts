import { Request, Response, NextFunction } from 'express';
import EmergencyOverride from '@/models/EmergencyOverride';
import AuditLog from '@/models/AuditLog';
import Notification from '@/models/Notification';
import Patient from '@/models/Patient';
import Doctor from '@/models/Doctor';
import Hospital from '@/models/Hospital';
import PatientPassport from '@/models/PatientPassport';
import MedicalRecord from '@/models/MedicalRecord';
import { asyncHandler, CustomError } from '@/middleware/errorHandler';
import { sendNotificationEmail } from '@/services/simpleEmailService';

// @desc    Request emergency break-glass access to patient records
// @route   POST /api/emergency-access/request
// @access  Private (Doctor)
export const requestEmergencyAccess = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { patientId, justification, hospitalId } = req.body;
  const user = req.user;

  // Only doctors can request emergency access
  if (user.role !== 'doctor') {
    throw new CustomError('Only doctors can request emergency break-glass access', 403);
  }

  // Validate justification length
  if (!justification || justification.trim().length < 20) {
    throw new CustomError('Detailed justification is required (minimum 20 characters)', 400);
  }

  if (justification.length > 500) {
    throw new CustomError('Justification cannot exceed 500 characters', 400);
  }

  // Find patient
  const patient = await Patient.findById(patientId).populate('user', 'name email');
  if (!patient) {
    throw new CustomError('Patient not found', 404);
  }

  // Find doctor
  const doctor = await Doctor.findOne({ user: user._id }).populate('user', 'name email');
  if (!doctor) {
    throw new CustomError('Doctor profile not found', 404);
  }

  // Find hospital if provided
  let hospital = null;
  if (hospitalId) {
    hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      throw new CustomError('Hospital not found', 404);
    }
  } else if (doctor.hospital) {
    hospital = await Hospital.findById(doctor.hospital);
  }

  // Extract IP address and user agent
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  console.log(`🚨 EMERGENCY ACCESS REQUEST`);
  console.log(`   Doctor: ${doctor.user.name} (${doctor.user.email})`);
  console.log(`   Patient: ${patient.user.name} (${patient.user.email})`);
  console.log(`   Hospital: ${hospital ? hospital.name : 'Not specified'}`);
  console.log(`   Justification: ${justification}`);
  console.log(`   IP Address: ${ipAddress}`);
  console.log(`   Time: ${new Date().toISOString()}`);

  // Create emergency override record
  const emergencyOverride = await EmergencyOverride.create({
    user: user._id,
    patient: patientId,
    justification: justification.trim(),
    accessTime: new Date(),
    ipAddress: ipAddress?.toString(),
    userAgent: userAgent?.toString()
  });

  // Create audit log entry
  await AuditLog.create({
    user: user._id,
    patient: patientId,
    accessType: 'emergency',
    action: 'view',
    details: `Emergency break-glass access requested. Reason: ${justification}. Hospital: ${hospital ? hospital.name : 'N/A'}`,
    accessTime: new Date(),
    ipAddress: ipAddress?.toString(),
    userAgent: userAgent?.toString()
  });

  // Add access record to patient passport asynchronously (non-blocking)
  setImmediate(async () => {
    try {
      const passport = await PatientPassport.findByPatientId(patientId);
      if (passport) {
        await passport.addAccessRecord(
          doctor._id.toString(),
          'view',
          `EMERGENCY ACCESS: ${justification}`,
          false // No OTP for emergency access
        );
      }
    } catch (error) {
      console.error('Error updating passport access history:', error);
    }
  });

  // Create urgent notification for patient
  const notification = await Notification.create({
    userId: patient.user._id.toString(),
    type: 'emergency_access',
    title: '🚨 EMERGENCY ACCESS - Your Medical Records Were Accessed',
    message: `Dr. ${doctor.user.name} from ${hospital ? hospital.name : 'a medical facility'} accessed your medical records under Emergency Break-Glass Protocol.`,
    data: {
      emergencyOverrideId: emergencyOverride._id,
      doctorId: doctor._id,
      doctorName: doctor.user.name,
      doctorEmail: doctor.user.email,
      hospitalId: hospital?._id,
      hospitalName: hospital?.name,
      justification,
      accessTime: new Date(),
      ipAddress: ipAddress?.toString()
    },
    priority: 'urgent',
    isRead: false
  });

  // Send email and admin notifications asynchronously without blocking response
  setImmediate(async () => {
    try {
      await sendEmergencyAccessEmail(patient, doctor, hospital, justification, new Date());
    } catch (emailError) {
      console.error('Failed to send emergency access email:', emailError);
    }
    
    if (hospital) {
      try {
        await notifyHospitalAdmins(hospital._id.toString(), doctor, patient, justification);
      } catch (error) {
        console.error('Failed to notify hospital admins:', error);
      }
    }
  });

  res.status(200).json({
    success: true,
    message: 'Emergency access granted. All actions are logged and will be audited.',
    data: {
      emergencyOverrideId: emergencyOverride._id,
      patientId: patient._id,
      patientName: patient.user.name,
      accessGrantedAt: emergencyOverride.accessTime,
      notification: {
        sent: true,
        notificationId: notification._id
      },
      warning: '⚠️ This access is logged and will be reviewed by compliance team'
    }
  });
});

// @desc    Get patient records with emergency access
// @route   GET /api/emergency-access/patient/:patientId
// @access  Private (Doctor with emergency access)
export const getPatientRecordsEmergency = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { patientId } = req.params;
  const user = req.user;

  // Verify emergency access was granted
  const recentEmergencyAccess = await EmergencyOverride.findOne({
    user: user._id,
    patient: patientId,
    accessTime: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } // Within last 2 hours
  }).sort({ accessTime: -1 });

  if (!recentEmergencyAccess) {
    throw new CustomError('No valid emergency access found. Please request emergency access first.', 403);
  }

  // Find patient
  const patient = await Patient.findById(patientId).populate('user', 'name email nationalId dateOfBirth gender contactNumber');
  if (!patient) {
    throw new CustomError('Patient not found', 404);
  }

  // Get all medical records
  const medicalRecords = await MedicalRecord.find({ patientId: patient._id })
    .populate('createdBy', 'name email role')
    .sort({ createdAt: -1 });

  // Get patient passport
  let passport = null;
  try {
    passport = await PatientPassport.findByPatientId(patient._id);
  } catch (error) {
    console.error('Error fetching passport:', error);
  }

  // Log the access
  await AuditLog.create({
    user: user._id,
    patient: patientId,
    accessType: 'emergency',
    action: 'view',
    details: `Viewed patient records under emergency access. Override ID: ${recentEmergencyAccess._id}`,
    accessTime: new Date(),
    ipAddress: req.ip?.toString(),
    userAgent: req.headers['user-agent']?.toString()
  });

  console.log(`🚨 EMERGENCY ACCESS - Records Retrieved`);
  console.log(`   Doctor: ${user.email}`);
  console.log(`   Patient: ${patient.user.email}`);
  console.log(`   Records Count: ${medicalRecords.length}`);

  res.json({
    success: true,
    emergencyAccess: true,
    accessGrantedAt: recentEmergencyAccess.accessTime,
    data: {
      patient: {
        id: patient._id,
        personalInfo: {
          name: patient.user.name,
          nationalId: patient.user.nationalId,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender,
          contactNumber: patient.contactNumber,
          bloodType: patient.bloodType,
          emergencyContact: patient.emergencyContact
        }
      },
      medicalRecords,
      passport: passport ? {
        personalInfo: passport.personalInfo,
        medicalInfo: passport.medicalInfo,
        testResults: passport.testResults,
        hospitalVisits: passport.hospitalVisits
      } : null
    }
  });
});

// @desc    Get all emergency access logs (for audit)
// @route   GET /api/emergency-access/logs
// @access  Private (Admin, Hospital Admin)
export const getEmergencyAccessLogs = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;

  // Only admins and hospital admins can view logs
  if (!['admin'].includes(user.role)) {
    throw new CustomError('Not authorized to view emergency access logs', 403);
  }

  const { page = 1, limit = 20, startDate, endDate, doctorId, patientId } = req.query;

  const query: any = {};

  // Date range filter
  if (startDate || endDate) {
    query.accessTime = {};
    if (startDate) query.accessTime.$gte = new Date(startDate as string);
    if (endDate) query.accessTime.$lte = new Date(endDate as string);
  }

  // Filter by doctor
  if (doctorId) {
    query.user = doctorId;
  }

  // Filter by patient
  if (patientId) {
    query.patient = patientId;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [logs, total] = await Promise.all([
    EmergencyOverride.find(query)
      .populate('user', 'name email role')
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ accessTime: -1 })
      .skip(skip)
      .limit(Number(limit)),
    EmergencyOverride.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    }
  });
});

// @desc    Get emergency access audit trail for a specific patient
// @route   GET /api/emergency-access/audit/:patientId
// @access  Private (Admin, Patient)
export const getPatientEmergencyAudit = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { patientId } = req.params;
  const user = req.user;

  // Check permissions
  if (user.role === 'patient') {
    const patient = await Patient.findOne({ user: user._id });
    if (!patient || patient._id.toString() !== patientId) {
      throw new CustomError('Not authorized to view this audit trail', 403);
    }
  } else if (user.role !== 'admin') {
    throw new CustomError('Not authorized to view audit trails', 403);
  }

  // Get all emergency access and audit logs
  const [emergencyAccess, auditLogs] = await Promise.all([
    EmergencyOverride.find({ patient: patientId })
      .populate('user', 'name email role')
      .sort({ accessTime: -1 }),
    AuditLog.find({ patient: patientId, accessType: 'emergency' })
      .populate('user', 'name email role')
      .sort({ accessTime: -1 })
  ]);

  res.json({
    success: true,
    data: {
      emergencyAccess,
      auditLogs,
      summary: {
        totalEmergencyAccesses: emergencyAccess.length,
        totalAuditEntries: auditLogs.length,
        lastAccess: emergencyAccess.length > 0 ? emergencyAccess[0].accessTime : null
      }
    }
  });
});

// @desc    Get doctor's emergency access history
// @route   GET /api/emergency-access/my-history
// @access  Private (Doctor)
export const getDoctorEmergencyHistory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;

  if (user.role !== 'doctor') {
    throw new CustomError('This endpoint is only for doctors', 403);
  }

  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [history, total] = await Promise.all([
    EmergencyOverride.find({ user: user._id })
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ accessTime: -1 })
      .skip(skip)
      .limit(Number(limit)),
    EmergencyOverride.countDocuments({ user: user._id })
  ]);

  res.json({
    success: true,
    data: {
      history,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    }
  });
});

// Helper function to send emergency access email
async function sendEmergencyAccessEmail(
  patient: any,
  doctor: any,
  hospital: any,
  justification: string,
  accessTime: Date
): Promise<void> {
  const subject = '🚨 EMERGENCY ACCESS ALERT - Your Medical Records';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .alert-box { background: #fee; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
        .info-box { background: #f0f9ff; border: 1px solid #0284c7; padding: 15px; margin: 20px 0; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #555; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2 style="color: #dc2626;">🚨 Emergency Access Alert</h2>
        
        <div class="alert-box">
          <p><strong>Your medical records were accessed under Emergency Break-Glass Protocol</strong></p>
          <p>This notification is to inform you that your medical records were accessed without prior consent due to a medical emergency.</p>
        </div>

        <div class="info-box">
          <h3>Access Details:</h3>
          
          <div class="detail-row">
            <span class="label">Doctor:</span> Dr. ${doctor.user.name}
          </div>
          
          <div class="detail-row">
            <span class="label">Email:</span> ${doctor.user.email}
          </div>
          
          <div class="detail-row">
            <span class="label">Hospital/Facility:</span> ${hospital ? hospital.name : 'Not specified'}
          </div>
          
          <div class="detail-row">
            <span class="label">Date & Time:</span> ${accessTime.toLocaleString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
          
          <div class="detail-row">
            <span class="label">Reason for Emergency Access:</span><br/>
            ${justification}
          </div>
        </div>

        <h3>What This Means:</h3>
        <ul>
          <li>Your records were accessed for emergency medical treatment</li>
          <li>All access has been logged and will be audited</li>
          <li>You can review the complete audit trail in your patient portal</li>
          <li>If you have concerns about this access, please contact our compliance team</li>
        </ul>

        <h3>Your Rights:</h3>
        <ul>
          <li>Review who accessed your records and when</li>
          <li>Request a full audit report of all emergency accesses</li>
          <li>File a complaint if you believe access was inappropriate</li>
          <li>Contact our privacy officer for any concerns</li>
        </ul>

        <div class="footer">
          <p><strong>Patient Passport System</strong></p>
          <p>This is an automated security notification. All emergency accesses are logged for your protection.</p>
          <p>If you did not receive emergency medical care, please contact us immediately.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendNotificationEmail(patient.user.email, subject, html);
    console.log(`✅ Emergency access email sent to ${patient.user.email}`);
  } catch (error) {
    console.error('Failed to send emergency access email:', error);
    throw error;
  }
}

// Helper function to notify hospital admins
async function notifyHospitalAdmins(
  hospitalId: string,
  doctor: any,
  patient: any,
  justification: string
): Promise<void> {
  // Find hospital
  const hospital = await Hospital.findById(hospitalId).populate('user');
  
  if (!hospital) {
    console.log('Hospital not found');
    return;
  }

  // Notify the hospital admin user (the user who created the hospital account)
  if (hospital.user && (hospital.user as any)._id) {
    const notification = {
      userId: (hospital.user as any)._id.toString(),
      type: 'emergency_access' as const,
      title: '🚨 Emergency Break-Glass Access Used',
      message: `Dr. ${doctor.user.name} used emergency access for patient ${patient.user.name} at your facility`,
      data: {
        doctorId: doctor._id,
        doctorName: doctor.user.name,
        patientId: patient._id,
        patientName: patient.user.name,
        justification,
        hospitalId,
        hospitalName: hospital.name,
        accessTime: new Date()
      },
      priority: 'urgent' as const,
      isRead: false
    };

    await Notification.create(notification);
    console.log(`✅ Notified hospital admin for ${hospital.name}`);
  } else {
    console.log('No hospital admin user to notify');
  }
}
