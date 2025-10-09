// Simple script to create a test doctor user
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/patient-passport', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema (simplified)
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['patient', 'doctor', 'admin', 'hospital', 'receptionist'], default: 'patient' },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createTestDoctor() {
  try {
    console.log('Creating test doctor user...');
    
    // Check if doctor already exists
    const existingDoctor = await User.findOne({ email: 'doctor@example.com' });
    if (existingDoctor) {
      console.log('Doctor already exists:', existingDoctor.email);
      console.log('Updating doctor role...');
      existingDoctor.role = 'doctor';
      existingDoctor.isActive = true;
      existingDoctor.isEmailVerified = true;
      await existingDoctor.save();
      console.log('✅ Doctor user updated successfully');
    } else {
      // Create new doctor user
      const doctorUser = new User({
        name: 'Dr. Test Doctor',
        email: 'doctor@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'doctor',
        isActive: true,
        isEmailVerified: true
      });
      
      await doctorUser.save();
      console.log('✅ Doctor user created successfully:', doctorUser.email);
    }
    
    console.log('Test doctor credentials:');
    console.log('Email: doctor@example.com');
    console.log('Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating doctor:', error);
    process.exit(1);
  }
}

createTestDoctor();

