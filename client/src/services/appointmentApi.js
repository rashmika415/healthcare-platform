import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3003" // your appointment service
});

export default API;