import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  // Not logged in → show normal home page first
  if (!user) return <Navigate to="/" replace />;

  if (user.role === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
  if (user.role === 'patient') return <Navigate to="/patient/dashboard" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;

  return <Navigate to="/" replace />;
}

