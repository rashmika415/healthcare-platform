import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminDoctors() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const [msg,     setMsg]     = useState('');

  const fetchUsers = () => {
    api.get('/admin/users')
      .then(r  => setUsers(r.data.users.filter(u => u.role === 'doctor')))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(fetchUsers, []);

  const handleVerify = async (id) => {
    try {
      await api.put(`/admin/verify-doctor/${id}`);
      setMsg('Doctor verified successfully!');
      fetchUsers();
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('Failed to verify doctor'); }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Rejection reason (optional):') || '';
    try {
      await api.put(`/admin/reject-doctor/${id}`, { reason });
      setMsg('Doctor rejected.');
      fetchUsers();
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('Failed to reject doctor'); }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this doctor?')) return;
    try {
      await api.put(`/admin/deactivate/${id}`);
      setMsg('Doctor deactivated.');
      fetchUsers();
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('Failed to deactivate'); }
  };

  const handleActivate = async (id) => {
    if (!window.confirm('Activate this doctor?')) return;
    try {
      await api.put(`/admin/activate/${id}`);
      setMsg('Doctor activated.');
      fetchUsers();
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('Failed to activate'); }
  };

  const filtered = filter === 'all'     ? users
    : filter === 'verified'   ? users.filter(u => u.verificationStatus === 'verified')
    : filter === 'rejected'   ? users.filter(u => u.verificationStatus === 'rejected')
    : users.filter(u => u.verificationStatus === 'pending');

  return (
    <div style={d.wrap}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box}`}</style>
      <h2 style={d.title}>Doctor Management</h2>

      {msg && <div style={d.msg}>{msg}</div>}

      {/* Filter tabs */}
      <div style={d.tabs}>
        {[['all','All Doctors'],['pending','Pending Approval'],['verified','Verified'],['rejected','Rejected']].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)}
            style={{ ...d.tab, ...(filter === v ? d.tabActive : {}) }}>{l}</button>
        ))}
      </div>

      {loading ? <div style={d.loading}>Loading...</div> : (
        <div style={d.list}>
          {filtered.length === 0 ? (
            <div style={d.empty}>No doctors found</div>
          ) : filtered.map(doc => (
            <div key={doc._id} style={d.card}>
              <div style={d.cardLeft}>
                <div style={d.avatar}>{doc.name?.charAt(0)}</div>
                <div>
                  <div style={d.name}>{doc.name}</div>
                  <div style={d.email}>{doc.email}</div>
                  <div style={d.joined}>Joined {new Date(doc.createdAt).toLocaleDateString()}</div>
                  {doc.verificationStatus === 'rejected' && (
                    <div style={d.reason}>Reason: {doc.verificationRejectedReason || '—'}</div>
                  )}
                </div>
              </div>
              <div style={d.cardRight}>
                <span style={{ ...d.badge, ...(doc.verificationStatus === 'verified' ? d.badgeGreen : doc.verificationStatus === 'rejected' ? d.badgeRed : d.badgeAmber) }}>
                  {doc.verificationStatus === 'verified' ? '✓ Verified' : doc.verificationStatus === 'rejected' ? 'Rejected' : 'Pending'}
                </span>
                <span style={{ ...d.badge, ...(doc.isActive ? d.badgeBlue : d.badgeGray) }}>
                  {doc.isActive ? 'Active' : 'Inactive'}
                </span>
                <div style={d.actions}>
                  {doc.verificationStatus === 'pending' && (
                    <button onClick={() => handleVerify(doc._id)} style={d.verifyBtn}>
                      Verify
                    </button>
                  )}
                  {doc.verificationStatus === 'pending' && (
                    <button onClick={() => handleReject(doc._id)} style={d.rejectBtn}>
                      Reject
                    </button>
                  )}
                  {doc.isActive ? (
                    <button onClick={() => handleDeactivate(doc._id)} style={d.deactBtn}>Deactivate</button>
                  ) : (
                    <button onClick={() => handleActivate(doc._id)} style={d.actBtn}>Activate</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const d = {
  wrap:       { padding: 36, fontFamily: "'DM Sans',sans-serif", maxWidth: 900 },
  title:      { fontSize: 22, fontWeight: 800, color: '#0b1f3a', margin: '0 0 20px', letterSpacing: '-0.3px' },
  msg:        { background: '#f0fdf4', color: '#16a34a', padding: '10px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 600 },
  tabs:       { display: 'flex', gap: 8, marginBottom: 20 },
  tab:        { padding: '8px 16px', borderRadius: 20, border: '1px solid #e4ecf7', background: '#fff', color: '#7a92aa', fontSize: 13, fontWeight: 500, cursor: 'pointer' },
  tabActive:  { background: '#1a0533', color: '#fff', border: '1px solid #1a0533' },
  loading:    { color: '#7a92aa', fontSize: 14 },
  empty:      { color: '#7a92aa', fontSize: 14, padding: '40px 0', textAlign: 'center' },
  list:       { display: 'flex', flexDirection: 'column', gap: 10 },
  card:       { background: '#fff', border: '1px solid #e4ecf7', borderRadius: 14, padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  cardLeft:   { display: 'flex', alignItems: 'center', gap: 14 },
  avatar:     { width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#f0ebff,#e0d4ff)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 },
  name:       { fontSize: 14, fontWeight: 700, color: '#0b1f3a' },
  email:      { fontSize: 12, color: '#7a92aa', marginTop: 2 },
  joined:     { fontSize: 11, color: '#b0c4d8', marginTop: 2 },
  reason:     { fontSize: 11, color: '#b45309', marginTop: 6, maxWidth: 420 },
  cardRight:  { display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  badge:      { fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20 },
  badgeGreen: { background: '#f0fdf4', color: '#16a34a' },
  badgeAmber: { background: '#fef3c7', color: '#d97706' },
  badgeRed:   { background: '#fee2e2', color: '#b91c1c' },
  badgeBlue:  { background: '#dbeafe', color: '#1d4ed8' },
  badgeGray:  { background: '#f0f4f9', color: '#7a92aa' },
  actions:    { display: 'flex', gap: 8 },
  verifyBtn:  { padding: '7px 16px', background: '#1a0533', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  rejectBtn:  { padding: '7px 16px', background: '#fff7ed', color: '#c2410c', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 },
  deactBtn:   { padding: '7px 16px', background: '#fff5f5', color: '#e53e3e', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  actBtn:     { padding: '7px 16px', background: '#1a0533', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 },
};