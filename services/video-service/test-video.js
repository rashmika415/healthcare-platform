const jwt = require('jsonwebtoken');

const token = jwt.sign({
  id: 'doc123',
  role: 'doctor',
  email: 'doc@doc.com',
  name: 'Dr. Test'
}, 'healthcare_super_secret_key_2026');

async function test() {
  console.log('Sending request to /video/sessions...');
  const res = await fetch('http://localhost:3006/video/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      appointmentId: 'appt-final-test-' + Date.now(),
      patientUserId: 'pat123',
      doctorUserId: 'doc123'
    })
  });
  
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', data);
  
  if (data.session) {
    const sessionId = data.session.sessionId;
    const participantToken = data.join.participantToken;
    
    console.log('\nTesting Join Session...');
    const joinRes = await fetch(`http://localhost:3006/video/sessions/${sessionId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        participantToken
      })
    });
    console.log('Join Status:', joinRes.status);
    console.log('Join Response:', await joinRes.json());
  }
}

test();
