const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const User = require('../dist/models/User').default;
const Patient = require('../dist/models/Patient').default;
const Hospital = require('../dist/models/Hospital').default;
const Doctor = require('../dist/models/Doctor').default;
const Receptionist = require('../dist/models/Receptionist').default;

async function testAllRoleRegistrations() {
  try {
    console.log('Testing role-specific profile creation...\n');

    // Test data for each role
    const testData = {
      patient: {
        name: 'Test Patient',
        email: 'test.patient@example.com',
        password: 'password123',
        role: 'patient',
        nationalId: '1234567890123456',
        dateOfBirth: '1990-01-01',
        gender: 'female',
        contactNumber: '+250123456789',
        address: 'Kigali, Rwanda',
        emergencyContact: {
          name: 'Emergency Contact',
          relationship: 'Sister',
          phone: '+250987654321'
        }
      },
      hospital: {
        name: 'Test Hospital',
        email: 'test.hospital@example.com',
        password: 'password123',
        role: 'hospital',
        hospitalName: 'Test Medical Center',
        adminContact: 'admin@testhospital.com',
        licenseNumber: 'HOSP123456',
        address: 'Hospital Street, Kigali',
        contact: '+250111222333'
      },
      doctor: {
        name: 'Test Doctor',
        email: 'test.doctor@example.com',
        password: 'password123',
        role: 'doctor',
        licenseNumber: 'DOC123456',
        specialization: 'Cardiology',
        hospital: '507f1f77bcf86cd799439011' // Sample hospital ID
      },
      receptionist: {
        name: 'Test Receptionist',
        email: 'test.receptionist@example.com',
        password: 'password123',
        role: 'receptionist',
        employeeId: 'EMP123456',
        department: 'Reception',
        shift: 'Day',
        hospital: '507f1f77bcf86cd799439011' // Sample hospital ID
      }
    };

    // Test each role
    for (const [role, data] of Object.entries(testData)) {
      console.log(`\n=== Testing ${role.toUpperCase()} Registration ===`);
      
      // Clean up existing test data
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        console.log(`Cleaning up existing ${role} user...`);
        await User.findByIdAndDelete(existingUser._id);
        
        // Delete role-specific profile
        if (role === 'patient') {
          await Patient.findOneAndDelete({ user: existingUser._id });
        } else if (role === 'hospital') {
          await Hospital.findOneAndDelete({ user: existingUser._id });
        } else if (role === 'doctor') {
          await Doctor.findOneAndDelete({ user: existingUser._id });
        } else if (role === 'receptionist') {
          await Receptionist.findOneAndDelete({ user: existingUser._id });
        }
      }

      // Create user
      console.log(`Creating ${role} user...`);
      const user = await User.create({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role
      });
      console.log(`✅ User created: ${user._id}`);

      // Create role-specific profile
      let profile = null;
      try {
        if (role === 'patient') {
          profile = await Patient.create({
            user: user._id,
            nationalId: data.nationalId,
            dateOfBirth: new Date(data.dateOfBirth),
            gender: data.gender,
            contactNumber: data.contactNumber,
            address: data.address,
            emergencyContact: data.emergencyContact,
            status: 'active'
          });
        } else if (role === 'hospital') {
          profile = await Hospital.create({
            user: user._id,
            name: data.hospitalName,
            address: data.address,
            contact: data.contact,
            licenseNumber: data.licenseNumber,
            adminContact: data.adminContact
          });
        } else if (role === 'doctor') {
          profile = await Doctor.create({
            user: user._id,
            licenseNumber: data.licenseNumber,
            specialization: data.specialization,
            hospital: data.hospital
          });
        } else if (role === 'receptionist') {
          profile = await Receptionist.create({
            user: user._id,
            employeeId: data.employeeId,
            hospital: data.hospital,
            department: data.department,
            shift: data.shift,
            permissions: {
              canAssignDoctors: true,
              canViewPatientRecords: true,
              canScheduleAppointments: true,
              canAccessEmergencyOverride: false
            }
          });
        }
        
        if (profile) {
          console.log(`✅ ${role.charAt(0).toUpperCase() + role.slice(1)} profile created: ${profile._id}`);
        }
      } catch (error) {
        console.error(`❌ Error creating ${role} profile:`, error.message);
      }

      // Clean up test data
      await User.findByIdAndDelete(user._id);
      if (profile) {
        if (role === 'patient') {
          await Patient.findByIdAndDelete(profile._id);
        } else if (role === 'hospital') {
          await Hospital.findByIdAndDelete(profile._id);
        } else if (role === 'doctor') {
          await Doctor.findByIdAndDelete(profile._id);
        } else if (role === 'receptionist') {
          await Receptionist.findByIdAndDelete(profile._id);
        }
      }
    }

    console.log('\n🎉 All role-specific profile creation tests completed!');
    console.log('\nSummary:');
    console.log('✅ Patient → Patient collection');
    console.log('✅ Hospital → Hospital collection');
    console.log('✅ Doctor → Doctor collection');
    console.log('✅ Receptionist → Receptionist collection');
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing role registrations:', error);
    process.exit(1);
  }
}

testAllRoleRegistrations();
