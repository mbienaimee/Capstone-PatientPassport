require('dotenv').config();
const mongoose = require('mongoose');

async function checkAndFixDatabase() {
  try {
    console.log('🔍 Checking database status...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // 1. Check for Betty Williams
    console.log('1️⃣ Checking for Betty Williams...');
    const bettyUser = await db.collection('users').findOne({ 
      name: /Betty.*Williams/i,
      role: 'patient'
    });
    
    if (bettyUser) {
      console.log(`   ✅ Found Betty Williams`);
      console.log(`      - ID: ${bettyUser._id}`);
      console.log(`      - Email: ${bettyUser.email}`);
      console.log(`      - Role: ${bettyUser.role}`);
      
      // Check medical records
      const recordsCount = await db.collection('medicalrecords').countDocuments({ patient: bettyUser._id });
      console.log(`      - Medical Records: ${recordsCount}`);
    } else {
      console.log('   ❌ Betty Williams NOT found in Patient Passport database');
      console.log('   💡 Creating Betty Williams...');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('TempPassword123!', 12);
      
      const result = await db.collection('users').insertOne({
        name: 'Betty Williams',
        email: 'bettywilliams@openmrs-sync.com',
        password: hashedPassword,
        role: 'patient',
        isActive: true,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`   ✅ Created Betty Williams: bettywilliams@openmrs-sync.com`);
    }
    
    console.log('');
    
    // 2. Check for OpenMRS Hospital
    console.log('2️⃣ Checking for OpenMRS Hospital...');
    const openmrsHospital = await db.collection('hospitals').findOne({ 
      name: /OpenMRS Hospital/i 
    });
    
    if (openmrsHospital) {
      console.log(`   ✅ Found OpenMRS Hospital`);
      console.log(`      - ID: ${openmrsHospital._id}`);
      console.log(`      - Name: ${openmrsHospital.name}`);
      console.log(`      - License: ${openmrsHospital.licenseNumber}`);
    } else {
      console.log('   ❌ OpenMRS Hospital NOT found');
      console.log('   💡 Creating OpenMRS Hospital...');
      
      // Check if user exists
      let hospitalUser = await db.collection('users').findOne({ email: 'openmrshospital@openmrs-sync.com' });
      
      if (!hospitalUser) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('TempPassword123!', 12);
        
        const userResult = await db.collection('users').insertOne({
          name: 'OpenMRS Hospital',
          email: 'openmrshospital@openmrs-sync.com',
          password: hashedPassword,
          role: 'hospital',
          isActive: true,
          isEmailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        hospitalUser = { _id: userResult.insertedId };
        console.log(`   ✅ Created hospital user: openmrshospital@openmrs-sync.com`);
      }
      
      await db.collection('hospitals').insertOne({
        user: hospitalUser._id,
        name: 'OpenMRS Hospital',
        licenseNumber: `OPENMRS-${Date.now()}`,
        address: 'OpenMRS Integration Address',
        contact: 'OpenMRS Integration Contact',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`   ✅ Created OpenMRS Hospital`);
    }
    
    console.log('');
    
    // 3. Check for DB-SYNC-SERVICE doctor
    console.log('3️⃣ Checking for DB-SYNC-SERVICE doctor...');
    const syncDoctor = await db.collection('doctors').findOne({ 
      licenseNumber: 'DB-SYNC-SERVICE' 
    });
    
    if (syncDoctor) {
      console.log(`   ✅ Found DB-SYNC-SERVICE doctor`);
      console.log(`      - ID: ${syncDoctor._id}`);
      console.log(`      - License: ${syncDoctor.licenseNumber}`);
    } else {
      console.log('   ❌ DB-SYNC-SERVICE doctor NOT found');
      console.log('   💡 Creating DB-SYNC-SERVICE doctor...');
      
      let doctorUser = await db.collection('users').findOne({ email: 'dbsyncservice@openmrs-sync.com' });
      
      if (!doctorUser) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('TempPassword123!', 12);
        
        const userResult = await db.collection('users').insertOne({
          name: 'DB Sync Service',
          email: 'dbsyncservice@openmrs-sync.com',
          password: hashedPassword,
          role: 'doctor',
          isActive: true,
          isEmailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        doctorUser = { _id: userResult.insertedId };
        console.log(`   ✅ Created doctor user: dbsyncservice@openmrs-sync.com`);
      }
      
      // Get hospital for doctor
      const hospital = await db.collection('hospitals').findOne({ name: /OpenMRS Hospital/i });
      
      await db.collection('doctors').insertOne({
        user: doctorUser._id,
        hospital: hospital._id,
        licenseNumber: 'DB-SYNC-SERVICE',
        specialization: 'OpenMRS Integration',
        experience: 0,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`   ✅ Created DB-SYNC-SERVICE doctor`);
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('✅ Database check and fix complete!');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('Now restart the backend and observations will sync!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

checkAndFixDatabase();
