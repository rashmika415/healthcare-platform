import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000/doctor",
});

// ✅ Fixed: check both sessionStorage and localStorage
// matches how AuthContext saves the token
API.interceptors.request.use((req) => {
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export default API;