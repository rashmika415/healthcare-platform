// client/src/pages/patient/PatientLayout.jsx
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/patient/dashboard',     icon: '⬛', label: 'Dashboard' },
  { path: '/patient/reports',       icon: '📄', label: 'Medical Reports' },
  { path: '/patient/prescriptions', icon: '💊', label: 'Prescriptions' },
  { path: '/patient/history',       icon: '🕐', label: 'Medical History' },
  { path: '/patient/appointments',  icon: '📅', label: 'Appointments' },
];

export default function PatientLayout({ children, title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    window.location.replace('/');
  };
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/patient/dashboard');
  };

  const canShowTopLogout = location.pathname.startsWith('/patient/');

  return (
    <div style={s.root}>
      <style>{css}</style>

      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.sideTop}>
          <div style={s.brand}>
            <span style={s.brandDot} />
            MediConnect
          </div>
        </div>

        <div style={s.avatarWrap}>
          <Link to="/patient/profile" style={s.avatarLink} aria-label="Go to profile" title="Profile">
            <div style={s.avatar}>{user?.name?.charAt(0).toUpperCase()}</div>
          </Link>
          <div style={s.userName}>{user?.name}</div>
          <div style={s.userRole}>Patient</div>
        </div>

        <nav style={s.nav}>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navActive : {}) })}
            >
              <span style={s.navIcon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button onClick={handleBack} style={s.backBtn}>
          ← Back
        </button>
      </aside>

      {/* Main */}
      <main style={s.main}>
        <div style={s.topBar}>
          <div style={s.topBarRow}>
            <div>
              <h1 style={s.pageTitle}>{title}</h1>
              {subtitle && <p style={s.pageSub}>{subtitle}</p>}
            </div>
            {canShowTopLogout && (
              <button onClick={handleLogout} style={s.topLogoutBtn}>
                Logout
              </button>
            )}
          </div>
        </div>
        <div style={s.content}>{children}</div>
      </main>
    </div>
  );
}

const s = {
  root:      { display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", background: '#f4f7fb' },
  sidebar:   { width: 248, background: '#0b1f3a', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' },
  sideTop:   { padding: '24px 20px 0' },
  brand:     { display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' },
  brandDot:  { width: 9, height: 9, borderRadius: '50%', background: '#2DD4BF' },
  avatarWrap:{ textAlign: 'center', padding: '28px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  avatarLink:{ textDecoration: 'none', display: 'inline-block' },
  avatar:    { width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#1a56db,#2DD4BF)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, margin: '0 auto 10px' },
  userName:  { color: '#fff', fontWeight: 600, fontSize: 14 },
  userRole:  { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 3 },
  nav:       { padding: '16px 12px', flex: 1 },
  navItem:   { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: 13, fontWeight: 500, marginBottom: 2, transition: 'all 0.15s' },
  navActive: { background: 'rgba(26,86,219,0.35)', color: '#fff' },
  navIcon:   { fontSize: 14, width: 20, textAlign: 'center' },
  backBtn:    { margin: '0 12px 24px', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, textAlign: 'left', fontWeight: 600 },
  main:      { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  topBar:    { padding: '32px 36px 0', borderBottom: '1px solid #e4ecf7', background: '#fff' },
  topBarRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  pageTitle: { fontSize: 22, fontWeight: 800, color: '#0b1f3a', margin: '0 0 4px', letterSpacing: '-0.3px' },
  pageSub:   { fontSize: 13, color: '#7a92aa', margin: '0 0 24px' },
  topLogoutBtn: { marginTop: 2, padding: '9px 14px', borderRadius: 10, border: '1px solid #f4c7c7', background: '#fff5f5', color: '#c53030', cursor: 'pointer', fontSize: 13, fontWeight: 700 },
  content:   { padding: '28px 36px', flex: 1 },
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
* { box-sizing: border-box; }
a[class] { transition: background 0.15s, color 0.15s; }
`;