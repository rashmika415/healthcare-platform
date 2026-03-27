// client/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();
const AUTH_PERSIST_KEY = 'authPersistence';

const readStoredAuth = () => {
  const persistence = localStorage.getItem(AUTH_PERSIST_KEY);

  // Legacy cleanup: old versions always stored auth in localStorage.
  // If no persistence mode exists, force logout once to avoid unwanted auto-login.
  if (!persistence) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    return null;
  }

  if (persistence === 'local') {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return token && user ? { token, user } : null;
  }

  const token = sessionStorage.getItem('token');
  const user = sessionStorage.getItem('user');
  return token && user ? { token, user } : null;
};

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // On app start — check if token is still valid
  useEffect(() => {
    const auth = readStoredAuth();

    if (auth?.user) {
      setUser(JSON.parse(auth.user));
    }
    setLoading(false);
  }, []);

  const login = async (email, password, remember = false) => {
    const { data } = await api.post('/auth/login', { email, password });

    const storage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;

    storage.setItem('token', data.token);
    storage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem(AUTH_PERSIST_KEY, remember ? 'local' : 'session');

    // Keep only one active storage source.
    otherStorage.removeItem('token');
    otherStorage.removeItem('user');

    setUser(data.user);
    return data.user; // return so Login page can redirect by role
  };

  const register = async (name, email, password, role) => {
    const { data } = await api.post('/auth/register', { name, email, password, role });

    // Default registration session to non-persistent auth.
    sessionStorage.setItem('token', data.token);
    sessionStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem(AUTH_PERSIST_KEY, 'session');
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem(AUTH_PERSIST_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — use this in any component
export const useAuth = () => useContext(AuthContext);