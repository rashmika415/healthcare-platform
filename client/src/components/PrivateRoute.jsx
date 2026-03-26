// client/src/components/PrivateRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();

  // Still checking localStorage
  if (loading) return <div>Loading...</div>;

  // Not logged in → go to login
  if (!user) return <Navigate to="/login" />;

  // Wrong role → go to login
  if (role && user.role !== role) return <Navigate to="/login" />;

  return children;
}