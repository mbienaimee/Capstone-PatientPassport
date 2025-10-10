const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Hospital = require('../dist/models/Hospital').default;
const Doctor = require('../dist/models/Doctor').default;
const User = require('../dist/models/User').default;

const sampleHospitals = [
  {
    name: 'City General Hospital',
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    phone: '+1-555-0123',
    email: 'info@citygeneral.com',
    licenseNumber: 'HOSP001',
    isActive: true
  },
  {
    name: 'Metropolitan Medical Center',
    address: '456 Oak Avenue',
    city: 'Los Angeles',
    state: 'CA',
    country: 'USA',
    phone: '+1-555-0456',
    email: 'contact@metro-med.com',
    licenseNumber: 'HOSP002',
    isActive: true
  },
  {
    name: 'Regional Health Center',
    address: '789 Pine Street',
    city: 'Chicago',
    state: 'IL',
    country: 'USA',
    phone: '+1-555-0789',
    email: 'admin@regionalhealth.com',
    licenseNumber: 'HOSP003',
    isActive: true
  }
];

const sampleDoctors = [
  {
    firstName: 'John',
    lastName: 'Smith',
    email: 'dr.john.smith@citygeneral.com',
    phone: '+1-555-1001',
    licenseNumber: 'DOC001',
    specialization: 'Cardiology',
    hospitalLicense: 'HOSP001'
  },
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'dr.sarah.johnson@citygeneral.com',
    phone: '+1-555-1002',
    licenseNumber: 'DOC002',
    specialization: 'Pediatrics',
    hospitalLicense: 'HOSP001'
  },
  {
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'dr.michael.brown@metro-med.com',
    phone: '+1-555-2001',
    licenseNumber: 'DOC003',
    specialization: 'Emergency Medicine',
    hospitalLicense: 'HOSP002'
  },
  {
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'dr.emily.davis@metro-med.com',
    phone: '+1-555-2002',
    licenseNumber: 'DOC004',
    specialization: 'Internal Medicine',
    hospitalLicense: 'HOSP002'
  },
  {
    firstName: 'David',
    lastName: 'Wilson',
    email: 'dr.david.wilson@regionalhealth.com',
    phone: '+1-555-3001',
    licenseNumber: 'DOC005',
    specialization: 'Surgery',
    hospitalLicense: 'HOSP003'
  }
];

async function seedHospitals() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patientpassport');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Hospital.deleteMany({});
    await Doctor.deleteMany({});
    console.log('Cleared existing hospital and doctor data');

    // Create hospitals
    const createdHospitals = [];
    for (const hospitalData of sampleHospitals) {
      const hospital = new Hospital(hospitalData);
      await hospital.save();
      createdHospitals.push(hospital);
      console.log(`Created hospital: ${hospital.name}`);
    }

    // Create doctors
    for (const doctorData of sampleDoctors) {
      // Find the hospital for this doctor
      const hospital = createdHospitals.find(h => h.licenseNumber === doctorData.hospitalLicense);
      
      if (!hospital) {
        console.log(`Hospital not found for doctor ${doctorData.firstName} ${doctorData.lastName}`);
        continue;
      }

      // Create user for doctor
      const user = new User({
        firstName: doctorData.firstName,
        lastName: doctorData.lastName,
        email: doctorData.email,
        phone: doctorData.phone,
        role: 'doctor',
        isActive: true,
        isEmailVerified: true
      });
      await user.save();

      // Create doctor profile
      const doctor = new Doctor({
        user: user._id,
        licenseNumber: doctorData.licenseNumber,
        specialization: doctorData.specialization,
        hospital: hospital._id,
        isActive: true
      });
      await doctor.save();

      // Add doctor to hospital's registered doctors
      hospital.registeredDoctors.push(doctor._id);
      await hospital.save();

      console.log(`Created doctor: Dr. ${doctorData.firstName} ${doctorData.lastName} (${doctorData.licenseNumber}) at ${hospital.name}`);
    }

    console.log('\n✅ Hospital and doctor seeding completed successfully!');
    console.log('\n📋 Sample Login Credentials:');
    console.log('Hospital: City General Hospital (HOSP001)');
    console.log('Doctor: Dr. John Smith (DOC001)');
    console.log('Doctor: Dr. Sarah Johnson (DOC002)');
    console.log('\nHospital: Metropolitan Medical Center (HOSP002)');
    console.log('Doctor: Dr. Michael Brown (DOC003)');
    console.log('Doctor: Dr. Emily Davis (DOC004)');
    console.log('\nHospital: Regional Health Center (HOSP003)');
    console.log('Doctor: Dr. David Wilson (DOC005)');

  } catch (error) {
    console.error('Error seeding hospitals and doctors:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedHospitals();













