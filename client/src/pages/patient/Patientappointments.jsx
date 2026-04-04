// client/src/pages/patient/PatientAppointments.jsx
import { useEffect, useState } from 'react';
import api from '../../services/api';
import PatientLayout from './Patientlayout ';

const STATUS_STYLES = {
  pending:   { bg: '#fff7ed', color: '#c05621', label: 'Pending' },
  accepted:  { bg: '#f0fdf4', color: '#16a34a', label: 'Confirmed' },
  completed: { bg: '#f0f7ff', color: '#1a56db', label: 'Completed' },
  cancelled: { bg: '#fff5f5', color: '#e53e3e', label: 'Cancelled' },
};

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('all');
  const [error,        setError]        = useState('');

  useEffect(() => {
    // This will call appointment service once Member 3 builds it
    // For now shows empty state
    api.get('/appointments/patient')
      .then(r  => setAppointments(r.data || []))
      .catch(() => {
        // Appointment service may not be running yet — show empty state
        setAppointments([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments(a => a.filter(ap => ap._id !== id));
    } catch {
      setError('Failed to cancel appointment');
    }
  };

  const filtered = filter === 'all'
    ? appointments
    : appointments.filter(a => a.status === filter);

  return (
    <PatientLayout title="My Appointments" subtitle="Track and manage your bookings">

      {error && <div style={s.error}>{error}</div>}

      {/* Filter tabs */}
      <div style={s.tabs}>
        {['all', 'pending', 'accepted', 'completed', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ ...s.tab, ...(filter === f ? s.tabActive : {}) }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={s.msg}>Loading appointments...</div>
      ) : filtered.length === 0 ? (
        <div style={s.emptyBox}>
          <div style={s.emptyIcon}>📅</div>
          <div style={s.emptyTitle}>
            {filter === 'all' ? 'No appointments yet' : `No ${filter} appointments`}
          </div>
          <div style={s.emptySub}>
            {filter === 'all'
              ? 'Book your first appointment with a doctor'
              : `You have no ${filter} appointments`}
          </div>
        </div>
      ) : (
        <div style={s.list}>
          {filtered.map(ap => {
            const st = STATUS_STYLES[ap.status] || STATUS_STYLES.pending;
            return (
              <div key={ap._id} style={s.card}>
                <div style={s.cardLeft}>
                  <div style={s.docAvatar}>{ap.doctorName?.charAt(0) || 'D'}</div>
                  <div style={s.cardInfo}>
                    <div style={s.docName}>Dr. {ap.doctorName}</div>
                    <div style={s.specialty}>{ap.specialty}</div>
                    <div style={s.dateTime}>
                      📅 {ap.date ? new Date(ap.date).toLocaleDateString() : '—'}
                      &nbsp;&nbsp;
                      🕐 {ap.timeSlot || '—'}
                    </div>
                    {ap.reason && <div style={s.reason}>"{ap.reason}"</div>}
                  </div>
                </div>

                <div style={s.cardRight}>
                  <span style={{ ...s.statusBadge, background: st.bg, color: st.color }}>
                    {st.label}
                  </span>

                  <div style={s.actions}>
                    {/* Video join button — only if accepted and backend generated a room link */}
                    {ap.status === 'accepted' && ap.videoRoomLink && (
                      <a href={ap.videoRoomLink} target="_blank" rel="noreferrer" style={s.joinBtn}>
                        Join Video →
                      </a>
                    )}
                    {/* Cancel button — only for pending/accepted */}
                    {(ap.status === 'pending' || ap.status === 'accepted') && (
                      <button onClick={() => handleCancel(ap._id)} style={s.cancelBtn}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PatientLayout>
  );
}

const s = {
  error:       { background: '#fff0f0', color: '#cc0000', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13 },
  tabs:        { display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' },
  tab:         { padding: '8px 16px', borderRadius: 20, border: '1px solid #e4ecf7', background: '#fff', color: '#7a92aa', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' },
  tabActive:   { background: '#1a56db', color: '#fff', border: '1px solid #1a56db', fontWeight: 600 },
  msg:         { color: '#7a92aa', fontSize: 14, padding: '20px 0' },
  emptyBox:    { textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 14, border: '1px solid #e4ecf7' },
  emptyIcon:   { fontSize: 48, marginBottom: 16 },
  emptyTitle:  { fontSize: 16, fontWeight: 700, color: '#0b1f3a', marginBottom: 8 },
  emptySub:    { fontSize: 14, color: '#7a92aa' },
  list:        { display: 'flex', flexDirection: 'column', gap: 12 },
  card:        { background: '#fff', border: '1px solid #e4ecf7', borderRadius: 14, padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  cardLeft:    { display: 'flex', gap: 14, flex: 1 },
  docAvatar:   { width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg,#ebf2ff,#e0f7fa)', color: '#1a56db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 },
  cardInfo:    { flex: 1 },
  docName:     { fontSize: 15, fontWeight: 700, color: '#0b1f3a', marginBottom: 2 },
  specialty:   { fontSize: 12, color: '#1a56db', fontWeight: 600, marginBottom: 6 },
  dateTime:    { fontSize: 13, color: '#4a6080', marginBottom: 4 },
  reason:      { fontSize: 12, color: '#7a92aa', fontStyle: 'italic' },
  cardRight:   { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, flexShrink: 0 },
  statusBadge: { fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20 },
  actions:     { display: 'flex', gap: 8 },
  joinBtn:     { padding: '7px 14px', background: '#f0fdf4', color: '#16a34a', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 600, border: '1px solid #bbf7d0' },
  cancelBtn:   { padding: '7px 14px', background: '#fff5f5', color: '#e53e3e', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
};