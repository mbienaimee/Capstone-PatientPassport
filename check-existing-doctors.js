// Check existing doctors in database
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/patient-passport', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  isActive: Boolean,
  isEmailVerified: Boolean,
  createdAt: Date
});

const User = mongoose.model('User', userSchema);

async function checkExistingDoctors() {
  try {
    console.log('Checking existing doctors in database...\n');
    
    // Find all users with doctor role
    const doctors = await User.find({ role: 'doctor' });
    
    console.log(`Found ${doctors.length} doctor users:`);
    console.log('=====================================');
    
    doctors.forEach((doctor, index) => {
      console.log(`${index + 1}. Email: ${doctor.email}`);
      console.log(`   Name: ${doctor.name}`);
      console.log(`   Active: ${doctor.isActive}`);
      console.log(`   Email Verified: ${doctor.isEmailVerified}`);
      console.log(`   Created: ${doctor.createdAt}`);
      console.log('   ---');
    });
    
    if (doctors.length === 0) {
      console.log('❌ No doctors found in database');
    } else {
      console.log('✅ Doctors found! Try logging in with one of these emails:');
      doctors.forEach(doctor => {
        console.log(`   - ${doctor.email}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking doctors:', error);
    process.exit(1);
  }
}

checkExistingDoctors();

