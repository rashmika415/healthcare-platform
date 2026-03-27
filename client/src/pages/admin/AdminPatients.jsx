import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    api.get('/admin/users')
      .then(r  => setPatients(r.data.users.filter(u => u.role === 'patient')))
      .catch(() => setPatients([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={p.wrap}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box}`}</style>
      <div style={p.topRow}>
        <h2 style={p.title}>All Patients</h2>
        <input placeholder="Search by name or email..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={p.search} />
      </div>

      {loading ? <div style={p.loading}>Loading...</div> : (
        <>
          <div style={p.countRow}>
            <span style={p.count}>{filtered.length} patient{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          <div style={p.table}>
            <div style={p.thead}>
              <span>Name</span>
              <span>Email</span>
              <span>Joined</span>
              <span>Status</span>
            </div>
            {filtered.length === 0 ? (
              <div style={p.empty}>No patients found</div>
            ) : filtered.map(pat => (
              <div key={pat._id} style={p.trow}>
                <div style={p.nameCell}>
                  <div style={p.avatar}>{pat.name?.charAt(0)}</div>
                  <span style={p.name}>{pat.name}</span>
                </div>
                <span style={p.cell}>{pat.email}</span>
                <span style={p.cell}>{new Date(pat.createdAt).toLocaleDateString()}</span>
                <span style={{ ...p.badge, ...(pat.isVerified ? p.badgeGreen : p.badgeGray) }}>
                  {pat.isVerified ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const p = {
  wrap:       { padding: 36, fontFamily: "'DM Sans',sans-serif" },
  topRow:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:      { fontSize: 22, fontWeight: 800, color: '#0b1f3a', margin: 0, letterSpacing: '-0.3px' },
  search:     { padding: '10px 16px', border: '1.5px solid #e4ecf7', borderRadius: 10, fontSize: 13, width: 280, outline: 'none', fontFamily: 'inherit' },
  loading:    { color: '#7a92aa', fontSize: 14 },
  countRow:   { marginBottom: 12 },
  count:      { fontSize: 13, color: '#7a92aa', fontWeight: 500 },
  table:      { background: '#fff', borderRadius: 14, border: '1px solid #e4ecf7', overflow: 'hidden' },
  thead:      { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', padding: '12px 20px', background: '#f8faff', fontSize: 12, fontWeight: 700, color: '#7a92aa', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e4ecf7' },
  trow:       { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', padding: '14px 20px', borderBottom: '1px solid #f0f4f9', alignItems: 'center' },
  nameCell:   { display: 'flex', alignItems: 'center', gap: 10 },
  avatar:     { width: 32, height: 32, borderRadius: 8, background: '#ebf2ff', color: '#1a56db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 },
  name:       { fontSize: 13, fontWeight: 600, color: '#0b1f3a' },
  cell:       { fontSize: 13, color: '#4a6080' },
  badge:      { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, justifySelf: 'start' },
  badgeGreen: { background: '#f0fdf4', color: '#16a34a' },
  badgeGray:  { background: '#f0f4f9', color: '#7a92aa' },
  empty:      { padding: '40px 20px', textAlign: 'center', color: '#7a92aa', fontSize: 14 },
};