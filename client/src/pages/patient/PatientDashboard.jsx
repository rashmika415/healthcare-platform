// client/src/pages/patient/PatientDashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import PatientLayout from './Patientlayout ';

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/patients/profile')
      .then(r => setProfile(r.data))
      .catch(() => navigate('/patient/setup'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;

  const stats = [
    { label: 'Medical Reports',    value: profile?.medicalReports?.length  || 0, color: '#1a56db', bg: '#ebf2ff', link: '/patient/reports',       icon: '📄' },
    { label: 'Prescriptions',      value: profile?.prescriptions?.length   || 0, color: '#0891b2', bg: '#e0f7fa', link: '/patient/prescriptions', icon: '💊' },
    { label: 'Past Consultations', value: profile?.medicalHistory?.length  || 0, color: '#7c3aed', bg: '#f0ebff', link: '/patient/history',       icon: '🕐' },
  ];

  return (
    <PatientLayout title={`Good day, ${profile?.name?.split(' ')[0]} 👋`} subtitle="Here's your health summary">

      {/* Stats row */}
      <div style={s.statsRow}>
        {stats.map(st => (
          <Link to={st.link} key={st.label} style={{ ...s.statCard, textDecoration: 'none' }}>
            <div style={{ ...s.statIcon, background: st.bg, color: st.color }}>{st.icon}</div>
            <div style={s.statNum}>{st.value}</div>
            <div style={s.statLabel}>{st.label}</div>
          </Link>
        ))}
      </div>

      <div style={s.grid}>
        {/* Profile summary */}
        <div style={s.card}>
          <div style={s.cardHead}>
            <span style={s.cardTitle}>Profile</span>
            <Link to="/patient/profile" style={s.editLink}>Edit →</Link>
          </div>
          <div style={s.infoList}>
            {[
              ['Email',        profile?.email         || '—'],
              ['Phone',        profile?.phone         || '—'],
              ['Blood Group',  profile?.bloodGroup    || '—'],
              ['Gender',       profile?.gender        || '—'],
              ['Date of Birth',profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : '—'],
              ['Address',      profile?.address       || '—'],
            ].map(([k, v]) => (
              <div key={k} style={s.infoRow}>
                <span style={s.infoKey}>{k}</span>
                <span style={s.infoVal}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency contact */}
        <div style={s.card}>
          <div style={s.cardHead}>
            <span style={s.cardTitle}>Emergency Contact</span>
          </div>
          {profile?.emergencyContact?.name ? (
            <div style={s.emergencyBox}>
              <div style={s.emergencyAvatar}>
                {profile.emergencyContact.name.charAt(0)}
              </div>
              <div>
                <div style={s.emergencyName}>{profile.emergencyContact.name}</div>
                <div style={s.emergencyDetail}>{profile.emergencyContact.relationship}</div>
                <div style={s.emergencyPhone}>{profile.emergencyContact.phone}</div>
              </div>
            </div>
          ) : (
            <div style={s.emptyState}>
              <p style={s.emptyText}>No emergency contact set.</p>
              <Link to="/patient/profile" style={s.emptyLink}>Add one →</Link>
            </div>
          )}

          {/* Quick actions */}
          <div style={s.cardHead2}><span style={s.cardTitle}>Quick Actions</span></div>
          <div style={s.quickActions}>
            {[
              { label: 'Upload Report',      path: '/patient/reports',       color: '#1a56db' },
              { label: 'View Prescriptions', path: '/patient/prescriptions', color: '#0891b2' },
              { label: 'Book Appointment',   path: '/patient/appointments',  color: '#7c3aed' },
            ].map(a => (
              <Link key={a.label} to={a.path} style={{ ...s.quickBtn, borderColor: a.color, color: a.color }}>
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent prescriptions */}
      {profile?.prescriptions?.length > 0 && (
        <div style={{ ...s.card, marginTop: 20 }}>
          <div style={s.cardHead}>
            <span style={s.cardTitle}>Recent Prescriptions</span>
            <Link to="/patient/prescriptions" style={s.editLink}>View all →</Link>
          </div>
          {profile.prescriptions.slice(-2).reverse().map((p, i) => (
            <div key={i} style={s.prescRow}>
              <div style={s.prescIcon}>💊</div>
              <div>
                <div style={s.prescDoctor}>Dr. {p.doctorName}</div>
                <div style={s.prescDate}>{new Date(p.issuedAt).toLocaleDateString()}</div>
              </div>
              <div style={s.prescCount}>{p.medicines?.length} medicine(s)</div>
            </div>
          ))}
        </div>
      )}

    </PatientLayout>
  );
}

const s = {
  statsRow:       { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 },
  statCard:       { background: '#fff', borderRadius: 14, padding: 22, display: 'flex', flexDirection: 'column', gap: 6, border: '1px solid #e4ecf7', transition: 'box-shadow 0.2s', cursor: 'pointer' },
  statIcon:       { width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 4 },
  statNum:        { fontSize: 30, fontWeight: 800, color: '#0b1f3a', letterSpacing: '-1px' },
  statLabel:      { fontSize: 13, color: '#7a92aa', fontWeight: 500 },
  grid:           { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  card:           { background: '#fff', borderRadius: 14, padding: 22, border: '1px solid #e4ecf7' },
  cardHead:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardHead2:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 12px', borderTop: '1px solid #f0f4f9', paddingTop: 20 },
  cardTitle:      { fontSize: 14, fontWeight: 700, color: '#0b1f3a' },
  editLink:       { fontSize: 12, color: '#1a56db', textDecoration: 'none', fontWeight: 600 },
  infoList:       { display: 'flex', flexDirection: 'column', gap: 10 },
  infoRow:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  infoKey:        { fontSize: 12, color: '#7a92aa', fontWeight: 500 },
  infoVal:        { fontSize: 13, color: '#0b1f3a', fontWeight: 500, textAlign: 'right' },
  emergencyBox:   { display: 'flex', alignItems: 'center', gap: 14, padding: '14px', background: '#f8faff', borderRadius: 10 },
  emergencyAvatar:{ width: 44, height: 44, borderRadius: 12, background: '#ebf2ff', color: '#1a56db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 },
  emergencyName:  { fontWeight: 700, fontSize: 14, color: '#0b1f3a' },
  emergencyDetail:{ fontSize: 12, color: '#7a92aa', marginTop: 2 },
  emergencyPhone: { fontSize: 13, color: '#1a56db', fontWeight: 600, marginTop: 2 },
  emptyState:     { textAlign: 'center', padding: '20px 0' },
  emptyText:      { color: '#7a92aa', fontSize: 13, margin: '0 0 8px' },
  emptyLink:      { color: '#1a56db', fontSize: 13, fontWeight: 600 },
  quickActions:   { display: 'flex', flexDirection: 'column', gap: 8 },
  quickBtn:       { display: 'block', textDecoration: 'none', padding: '10px 14px', borderRadius: 8, border: '1.5px solid', fontSize: 13, fontWeight: 600, textAlign: 'center', transition: 'all 0.15s' },
  prescRow:       { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f0f4f9' },
  prescIcon:      { width: 36, height: 36, background: '#e0f7fa', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 },
  prescDoctor:    { fontSize: 13, fontWeight: 600, color: '#0b1f3a' },
  prescDate:      { fontSize: 11, color: '#7a92aa', marginTop: 2 },
  prescCount:     { marginLeft: 'auto', fontSize: 12, color: '#0891b2', fontWeight: 600, background: '#e0f7fa', padding: '3px 10px', borderRadius: 20 },
};

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'DM Sans', sans-serif", color: '#7a92aa', fontSize: 15 }}>
      Loading your dashboard...
    </div>
  );
}