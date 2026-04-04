const mongoose = require('mongoose');
const Doctor = require('./models/doctorModels');
const DoctorAvailability = require('./models/doctorAvailabilityModel');

require('dotenv').config({ path: __dirname + '/.env' });

// MongoDB connection
mongoose.set('strictQuery', true);
mongoose.set('bufferCommands', false);

const mongoOptions = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  retryWrites: true,
  w: 'majority'
};

const doctorMongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/doctordb';

async function addSampleAvailability() {
  try {
    await mongoose.connect(doctorMongoUri, mongoOptions);
    console.log('✅ Connected to MongoDB');

    // Get all verified doctors
    const doctors = await Doctor.find({ isVerified: true });
    console.log(`Found ${doctors.length} verified doctors`);

    // Sample availability data
    const sampleAvailability = [
      { day: 'Monday', startTime: '09:00', endTime: '12:00' },
      { day: 'Monday', startTime: '14:00', endTime: '17:00' },
      { day: 'Tuesday', startTime: '09:00', endTime: '12:00' },
      { day: 'Tuesday', startTime: '14:00', endTime: '17:00' },
      { day: 'Wednesday', startTime: '09:00', endTime: '12:00' },
      { day: 'Wednesday', startTime: '14:00', endTime: '17:00' },
      { day: 'Thursday', startTime: '09:00', endTime: '12:00' },
      { day: 'Thursday', startTime: '14:00', endTime: '17:00' },
      { day: 'Friday', startTime: '09:00', endTime: '12:00' },
      { day: 'Friday', startTime: '14:00', endTime: '17:00' },
      { day: 'Saturday', startTime: '09:00', endTime: '13:00' },
      { day: 'Sunday', startTime: '10:00', endTime: '14:00' }
    ];

    // Clear existing availability
    await DoctorAvailability.deleteMany({});
    console.log('Cleared existing availability data');

    // Add availability for each doctor
    for (const doctor of doctors) {
      for (const slot of sampleAvailability) {
        await DoctorAvailability.create({
          doctorUserId: doctor.userId,
          day: slot.day,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isActive: true
        });
      }
      console.log(`Added availability for Dr. ${doctor.name}`);
    }

    console.log('✅ Sample availability data added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

addSampleAvailability();
