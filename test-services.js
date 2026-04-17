// Test doctor service connectivity
const testDoctor = async () => {
  try {
    console.log('Testing doctor service...');
    const res = await fetch('http://localhost:3002/', { timeout: 5000 });
    const text = await res.text();
    console.log('Doctor service status:', res.status, text);
  } catch (e) {
    console.error('Doctor service error:', e.message);
  }

  try {
    console.log('Testing API gateway...');
    const res = await fetch('http://localhost:3000/health', { timeout: 5000 });
    const text = await res.text();
    console.log('Gateway status:', res.status, text);
  } catch (e) {
    console.error('Gateway error:', e.message);
  }
};

testDoctor();
