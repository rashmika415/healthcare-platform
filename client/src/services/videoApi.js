import axios from 'axios';


const videoApi = axios.create({
  baseURL: 'http://localhost:3000/video', // Changed to go through the gateway


});

// Auto attach token to every request
videoApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Common: Get or create session for an appointment
 */
export const getOrCreateSessionByAppointment = async (appointmentId) => {
  const response = await videoApi.get(`/appointment/${appointmentId}`);
  return response.data;
};

/**
 * Common: Join a specific session
 */
export const joinSession = async (sessionId, participantToken) => {
  const response = await videoApi.post(`/sessions/${sessionId}/join`, { participantToken });
  return response.data;
};

/**
 * Participant: Delete consultation session for an appointment
 */
export const deleteSessionByAppointment = async (appointmentId) => {
  const response = await videoApi.delete(`/appointment/${appointmentId}`);
  return response.data;
};

/**
 * Admin: Get all active sessions
 */
export const adminGetAllSessions = async () => {
  const response = await videoApi.get('/admin/sessions');
  return response.data;
};

/**
 * Admin: Terminate a session
 */
export const adminDeleteSession = async (sessionId) => {
  const response = await videoApi.delete(`/admin/sessions/${sessionId}`);
  return response.data;
};

export default videoApi;

