const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport');

// User schema (simplified)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  nationalId: String
});

const User = mongoose.model('User', userSchema);

async function resetPassword() {
  try {
    // Find the user by nationalId
    const user = await User.findOne({ nationalId: '1234567891012345' });
    
    if (!user) {
      console.log('User not found with nationalId: 1234567891012345');
      return;
    }
    
    console.log('Found user:', user.email);
    
    // Hash the password properly
    const newPassword = 'password123'; // Change this to your desired password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update the user's password
    user.password = hashedPassword;
    await user.save();
    
    console.log('Password updated successfully!');
    console.log('New password:', newPassword);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

resetPassword();






