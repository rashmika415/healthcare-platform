const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'healthcare_super_secret_key_2026';

// 1. Create a doctor token
const token = jwt.sign({
  id: 'doc123', // ID must match what's in the appointment we test
  role: 'doctor',
  email: 'doc@doc.com',
  name: 'Dr. Test'
}, JWT_SECRET);

async function testAppointmentFlow() {
  console.log('Testing GET /video/appointment/:appointmentId ...');
  
  // NOTE: You need a valid appointment ID from the appointment-service 
  // with status 'BOOKED' and doctorId 'doc123'.
  const appointmentId = 'ReplaceWithValidAppointmentId'; 

  try {
    const res = await fetch(`http://localhost:3006/video/appointment/${appointmentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (res.status === 200 || res.status === 201) {
      console.log('✅ Success: Video session retrieved or created.');
    } else {
      console.log('❌ Failed:', data.error);
    }
  } catch (err) {
    console.error('Test error:', err.message);
  }
}

console.log('Token generated. Make sure video-service is running on 3006.');
testAppointmentFlow();
