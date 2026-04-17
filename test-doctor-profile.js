const axios = require('axios');

async function testDoctorProfile() {
  const doctorId = '67b077a167664440c96c4695'; // Example profile ID from previous logs if I had them
  // Actually, I'll try to use a real userId if I can find one.
  // Let's assume the user is testing with a specific account.
  
  const DOCTOR_SERVICE_URL = 'http://localhost:3002';
  
  try {
    // We need a valid userId that exists in the database.
    // I'll check the userModel in api-gateway to see if I can find a user.
    console.log('Testing connection to doctor-service...');
    const health = await axios.get(`${DOCTOR_SERVICE_URL}/`);
    console.log('Doctor Service Health:', health.data);
    
    // I'll try to list all verified doctors to get a valid userId/Id pair.
    const doctors = await axios.get(`${DOCTOR_SERVICE_URL}/verified`, {
      headers: {
        'x-user-id': 'admin',
        'x-user-role': 'admin'
      }
    });
    console.log('Verified Doctors count:', doctors.data.doctors?.length);
    if (doctors.data.doctors?.length > 0) {
      const doc = doctors.data.doctors[0];
      console.log('Testing profile for:', doc.name, 'AuthID:', doc.userId, 'ProfileID:', doc._id);
      
      const profile = await axios.get(`${DOCTOR_SERVICE_URL}/profile`, {
        headers: {
          'x-user-id': doc.userId,
          'x-user-role': 'doctor',
          'x-user-email': doc.email,
          'x-user-name': doc.name
        }
      });
      console.log('Profile response status:', profile.status);
      console.log('Profile data _id:', profile.data?._id);
    }
  } catch (err) {
    console.error('Test failed:', err.message);
    if (err.response) {
      console.error('Response data:', err.response.data);
    }
  }
}

testDoctorProfile();