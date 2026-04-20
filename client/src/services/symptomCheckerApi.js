import api from './api';

export async function analyzeSymptoms(payload) {
  const response = await api.post('/ai-symptom/analyze', payload);
  return response.data;
}
