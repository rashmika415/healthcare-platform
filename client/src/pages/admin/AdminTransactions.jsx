import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const money = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return '—';
  return `Rs.${num.toLocaleString()}`;
};

export default function AdminTransactions() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPayments = async () => {
    try {
      const res = await api.get('/admin/transactions');
      setPayments(res.data?.payments || []);
    } catch (e) {
      console.error('Error fetching payments:', e);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter(p => (
      String(p._id || '').toLowerCase().includes(q) ||
      String(p.appointmentId || '').toLowerCase().includes(q) ||
      String(p.patientId || '').toLowerCase().includes(q) ||
      String(p.doctorId || '').toLowerCase().includes(q) ||
      String(p.status || '').toLowerCase().includes(q)
    ));
  }, [payments, search]);

  const totals = useMemo(() => {
    const total = filtered.length;
    const paid = filtered.filter(p => String(p.status).toUpperCase() === 'PAID').length;
    const pending = filtered.filter(p => String(p.status).toUpperCase() === 'PENDING').length;
    const revenue = filtered
      .filter(p => String(p.status).toUpperCase() === 'PAID')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return { total, paid, pending, revenue };
  }, [filtered]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={s.root}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box}`}</style>

      <aside style={s.sidebar}>
        <div style={s.brand}><span style={s.dot}/>Nexus Health</div>
        <div style={s.adminBadge}>Admin Panel</div>

        <nav style={s.nav}>
          {[
            { label: 'Dashboard', path: '/admin/dashboard' },
            { label: 'Doctors', path: '/admin/doctors' },
            { label: 'Patients', path: '/admin/patients' },
            { label: 'Appointments', path: '/admin/appointments' },
            { label: 'Video Sessions', path: '/admin/video' },
            { label: 'Transactions', path: '/admin/transactions', active: true },
          ].map(item => (
            <Link key={item.path} to={item.path} style={{ ...s.navItem, ...(item.active ? s.navItemActive : {}) }}>
              {item.label}
            </Link>
          ))}
        </nav>

        <button onClick={handleLogout} style={s.logoutBtn}>← Logout</button>
      </aside>

      <main style={s.main}>
        <div style={s.topBar}>
          <div>
            <h1 style={s.title}>Transactions</h1>
            <div style={s.subtitle}>Logged in as <strong>{user?.name}</strong></div>
          </div>
          <button onClick={fetchPayments} style={s.refreshBtn}>Refresh</button>
        </div>

        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.cardHeaderTop}>
              <div style={s.kpis}>
                <div style={s.kpi}><div style={s.kpiNum}>{totals.total}</div><div style={s.kpiLabel}>Total</div></div>
                <div style={s.kpi}><div style={s.kpiNum}>{totals.paid}</div><div style={s.kpiLabel}>Paid</div></div>
                <div style={s.kpi}><div style={s.kpiNum}>{totals.pending}</div><div style={s.kpiLabel}>Pending</div></div>
                <div style={s.kpi}><div style={s.kpiNum}>{money(totals.revenue)}</div><div style={s.kpiLabel}>Paid Revenue</div></div>
              </div>
              <input
                placeholder="Search by payment/appointment/patient/doctor/status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={s.search}
              />
            </div>
          </div>

          {loading ? (
            <div style={s.msg}>Loading payments...</div>
          ) : filtered.length === 0 ? (
            <div style={s.empty}>No payments found.</div>
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Payment</th>
                    <th style={s.th}>Appointment</th>
                    <th style={s.th}>Patient</th>
                    <th style={s.th}>Doctor</th>
                    <th style={s.th}>Amount</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p._id} style={s.tr}>
                      <td style={s.td}><code style={s.code}>{String(p._id).slice(-8).toUpperCase()}</code></td>
                      <td style={s.td}><code style={s.code}>{String(p.appointmentId || '').slice(-8).toUpperCase()}</code></td>
                      <td style={s.td}><code style={s.code}>{String(p.patientId || '').slice(-6)}</code></td>
                      <td style={s.td}><code style={s.code}>{String(p.doctorId || '').slice(-6)}</code></td>
                      <td style={s.td}>{money(p.amount)}</td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, ...(String(p.status).toUpperCase() === 'PAID' ? s.badgePaid : s.badgePending) }}>
                          {String(p.status || 'PENDING').toUpperCase()}
                        </span>
                      </td>
                      <td style={s.td}>{p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  title: { fontSize: 22, fontWeight: 800, color: '#0b1f3a', margin: 0, letterSpacing: '-0.3px' },
  subtitle: { fontSize: 13, color: '#7a92aa', marginTop: 6 },
  refreshBtn: { padding: '8px 16px', borderRadius: 10, border: '1px solid #e4ecf7', background: '#fff', color: '#1a56db', fontWeight: 700, cursor: 'pointer', fontSize: 13 },

  card: { background: '#fff', borderRadius: 14, border: '1px solid #e4ecf7', overflow: 'hidden' },
  cardHeader: { padding: 18, borderBottom: '1px solid #e4ecf7', background: '#f8fbff' },
  cardHeaderTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  kpis: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  kpi: { background: '#fff', border: '1px solid #e4ecf7', borderRadius: 12, padding: '10px 12px', minWidth: 140 },
  kpiNum: { fontSize: 16, fontWeight: 800, color: '#0b1f3a' },
  kpiLabel: { fontSize: 12, color: '#7a92aa', marginTop: 2, fontWeight: 600 },
  search: { padding: '10px 14px', border: '1.5px solid #e4ecf7', borderRadius: 10, fontSize: 13, width: 360, outline: 'none', fontFamily: 'inherit' },

  msg: { padding: 22, color: '#7a92aa', fontSize: 14 },
  empty: { padding: 30, color: '#7a92aa', fontSize: 14 },
  tableWrap: { overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#7a92aa', fontWeight: 800, textTransform: 'uppercase', background: '#fafbfc', borderBottom: '1px solid #e4ecf7', whiteSpace: 'nowrap' },
  td: { padding: '14px 16px', fontSize: 13, color: '#0b1f3a', borderBottom: '1px solid #f4f7fb', whiteSpace: 'nowrap' },
  tr: {},
  code: { background: '#ebf2ff', color: '#1a56db', padding: '2px 6px', borderRadius: 6, fontStyle: 'normal' },
  badge: { padding: '6px 10px', borderRadius: 999, fontSize: 11, fontWeight: 900, letterSpacing: 0.3 },
  badgePaid: { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
  badgePending: { background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' },
};