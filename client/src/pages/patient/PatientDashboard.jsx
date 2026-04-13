import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getPatientMedicalHistory, getPatientReports } from '../../services/patientApi';
import PatientLayout from './Patientlayout ';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [reportsCount, setReportsCount] = useState(0);
  const [prescriptionsCount, setPrescriptionsCount] = useState(0);
  const [consultationCount, setConsultationCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCompact, setIsCompact] = useState(window.innerWidth < 980);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleResize = () => setIsCompact(window.innerWidth < 980);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        const [profileRes, reportsRes, prescriptionsRes, historyRes] = await Promise.allSettled([
          api.get('/patients/profile'),
          getPatientReports({ page: 1, limit: 1, status: 'active' }),
          api.get('/patients/prescriptions'),
          getPatientMedicalHistory()
        ]);

        if (!mounted) return;

        if (profileRes.status !== 'fulfilled') {
          navigate('/patient/setup');
          return;
        }

        setProfile(profileRes.value.data || null);

        if (reportsRes.status === 'fulfilled') {
          setReportsCount(reportsRes.value?.totalReports || reportsRes.value?.reports?.length || 0);
        }

        if (prescriptionsRes.status === 'fulfilled') {
          const prescriptions = prescriptionsRes.value?.data?.prescriptions || [];
          setPrescriptionsCount(prescriptions.length);
        }

        if (historyRes.status === 'fulfilled') {
          const summary = historyRes.value?.summary || {};
          const timeline = historyRes.value?.timeline || [];
          setConsultationCount(summary.appointments || summary.totalEntries || timeline.length || 0);
        }
      } catch {
        if (mounted) setError('Failed to load dashboard data.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (loading) return <LoadingScreen />;

  const firstName = profile?.name?.split(' ')[0] || 'Patient';
  const stats = [
    { label: 'Medical Reports', value: reportsCount, note: 'Update 2d ago', link: '/patient/reports', icon: 'RP' },
    { label: 'Prescriptions', value: prescriptionsCount, note: 'Active', link: '/patient/prescriptions', icon: 'RX' },
    { label: 'Consultations', value: consultationCount, note: 'Last: Oct 12', link: '/patient/history', icon: 'CS' }
  ];

  const quickActions = [
    { label: 'Upload Report', path: '/patient/reports' },
    { label: 'View Prescriptions', path: '/patient/prescriptions' },
    { label: 'Book Appointment', path: '/patient/appointments' }
  ];

  const filteredActions = quickActions.filter((action) =>
    action.label.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const handleSearchSubmit = () => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return;

    if (term.includes('appoint')) navigate('/patient/appointments');
    else if (term.includes('report') || term.includes('record')) navigate('/patient/reports');
    else if (term.includes('prescription') || term.includes('message') || term.includes('medicine')) navigate('/patient/prescriptions');
    else if (term.includes('history') || term.includes('consult')) navigate('/patient/history');
    else if (term.includes('profile')) navigate('/patient/profile');
  };

  const dobText = profile?.dateOfBirth
    ? `${new Date(profile.dateOfBirth).toLocaleDateString()} (${getAge(profile.dateOfBirth)} yrs)`
    : 'Not added';

  return (
    <PatientLayout
      title={`Good day, ${firstName}`}
      subtitle="Welcome back to your Nexus Health. Here is your wellness summary."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onSearchSubmit={handleSearchSubmit}
    >
      <style>{dashboardCss}</style>

      {error && <div style={s.error}>{error}</div>}

      <div style={{ ...s.statsRow, ...(isCompact ? s.statsRowCompact : {}) }} className="patient-dashboard-stats">
        {stats.map((st) => (
          <Link to={st.link} key={st.label} style={s.statCard} className="patient-stat-card">
            <div style={s.statTop}>
              <div style={s.statIcon}>{st.icon}</div>
              <div style={s.statNote}>{st.note}</div>
            </div>
            <div style={s.statValue}>{st.value}</div>
            <div style={s.statLabel}>{st.label}</div>
            <div style={s.statMeta}>
              {st.value}{' '}
              {st.label === 'Consultations'
                ? 'Lifetime Visits'
                : st.label === 'Prescriptions'
                  ? 'Current Cycles'
                  : 'Total Documents'}
            </div>
          </Link>
        ))}
      </div>

      <div style={{ ...s.grid, ...(isCompact ? s.gridCompact : {}) }} className="patient-dashboard-grid">
        <section style={s.profileCard} className="patient-dashboard-profile-card">
          <div style={{ ...s.profileTop, ...(isCompact ? s.profileTopCompact : {}) }}>
            <div style={s.avatarCard}>{(profile?.name || 'P').charAt(0).toUpperCase()}</div>
            <div style={s.profileHead}>
              <h3 style={{ ...s.profileName, ...(isCompact ? s.profileNameCompact : {}) }}>{profile?.name || 'Patient Name'}</h3>
              <div style={s.profileLocation}>Mumbai, India</div>
              <div style={s.tagRow}>
                <span style={s.idTag}>PATIENT ID: {profile?._id?.slice(-6)?.toUpperCase() || 'N/A'}</span>
                <span style={s.allergyTag}>ALLERGY: PENICILLIN</span>
              </div>
            </div>
            <Link to="/patient/profile" style={s.editChip}>Edit</Link>
          </div>

          <div style={{ ...s.infoGrid, ...(isCompact ? s.infoGridCompact : {}) }}>
            <InfoItem label="Email Address" value={profile?.email || 'Not added'} />
            <InfoItem label="Phone Number" value={profile?.phone || 'Not added'} />
            <InfoItem label="Blood Group" value={profile?.bloodGroup || 'Not added'} />
            <InfoItem label="Date Of Birth" value={dobText} />
          </div>
        </section>

        <aside>
          <div style={s.quickCard} className="patient-dashboard-quick-card">
            <h4 style={s.quickTitle}>QUICK ACTIONS</h4>
            <div style={s.quickList}>
              {filteredActions.map((action) => (
                <Link key={action.label} to={action.path} style={s.quickItem} className="patient-quick-item">
                  <span style={s.quickDot}>o</span>
                  <span>{action.label}</span>
                  <span style={s.arrow}>&gt;</span>
                </Link>
              ))}
              {filteredActions.length === 0 && <div style={s.emptyQuick}>No quick actions match this search.</div>}
            </div>
          </div>

          <div style={s.emergencyCard}>
            <div style={s.emergencyIcon}>EC</div>
            <div style={s.emergencyTitle}>Emergency Contact</div>
            {profile?.emergencyContact?.name ? (
              <>
                <div style={s.emergencyName}>{profile.emergencyContact.name}</div>
                <div style={s.emergencySub}>{profile.emergencyContact.relationship || 'Primary contact'}</div>
                <div style={s.emergencyPhone}>{profile.emergencyContact.phone || 'No number'}</div>
              </>
            ) : (
              <>
                <div style={s.emergencySub}>No emergency contacts listed. Adding one can help in urgent situations.</div>
                <Link to="/patient/profile" style={s.addContactLink}>ADD CONTACT</Link>
              </>
            )}
          </div>
        </aside>
      </div>

      <section id="resources" style={s.banner} className="patient-dashboard-banner">
        <div style={{ ...s.bannerOverlay, ...(isCompact ? s.bannerOverlayCompact : {}) }} className="patient-dashboard-banner-overlay">
          <div style={{ ...s.bannerTitle, ...(isCompact ? s.bannerTitleCompact : {}) }} className="patient-dashboard-banner-title">Wellness is a journey, not a destination.</div>
          <p style={s.bannerSub}>Explore our curated resources for holistic mental and physical health.</p>
          <Link to="/patient/history" style={s.bannerBtn} className="patient-banner-btn">VIEW RESOURCES</Link>
        </div>
      </section>
    </PatientLayout>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div style={s.infoLabel}>{label}</div>
      <div style={s.infoValue}>{value}</div>
    </div>
  );
}

function getAge(dateValue) {
  const dob = new Date(dateValue);
  if (Number.isNaN(dob.getTime())) return '-';

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age;
}

const s = {
  error: { background: '#fff1f1', color: '#b73f3f', border: '1px solid #eec9c9', borderRadius: 11, padding: '10px 12px', marginBottom: 12, fontSize: 13 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, marginBottom: 18 },
  statsRowCompact: { gridTemplateColumns: '1fr' },
  statCard: { textDecoration: 'none', background: 'linear-gradient(180deg, #ffffff 0%, #f2f8ff 100%)', border: '1px solid #d7e5f3', borderRadius: 14, padding: 16, color: '#2a4458', boxShadow: '0 10px 26px rgba(3, 40, 88, 0.08)' },
  statTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  statIcon: { width: 40, height: 40, borderRadius: 10, background: '#ebf3fc', border: '1px solid #d0dff0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e4f75' },
  statNote: { fontSize: 10, color: '#567997', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 },
  statValue: { fontSize: 44, lineHeight: 1, marginBottom: 8, fontFamily: "'Sora', sans-serif", fontWeight: 500, color: '#0f3150' },
  statLabel: { fontSize: 14, marginBottom: 3, color: '#2b5474', fontWeight: 700, letterSpacing: 0.2 },
  statMeta: { fontSize: 13, color: '#5f7383' },
  grid: { display: 'grid', gridTemplateColumns: '2fr 1.35fr', gap: 18, alignItems: 'start' },
  gridCompact: { gridTemplateColumns: '1fr' },
  profileCard: { background: 'linear-gradient(180deg, #ffffff 0%, #f6faff 100%)', border: '1px solid #d7e5f3', borderRadius: 14, padding: 18, boxShadow: '0 10px 26px rgba(3, 40, 88, 0.06)' },
  profileTop: { display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: 14, alignItems: 'center', marginBottom: 20 },
  profileTopCompact: { gridTemplateColumns: '1fr', justifyItems: 'start' },
  avatarCard: { width: 90, height: 90, borderRadius: 12, background: 'linear-gradient(145deg, #001836, #0e4b83)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eef7ff', fontSize: 36, fontWeight: 700, boxShadow: '0 10px 24px rgba(2, 46, 92, 0.28)' },
  profileHead: { minWidth: 0 },
  profileName: { margin: 0, fontSize: 42, lineHeight: 1.05, color: '#123855', fontFamily: "'Sora', sans-serif", fontWeight: 500 },
  profileNameCompact: { fontSize: 30 },
  profileLocation: { marginTop: 8, color: '#627f95', fontSize: 14 },
  tagRow: { marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' },
  idTag: { padding: '3px 8px', borderRadius: 999, fontSize: 10, color: '#245172', background: '#e6f1fb', fontWeight: 700, letterSpacing: 0.5, border: '1px solid #c8def2' },
  allergyTag: { padding: '3px 8px', borderRadius: 999, fontSize: 10, color: '#9f4141', background: '#fbe4e4', fontWeight: 700, letterSpacing: 0.5, border: '1px solid #f2c9c9' },
  editChip: { border: '1px solid #cfe0f1', borderRadius: 8, padding: '8px 12px', textDecoration: 'none', color: '#2f5778', background: '#f3f8ff', fontSize: 12, fontWeight: 700 },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px 24px' },
  infoGridCompact: { gridTemplateColumns: '1fr' },
  infoLabel: { fontSize: 10, letterSpacing: 1.2, color: '#7390a7', textTransform: 'uppercase', marginBottom: 5, fontWeight: 700 },
  infoValue: { fontSize: 25, lineHeight: 1.2, color: '#163e5d', fontFamily: "'Sora', sans-serif", fontWeight: 400 },
  quickCard: { background: 'linear-gradient(180deg, #ffffff 0%, #f6faff 100%)', border: '1px solid #d7e5f3', borderRadius: 14, padding: 14, boxShadow: '0 10px 26px rgba(3, 40, 88, 0.06)' },
  quickTitle: { margin: '0 0 10px', fontSize: 11, color: '#597792', letterSpacing: 1.2 },
  quickList: { display: 'flex', flexDirection: 'column', gap: 8 },
  quickItem: { textDecoration: 'none', padding: '10px 12px', borderRadius: 9, border: '1px solid #d3e2f1', background: '#f8fbff', color: '#224e70', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 },
  quickDot: { color: '#3a6688' },
  arrow: { marginLeft: 'auto', color: '#5f7d96' },
  emptyQuick: { borderRadius: 7, border: '1px dashed #ccdced', color: '#6f88a0', fontSize: 12, padding: '10px 12px', background: '#f5f9fd' },
  emergencyCard: { marginTop: 16, background: 'linear-gradient(180deg, #ffffff 0%, #f6faff 100%)', border: '1px dashed #c8daec', borderRadius: 14, padding: '24px 16px', textAlign: 'center', boxShadow: '0 10px 26px rgba(3, 40, 88, 0.06)' },
  emergencyIcon: { width: 44, height: 44, margin: '0 auto', borderRadius: 12, background: '#e8f2fc', color: '#376286', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  emergencyTitle: { marginTop: 14, color: '#34556b', fontWeight: 700, fontSize: 15 },
  emergencyName: { marginTop: 8, color: '#2b4a5f', fontWeight: 700, fontSize: 14 },
  emergencySub: { marginTop: 6, color: '#628297', fontSize: 12, lineHeight: 1.45 },
  emergencyPhone: { marginTop: 6, color: '#34556b', fontWeight: 700, fontSize: 13 },
  addContactLink: { marginTop: 12, display: 'inline-block', color: '#245373', fontSize: 12, fontWeight: 700, letterSpacing: 0.7, textDecoration: 'none' },
  banner: { marginTop: 16, position: 'relative', borderRadius: 12, overflow: 'hidden', minHeight: 210, border: '1px solid #c2d5e8', background: 'linear-gradient(120deg, #001836 0%, #003566 52%, #0e7490 100%)', boxShadow: '0 16px 36px rgba(3, 32, 66, 0.22)' },
  bannerImage: { width: '100%', height: '100%', minHeight: 210, objectFit: 'cover', display: 'block' },
  bannerOverlay: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at 85% 10%, rgba(125, 211, 252, 0.3), transparent 36%), linear-gradient(90deg, rgba(6, 23, 43, 0.9) 0%, rgba(6, 23, 43, 0.56) 48%, rgba(6, 23, 43, 0.08) 100%)', color: '#f3f6fb', padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '62%' },
  bannerOverlayCompact: { maxWidth: '100%', background: 'linear-gradient(180deg, rgba(6, 23, 43, 0.74) 0%, rgba(6, 23, 43, 0.72) 100%)' },
  bannerTitle: { fontSize: 42, lineHeight: 1.05, fontFamily: "'Sora', sans-serif", marginBottom: 10 },
  bannerTitleCompact: { fontSize: 30 },
  bannerSub: { margin: 0, color: '#d8e8f7', fontSize: 13 },
  bannerBtn: { marginTop: 20, alignSelf: 'flex-start', padding: '9px 14px', border: '1px solid #a8c4e1', color: '#edf5ff', textDecoration: 'none', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.8, background: 'rgba(13, 37, 61, 0.35)' }
};

const dashboardCss = `
.patient-stat-card,
.patient-quick-item,
.patient-banner-btn {
  transition: transform 0.16s ease, box-shadow 0.2s ease, border-color 0.18s ease, background-color 0.18s ease;
}
.patient-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 34px rgba(3, 40, 88, 0.16);
  border-color: #b9d2ea;
}
.patient-quick-item:hover {
  transform: translateX(2px);
  border-color: #bfd6ec;
  background: #f2f8ff;
}
.patient-banner-btn:hover {
  transform: translateY(-1px);
  background: rgba(13, 37, 61, 0.52);
  border-color: #bdd3e8;
}
@media (prefers-reduced-motion: reduce) {
  .patient-stat-card,
  .patient-quick-item,
  .patient-banner-btn {
    transition: none !important;
  }
}
@media (max-width: 900px) {
  .patient-dashboard-stats {
    gap: 12px !important;
  }
  .patient-dashboard-grid {
    gap: 14px !important;
  }
}
@media (max-width: 760px) {
  .patient-dashboard-profile-card {
    padding: 14px !important;
  }
  .patient-dashboard-quick-card {
    padding: 12px !important;
  }
  .patient-dashboard-banner {
    min-height: 180px !important;
  }
  .patient-dashboard-banner-overlay {
    padding: 18px !important;
  }
  .patient-dashboard-banner-title {
    font-size: 24px !important;
    line-height: 1.1 !important;
    margin-bottom: 8px !important;
  }
}
`;

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'Manrope', sans-serif", color: '#607586', fontSize: 15 }}>
      Loading your dashboard...
    </div>
  );
}
