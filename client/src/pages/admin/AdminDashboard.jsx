// client/src/pages/admin/AdminDashboard.jsx
import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ NEW: notification state
  const [notification, setNotification] = useState(null);
  const prevPendingRef = useRef(null);

  // ✅ FETCH STATS FUNCTION (reusable)
  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);

      // ✅ Show bell notification only when pending count increases
      const pending = res.data?.pendingDoctors || 0;
      const prev = prevPendingRef.current ?? pending;

      if (pending > prev) {
        setNotification(`🔔 ${pending - prev} new doctor(s) waiting for approval`);
        setTimeout(() => setNotification(null), 7000);
      } else if (pending === 0) {
        setNotification(null);
      }

      prevPendingRef.current = pending;

    } catch (err) {
      console.error('Error fetching stats:', err);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  // ✅ INITIAL LOAD + AUTO REFRESH
  useEffect(() => {
    fetchStats();

    // auto refresh every 10 seconds
    const interval = setInterval(fetchStats, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={s.root}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box}`}</style>

      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.brand}><span style={s.dot}/>MediConnect</div>
        <div style={s.adminBadge}>Admin Panel</div>
        <nav style={s.nav}>
          {[
            { label: 'Dashboard', path: '/admin/dashboard' },
            { label: 'Doctors', path: '/admin/doctors' },
            { label: 'Patients', path: '/admin/patients' },
            { label: 'Transactions', path: '/admin/transactions' },
          ].map(item => (
            <Link key={item.path} to={item.path} style={s.navItem}>
              {item.label}
            </Link>
          ))}
        </nav>
        <button onClick={handleLogout} style={s.logoutBtn}>← Logout</button>
      </aside>

      {/* Main */}
      <main style={s.main}>
        <div style={s.topBar}>
          <h1 style={s.title}>Dashboard</h1>

          {/* Top-right: Bell + admin info */}
          <div style={s.topRight}>
            <Link to="/admin/doctors" style={s.bellBtn} aria-label="Pending doctor verifications">
              <span style={s.bellIcon}>🔔</span>
              {!!(stats?.pendingDoctors > 0) && (
                <span style={s.bellBadge}>{stats?.pendingDoctors}</span>
              )}
            </Link>

            <div style={s.rightMeta}>
              {notification && (
                <div style={s.notification}>
                  {notification}
                </div>
              )}
              <div style={s.adminInfo}>
                Logged in as <strong>{user?.name}</strong>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={s.msg}>Loading stats...</div>
        ) : (
          <>
            {/* Stat cards */}
            <div style={s.statsGrid}>
              {[
                { label: 'Total Users', value: stats?.totalUsers || 0, color: '#1a56db', bg: '#ebf2ff' },
                { label: 'Total Patients', value: stats?.totalPatients || 0, color: '#0891b2', bg: '#e0f7fa' },
                { label: 'Total Doctors', value: stats?.totalDoctors || 0, color: '#7c3aed', bg: '#f0ebff' },
                { label: 'Pending Approvals', value: stats?.pendingDoctors || 0, color: '#d97706', bg: '#fef3c7' },
              ].map(st => (
                <div key={st.label} style={s.statCard}>
                  <div style={{ ...s.statNum, color: st.color }}>{st.value}</div>
                  <div style={s.statLabel}>{st.label}</div>
                  <div style={{ ...s.statBar, background: st.bg }} />
                </div>
              ))}
            </div>

            {/* Quick links */}
            <div style={s.quickGrid}>
              <Link to="/admin/doctors" style={s.quickCard}>
                <div style={s.quickIcon}>🩺</div>
                <div style={s.quickTitle}>Pending Doctor Approvals</div>
                <div style={s.quickCount}>{stats?.pendingDoctors || 0} waiting</div>
                <div style={s.quickArrow}>→</div>
              </Link>

              <Link to="/admin/patients" style={s.quickCard}>
                <div style={s.quickIcon}>👥</div>
                <div style={s.quickTitle}>All Patients</div>
                <div style={s.quickCount}>{stats?.totalPatients || 0} registered</div>
                <div style={s.quickArrow}>→</div>
              </Link>

              <Link to="/admin/transactions" style={s.quickCard}>
                <div style={s.quickIcon}>💳</div>
                <div style={s.quickTitle}>Transactions</div>
                <div style={s.quickCount}>View all payments</div>
                <div style={s.quickArrow}>→</div>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const s = {
  root: { display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans',sans-serif", background: '#f4f7fb' },
  sidebar: { width: 220, background: '#1a0533', display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0 },
  brand: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 700, color: '#fff', padding: '0 20px 16px' },
  dot: { width: 9, height: 9, borderRadius: '50%', background: '#a855f7', display: 'inline-block' },
  adminBadge: { margin: '0 12px 20px', background: 'rgba(168,85,247,0.2)', color: '#d8b4fe', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, textAlign: 'center', letterSpacing: 1, textTransform: 'uppercase' },
  nav: { flex: 1, padding: '0 12px' },
  navItem: { display: 'block', padding: '10px 14px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 13, fontWeight: 500, borderRadius: 8, marginBottom: 2 },
  logoutBtn: { margin: '0 12px 24px', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, textAlign: 'left' },
  main: { flex: 1, padding: 36 },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  title: { fontSize: 22, fontWeight: 800, color: '#0b1f3a', margin: 0, letterSpacing: '-0.3px' },
  topRight: { display: 'flex', alignItems: 'center', gap: 14 },
  bellBtn: {
    position: 'relative',
    width: 42,
    height: 42,
    borderRadius: 12,
    background: '#fff',
    border: '1px solid #e4ecf7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    boxShadow: '0 8px 22px -16px rgba(0,24,54,0.35)'
  },
  bellIcon: { fontSize: 18, lineHeight: 1 },
  bellBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    padding: '0 6px',
    borderRadius: 999,
    background: '#ef4444',
    color: '#fff',
    fontSize: 11,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #f4f7fb'
  },
  rightMeta: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  adminInfo: { fontSize: 13, color: '#7a92aa' },
  msg: { color: '#7a92aa', fontSize: 14 },

  // ✅ NEW notification style
  notification: {
    background: '#fff3cd',
    color: '#856404',
    padding: '8px 14px',
    borderRadius: 8,
    fontSize: 12,
    marginBottom: 6,
    border: '1px solid #ffeeba'
  },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 },
  statCard: { background: '#fff', borderRadius: 14, padding: 22, border: '1px solid #e4ecf7', position: 'relative', overflow: 'hidden' },
  statNum: { fontSize: 34, fontWeight: 800, letterSpacing: '-1px', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#7a92aa', fontWeight: 500 },
  statBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 4 },

  quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 },
  quickCard: { background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #e4ecf7', textDecoration: 'none', display: 'block', position: 'relative', transition: 'box-shadow 0.2s' },
  quickIcon: { fontSize: 28, marginBottom: 12 },
  quickTitle: { fontSize: 14, fontWeight: 700, color: '#0b1f3a', marginBottom: 6 },
  quickCount: { fontSize: 13, color: '#7a92aa' },
  quickArrow: { position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#c3d4f0' },
};