import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get navigation links based on user role
  const getNavLinks = () => {
    if (user?.role === 'patient') {
      return [
        { label: 'Dashboard', path: '/patient/dashboard' },
        { label: 'Appointments', path: '/patient/appointments' },
        { label: 'Medical Reports', path: '/patient/reports' },
        { label: 'Prescriptions', path: '/patient/prescriptions' },
        { label: 'Profile', path: '/patient/profile' },
      ];
    }
    if (user?.role === 'doctor') {
      return [
        { label: 'Dashboard', path: '/doctor/dashboard' },
        { label: 'Appointments', path: '/doctor/appointments' },
        { label: 'Availability', path: '/doctor/availability' },
        { label: 'Prescriptions', path: '/doctor/prescriptions' },
        { label: 'Profile', path: '/doctor/profile' },
      ];
    }
    if (user?.role === 'admin') {
      return [
        { label: 'Dashboard', path: '/admin/dashboard' },
        { label: 'Doctors', path: '/admin/doctors' },
        { label: 'Patients', path: '/admin/patients' },
      ];
    }
    return [];
  };

  const navLinks = getNavLinks();

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <div style={styles.brand}>
          <Link to="/" style={styles.brandLink}>
            <span style={styles.brandIcon}>⚕️</span>
            Nexus Health
          </Link>
        </div>

        <div style={styles.navLinks}>
          {navLinks.map(link => (
            <Link key={link.path} to={link.path} style={styles.navLink}>
              {link.label}
            </Link>
          ))}
        </div>

        <div style={styles.userSection}>
          <span style={styles.userName}>
            {user?.name || 'User'}
          </span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    background: 'linear-gradient(135deg, #001836 0%, #002d5b 100%)',
    color: '#fff',
    padding: '12px 0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    flex: 0,
  },
  brandLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#fff',
    textDecoration: 'none',
    fontSize: '18px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
  },
  brandIcon: {
    fontSize: '20px',
  },
  navLinks: {
    display: 'flex',
    gap: '32px',
    flex: 1,
    justifyContent: 'center',
  },
  navLink: {
    color: '#fff',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    padding: '8px 12px',
    borderRadius: '6px',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 0,
  },
  userName: {
    fontSize: '14px',
    fontWeight: '500',
  },
  logoutBtn: {
    padding: '8px 16px',
    backgroundColor: '#ff6b6b',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#ff5252',
    },
  },
};
