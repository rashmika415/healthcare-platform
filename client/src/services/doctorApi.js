import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3100";

const API = axios.create({
  baseURL: `${API_BASE_URL}/doctor`,
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