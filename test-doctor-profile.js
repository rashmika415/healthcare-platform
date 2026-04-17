const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YzNlNjcwNTU4ZDhjMzhkZTBmNWIyYiIsImVtYWlsIjoia2FwaWxhcEBnbWFpbC5jb20iLCJyb2xlIjoiZG9jdG9yIiwibmFtZSI6IkRyLkthcGlsYSIsImlhdCI6MTc3NDUyMDExNywiZXhwIjoxNzc1MTI0OTE3fQ.UfFkZn_jQ2D7l9I_qdhQHKCXc35wcoBcQs6Ef2KgAAc';

fetch('http://localhost:3000/doctor/profile', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    specialization: 'Cardiology',
    experience: 5,
    hospital: 'City Hospital',
    bio: 'Experienced doctor'
  })
})
.then(r => r.text().then(t => console.log('Status:', r.status, 'Response:', t)))
.catch(e => console.log('Error:', e.message));