// client/src/pages/patient/PatientLayout.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/patient/dashboard', icon: 'DB', label: 'Dashboard' },
  { path: '/patient/appointments', icon: 'AP', label: 'Appointments' },
  { path: '/video/hub', icon: 'VC', label: 'Consultations' },
  { path: '/patient/reports', icon: 'RP', label: 'Reports' },
  { path: '/patient/prescriptions', icon: 'PR', label: 'Prescriptions' },
  { path: '/patient/history', icon: 'MH', label: 'Medical-History' }
];

export default function PatientLayout({
  children,
  title,
  subtitle,
  searchTerm = '',
  onSearchChange,
  onSearchSubmit
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1120);

  const firstName = useMemo(() => {
    const full = user?.name || 'Patient';
    return full.split(' ')[0];
  }, [user?.name]);

  const handleLogout = () => {
    logout();
    window.location.replace('/');
  };

  const handleSearchKeyDown = (event) => {
    if (event.key !== 'Enter') return;
    onSearchSubmit?.();
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1120);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) setMenuOpen(false);
  }, [isMobile]);

  const sidebarStyle = isMobile
    ? {
        ...s.sidebar,
        ...s.sidebarMobile,
        ...(menuOpen ? s.sidebarOpen : {})
      }
    : s.sidebar;

  return (
    <div style={s.root}>
      <style>{css}</style>

      <button
        type="button"
        className="patient-mobile-menu-btn"
        style={{ ...s.mobileMenuBtn, ...(isMobile ? s.mobileMenuVisible : {}) }}
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        Menu
      </button>

      {menuOpen && isMobile && <button type="button" style={s.backdrop} aria-label="Close menu" onClick={() => setMenuOpen(false)} />}

      <aside style={sidebarStyle}>
        <div style={s.sideTop}>
          <div style={s.sideSubBrand}>Nexus Health</div>
          <div style={s.sideSubBrand2}>TELEMEDICINE PORTAL</div>
        </div>

        <nav style={s.nav}>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className="patient-nav-item"
              onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navActive : {}) })}
            >
              <span style={s.navIcon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="patient-cta-btn" onClick={() => navigate('/')} style={s.ctaBtn}>
          Home
        </button>
      </aside>

      <main style={s.main}>
        <div style={s.topBar} className="patient-topbar-shell">
          <div style={s.topTopRow}>
            <input
              type="search"
              placeholder="Search records, doctors..."
              value={searchTerm}
              onChange={(event) => onSearchChange?.(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              style={s.searchInput}
            />
            <div style={s.topIcons}>
              <button type="button" className="patient-icon-btn" style={s.iconBtn} aria-label="Notifications">N</button>
              <button type="button" className="patient-icon-btn" style={s.iconBtn} aria-label="Help">?</button>
              <button type="button" className="patient-icon-btn" style={s.iconBtn} aria-label="Settings" onClick={() => navigate('/patient/profile')}>*</button>
              <Link to="/patient/profile" style={s.profileLink}>
                <div>
                  <div style={s.profileName}>{firstName}</div>
                  <div style={s.profileRole}>PATIENT</div>
                </div>
                <div style={s.avatar}>{firstName.charAt(0).toUpperCase()}</div>
              </Link>
              <button type="button" className="patient-logout-btn" onClick={handleLogout} style={s.logoutBtn}>Logout</button>
            </div>
          </div>
          <h1 style={s.pageTitle}>{title}</h1>
          {subtitle && <p style={s.pageSub}>{subtitle}</p>}
        </div>
        <div style={s.content}>{children}</div>
      </main>
    </div>
  );
}

const s = {
  root: { display: 'flex', minHeight: '100vh', fontFamily: "'Manrope', sans-serif", background: 'linear-gradient(180deg, #f3f7fc 0%, #ecf2f9 100%)' },
  mobileMenuBtn: { display: 'none', position: 'fixed', top: 14, left: 14, zIndex: 60, border: 'none', borderRadius: 9, background: '#001836', color: '#fff', padding: '9px 12px', fontSize: 12, fontWeight: 700, letterSpacing: 0.4 },
  mobileMenuVisible: { display: 'block' },
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(11, 25, 38, 0.34)', border: 'none', zIndex: 30 },
  sidebar: {
    width: 224,
    background: 'linear-gradient(180deg, #001836 0%, #002d5b 100%)',
    borderRight: '1px solid #133e69',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    height: '100vh',
    position: 'sticky',
    top: 0,
    zIndex: 40,
    boxShadow: 'inset -1px 0 0 #0f3659'
  },
  sidebarMobile: {
    position: 'fixed',
    left: 0,
    top: 0,
    width: 'min(82vw, 280px)',
    transform: 'translateX(-108%)',
    opacity: 0,
    visibility: 'hidden',
    pointerEvents: 'none',
    transition: 'transform 0.26s ease, opacity 0.2s ease, visibility 0.2s ease',
    boxShadow: '0 20px 44px rgba(17, 39, 58, 0.28)'
  },
  sidebarOpen: { transform: 'translateX(0)', opacity: 1, visibility: 'visible', pointerEvents: 'auto' },
  sideTop: { padding: '20px 18px 14px', borderBottom: '1px solid rgba(176, 216, 255, 0.2)' },
  brand: { fontSize: 22, fontWeight: 500, color: '#29495f', letterSpacing: '-0.3px' },
  sideSubBrand: { marginTop: 18, fontSize: 20, color: '#edf6ff', letterSpacing: 0.25, fontWeight: 600 },
  sideSubBrand2: { fontSize: 11, letterSpacing: 1.3, color: '#9ec3e6', marginTop: 4 },
  nav: { padding: '16px 14px', flex: 1 },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 11,
    padding: '12px 14px',
    borderRadius: 11,
    color: '#c8ddf1',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 6,
    letterSpacing: 0.2,
    border: '1px solid rgba(177, 210, 239, 0.08)',
    transition: 'background 0.18s ease, border-color 0.18s ease, color 0.18s ease'
  },
  navActive: { background: 'rgba(220, 238, 255, 0.14)', color: '#ffffff', borderColor: 'rgba(190, 224, 255, 0.35)' },
  navIcon: { fontSize: 13, width: 18, textAlign: 'center', color: '#9fc9ef' },
  ctaBtn: {
    margin: '0 14px 18px',
    background: 'linear-gradient(135deg, #0e7490, #1d4ed8)',
    color: '#ffffff',
    border: '1px solid #4b83d8',
    borderRadius: 10,
    padding: '12px 14px',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.9,
    cursor: 'pointer',
    boxShadow: '0 8px 22px rgba(10, 62, 125, 0.35)'
  },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  topBar: {
    margin: '14px 18px 0',
    padding: '14px 18px 16px',
    border: '1px solid #d8e6f5',
    borderRadius: 16,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, #f4f8fd 100%)',
    boxShadow: '0 12px 28px rgba(3, 40, 88, 0.06)'
  },
  topTopRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  searchInput: {
    width: '100%',
    maxWidth: 390,
    height: 38,
    borderRadius: 10,
    border: '1px solid #cdddef',
    padding: '0 14px',
    background: '#ffffff',
    color: '#23425e',
    fontSize: 13,
    outline: 'none',
    boxShadow: '0 1px 0 rgba(0, 24, 54, 0.03)'
  },
  topIcons: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' },
  iconBtn: { width: 28, height: 28, borderRadius: '50%', border: '1px solid #cfe0f0', background: '#ffffff', color: '#2f5371', fontSize: 14, cursor: 'pointer', lineHeight: 1 },
  profileLink: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginLeft: 6 },
  profileName: { fontSize: 11, fontWeight: 700, color: '#163854', textTransform: 'capitalize' },
  profileRole: { fontSize: 9, color: '#5e7b94', letterSpacing: 0.8 },
  avatar: { width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg, #001836, #002d5b)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 },
  logoutBtn: {
    border: '1px solid #c8d9ea',
    background: '#f4f9ff',
    color: '#1a4566',
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer'
  },
  pageTitle: { fontSize: 44, fontFamily: "'Sora', sans-serif", fontWeight: 400, color: '#0c2d4a', margin: '14px 0 2px', letterSpacing: '-1px' },
  pageSub: { fontSize: 18, color: '#3e5f79', margin: '0' },
  content: { padding: '18px 18px 30px', flex: 1 }
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@400;600;700&display=swap');
* { box-sizing: border-box; }
a[class] { transition: background 0.15s, color 0.15s, border-color 0.15s; }
.patient-mobile-menu-btn { transition: background-color 0.16s ease, transform 0.12s ease; }
.patient-mobile-menu-btn:hover { background: #002d5b; }
.patient-mobile-menu-btn:active { transform: translateY(1px); }
.patient-nav-item:hover { background: rgba(220, 238, 255, 0.11); color: #ffffff; border-color: rgba(190, 224, 255, 0.3); transform: translateX(2px); }
.patient-cta-btn { transition: transform 0.14s ease, box-shadow 0.18s ease, filter 0.18s ease; }
.patient-cta-btn:hover { filter: saturate(1.06) brightness(1.05); box-shadow: 0 12px 26px rgba(10, 62, 125, 0.42); transform: translateY(-1px); }
.patient-cta-btn:active { transform: translateY(0); box-shadow: 0 8px 22px rgba(10, 62, 125, 0.35); }
.patient-icon-btn { transition: transform 0.12s ease, border-color 0.12s ease, background-color 0.12s ease; }
.patient-icon-btn:hover { transform: translateY(-1px); background: #edf4fb; border-color: #b9cfe4; }
.patient-logout-btn { transition: background-color 0.14s ease, border-color 0.14s ease, color 0.14s ease, transform 0.12s ease; }
.patient-logout-btn:hover { background: #eaf3ff; border-color: #b7cde4; color: #103a5c; transform: translateY(-1px); }
.patient-logout-btn:active { transform: translateY(0); }
@media (prefers-reduced-motion: reduce) {
  .patient-nav-item,
  .patient-cta-btn,
  .patient-icon-btn,
  .patient-mobile-menu-btn,
  .patient-logout-btn {
    transition: none !important;
  }
}
@media (max-width: 760px) {
  .patient-topbar-shell {
    margin: 12px 12px 0 !important;
    padding: 12px 12px 14px !important;
  }
}
`;