import axios from 'axios';

// Directly talk to video-service (your part), not the API gateway.
const videoApi = axios.create({
  baseURL: 'http://localhost:3006/video',
});

export default videoApi;

