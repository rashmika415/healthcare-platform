import axios from 'axios';

const VIDEO_SERVICE_BASE_URL =
  process.env.REACT_APP_VIDEO_SERVICE_URL || 'http://localhost:3106';

// Directly talk to video-service.
const videoApi = axios.create({
  baseURL: `${VIDEO_SERVICE_BASE_URL}/video`,
});

export default videoApi;

