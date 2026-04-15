import React, { useEffect, useState } from 'react';
import { adminGetAllSessions, adminDeleteSession } from '../../services/videoApi';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';

export default function AdminVideoSessions() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [terminatingId, setTerminatingId] = useState(null);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    try {
      const data = await adminGetAllSessions();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Failed to fetch admin sessions:', err);
      // If 403, redirect or show error
      if (err.response?.status === 403) {
        toast.error('Admin access required');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTerminate = async (sessionId) => {
    if (!window.confirm('Are you sure you want to terminate this live session? Owners will be disconnected.')) return;
    
    try {
      setTerminatingId(sessionId);
      await adminDeleteSession(sessionId);
      toast.success('Session terminated');
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
    } catch (err) {
      toast.error('Failed to terminate session');
    } finally {
      setTerminatingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={s.root}>
      <Toaster position="top-right" />
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box}`}</style>

      {/* Sidebar - Reusing Admin Dashboard Style */}
      <aside style={s.sidebar}>
        <div style={s.brand}><span style={s.dot}/>Nexus Health</div>
        <div style={s.adminBadge}>Admin Panel</div>
        <nav style={s.nav}>
          {[
            { label: 'Dashboard', path: '/admin/dashboard' },
            { label: 'Doctors', path: '/admin/doctors' },
            { label: 'Patients', path: '/admin/patients' },
            { label: 'Video Sessions', path: '/admin/video', active: true },
            { label: 'Transactions', path: '/admin/transactions' },
          ].map(item => (
            <Link key={item.path} to={item.path} style={{ ...s.navItem, ...(item.active ? s.navItemActive : {}) }}>
              {item.label}
            </Link>
          ))}
        </nav>
        <button onClick={handleLogout} style={s.logoutBtn}>← Logout</button>
      </aside>

      {/* Main Content */}
      <main style={s.main}>
        <header style={s.header}>
          <div style={s.headerLeft}>
            <h1 style={s.title}>Video Console</h1>
            <p style={s.subtitle}>Monitor and manage live consultation rooms</p>
          </div>
          <button onClick={fetchSessions} className="refresh-btn" style={s.refreshBtn}>
            Refresh List
          </button>
        </header>

        {loading ? (
          <div style={s.msg}>Syncing with video service...</div>
        ) : (
          <div style={s.tableContainer}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Appointment ID</th>
                  <th style={s.th}>Room Name</th>
                  <th style={s.th}>Participants (P/D)</th>
                  <th style={s.th}>Created At</th>
                  <th style={s.th}>Expires In</th>
                  <th style={s.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={s.emptyCell}>No active video sessions found.</td>
                  </tr>
                ) : (
                  sessions.map(ss => (
                    <tr key={ss.sessionId} style={s.tr}>
                      <td style={s.td}><code style={s.code}>{ss.appointmentId?.slice(-8).toUpperCase()}</code></td>
                      <td style={s.td}>{ss.roomName}</td>
                      <td style={s.td}>
                        <div style={s.participantInfo}>
                          <span title="Patient ID">{ss.patientUserId?.slice(-4)}</span> / 
                          <span title="Doctor ID">{ss.doctorUserId?.slice(-4)}</span>
                        </div>
                      </td>
                      <td style={s.td}>{new Date(ss.createdAt).toLocaleTimeString()}</td>
                      <td style={s.td}>
                        <span style={s.expiryTag}>
                          {Math.max(0, Math.floor((new Date(ss.expiresAt) - Date.now()) / 60000))} mins
                        </span>
                      </td>
                      <td style={s.td}>
                        <button 
                          onClick={() => handleTerminate(ss.sessionId)}
                          disabled={terminatingId === ss.sessionId}
                          style={s.deleteBtn}
                        >
                          {terminatingId === ss.sessionId ? '...' : 'Terminate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
  navItemActive: { background: 'rgba(255,255,255,0.1)', color: '#fff' },
  logoutBtn: { margin: '0 12px 24px', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, textAlign: 'left' },
  
  main: { flex: 1, padding: 36, overflow: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 800, color: '#0b1f3a', margin: 0 },
  subtitle: { fontSize: 14, color: '#7a92aa', margin: '4px 0 0' },
  refreshBtn: { padding: '8px 16px', borderRadius: 10, border: '1px solid #e4ecf7', background: '#fff', color: '#1a56db', fontWeight: 600, cursor: 'pointer', fontSize: 13 },
  
  msg: { color: '#7a92aa', fontSize: 14 },
  tableContainer: { background: '#fff', borderRadius: 16, border: '1px solid #e4ecf7', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,24,54,0.03)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '16px 20px', fontSize: 12, color: '#7a92aa', fontWeight: 700, textTransform: 'uppercase', background: '#fafbfc', borderBottom: '1px solid #e4ecf7' },
  td: { padding: '16px 20px', fontSize: 14, color: '#0b1f3a', borderBottom: '1px solid #f4f7fb' },
  emptyCell: { padding: '40px', textAlign: 'center', color: '#7a92aa', fontSize: 14 },
  
  code: { background: '#ebf2ff', color: '#1a56db', padding: '2px 6px', borderRadius: 4, fontStyle: 'normal' },
  expiryTag: { background: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 },
  deleteBtn: { background: '#fff5f5', color: '#ef4444', border: '1px solid #fee2e2', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }
};
