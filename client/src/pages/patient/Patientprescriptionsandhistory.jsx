// client/src/pages/patient/PatientPrescriptions.jsx
import { useEffect, useState } from 'react';
import api from '../../services/api';
import PatientLayout from './Patientlayout ';

export default function PatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selected,      setSelected]      = useState(null);
  const [error,         setError]         = useState('');

  useEffect(() => {
    api.get('/patients/prescriptions')
      .then(r  => setPrescriptions(r.data.prescriptions || []))
      .catch(() => setError('Failed to load prescriptions'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PatientLayout title="Prescriptions" subtitle="Digital prescriptions from your doctors">
      {error && <div style={s.error}>{error}</div>}

      {loading ? (
        <div style={s.msg}>Loading prescriptions...</div>
      ) : prescriptions.length === 0 ? (
        <div style={s.emptyBox}>
          <div style={s.emptyIcon}>💊</div>
          <div style={s.emptyTitle}>No prescriptions yet</div>
          <div style={s.emptySub}>Your prescriptions will appear here after a consultation</div>
        </div>
      ) : (
        <div style={s.layout}>
          {/* List */}
          <div style={s.list}>
            {prescriptions.map((p, i) => (
              <div key={i}
                style={{ ...s.card, ...(selected === i ? s.cardActive : {}) }}
                onClick={() => setSelected(selected === i ? null : i)}
              >
                <div style={s.cardTop}>
                  <div style={s.docAvatar}>{p.doctorName?.charAt(0) || 'D'}</div>
                  <div style={s.cardInfo}>
                    <div style={s.docName}>Dr. {p.doctorName}</div>
                    <div style={s.cardDate}>{new Date(p.createdAt || p.issuedAt).toLocaleDateString()}</div>
                  </div>
                  <div style={s.medCount}>{p.medicines?.length} med{p.medicines?.length !== 1 ? 's' : ''}</div>
                </div>
                {p.instructions && (
                  <div style={s.instruction}>"{p.instructions}"</div>
                )}
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {selected !== null && (
            <div style={s.detail}>
              <div style={s.detailHead}>
                <div style={s.detailAvatar}>{prescriptions[selected].doctorName?.charAt(0)}</div>
                <div>
                  <div style={s.detailDoc}>Dr. {prescriptions[selected].doctorName}</div>
                  <div style={s.detailDate}>{new Date(prescriptions[selected].createdAt || prescriptions[selected].issuedAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div style={s.medsTitle}>Medicines</div>
              {prescriptions[selected].medicines?.map((m, i) => (
                <div key={i} style={s.medRow}>
                  <div style={s.medNum}>{i + 1}</div>
                  <div style={s.medInfo}>
                    <div style={s.medName}>{m.name}</div>
                    <div style={s.medDetail}>
                      {m.dosage && <span style={s.pill}>{m.dosage}</span>}
                      {m.duration && <span style={s.pill}>{m.duration}</span>}
                    </div>
                    {m.notes && <div style={s.medNotes}>{m.notes}</div>}
                  </div>
                </div>
              ))}

              {prescriptions[selected].instructions && (
                <div style={s.instrBox}>
                  <div style={s.instrLabel}>Doctor's Instructions</div>
                  <div style={s.instrText}>{prescriptions[selected].instructions}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </PatientLayout>
  );
}

// ─── PatientHistory ───────────────────────────────────────────
export function PatientHistory() {
  const [timeline, setTimeline] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    api.get('/patients/medical-history')
      .then((r) => {
        setTimeline(r.data.timeline || []);
        setSummary(r.data.summary || null);
      })
      .catch(() => setError('Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  const filteredTimeline = timeline.filter((item) => {
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;

    const itemDate = item.date ? new Date(item.date) : null;
    if (fromDate && itemDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      if (itemDate < from) return false;
    }
    if (toDate && itemDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      if (itemDate > to) return false;
    }

    return true;
  });

  const formatDate = (value) => {
    if (!value) return 'No date';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'No date';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const itemAccent = (type) => {
    if (type === 'prescription') return '#16a34a';
    if (type === 'appointment') return '#1a56db';
    if (type === 'report') return '#9a3412';
    return '#0f766e';
  };

  return (
    <PatientLayout title="Medical History" subtitle="Your past consultations and diagnoses">
      {error && <div style={hs.error}>{error}</div>}

      {!loading && !error && (
        <>
          <div style={hs.filters}>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={hs.select}>
              <option value="all">All types</option>
              <option value="history">Consultation Notes</option>
              <option value="appointment">Appointments</option>
              <option value="prescription">Prescriptions</option>
              <option value="report">Reports</option>
            </select>

            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={hs.dateInput}
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={hs.dateInput}
            />
            <button
              style={hs.clearBtn}
              onClick={() => {
                setTypeFilter('all');
                setFromDate('');
                setToDate('');
              }}
            >
              Clear
            </button>
          </div>

          {summary && (
            <div style={hs.summaryGrid}>
              <div style={hs.summaryCard}><span style={hs.summaryLabel}>Total</span><strong>{summary.totalEntries || 0}</strong></div>
              <div style={hs.summaryCard}><span style={hs.summaryLabel}>Appointments</span><strong>{summary.appointments || 0}</strong></div>
              <div style={hs.summaryCard}><span style={hs.summaryLabel}>Prescriptions</span><strong>{summary.prescriptions || 0}</strong></div>
              <div style={hs.summaryCard}><span style={hs.summaryLabel}>Reports</span><strong>{summary.reports || 0}</strong></div>
            </div>
          )}
        </>
      )}

      {loading ? (
        <div style={hs.msg}>Loading history...</div>
      ) : filteredTimeline.length === 0 ? (
        <div style={hs.emptyBox}>
          <div style={hs.emptyIcon}>🕐</div>
          <div style={hs.emptyTitle}>No consultation history</div>
          <div style={hs.emptySub}>No entries found for current filters</div>
        </div>
      ) : (
        <div style={hs.timeline}>
          {filteredTimeline.map((h, i) => (
            <div key={i} style={hs.item}>
              {/* Timeline dot */}
              <div style={hs.dotCol}>
                <div style={{ ...hs.dot, background: itemAccent(h.type) }} />
                {i < filteredTimeline.length - 1 && <div style={hs.line} />}
              </div>

              {/* Content */}
              <div style={hs.content}>
                <div style={hs.contentHead}>
                  <div>
                    <div style={hs.doctorName}>{h.doctorName ? `Dr. ${h.doctorName}` : 'Healthcare Record'}</div>
                    <div style={hs.specialty}>{h.specialty || (h.type || 'entry').toUpperCase()}</div>
                  </div>
                  <div style={hs.dateTag}>
                    {formatDate(h.date)}
                  </div>
                </div>

                <div style={hs.title}>{h.title || 'Medical update'}</div>

                {h.details?.diagnosis && (
                  <div style={hs.diagBox}>
                    <span style={hs.diagLabel}>Diagnosis</span>
                    <span style={hs.diagText}>{h.details.diagnosis}</span>
                  </div>
                )}

                {h.details?.notes && (
                  <div style={hs.notesBox}>
                    <span style={hs.notesLabel}>Notes</span>
                    <p style={hs.notesText}>{h.details.notes}</p>
                  </div>
                )}

                {h.type === 'prescription' && Array.isArray(h.details?.medicines) && h.details.medicines.length > 0 && (
                  <div style={hs.medicineRow}>
                    {h.details.medicines.slice(0, 3).map((m, idx) => (
                      <span key={idx} style={hs.medicinePill}>{m.name}</span>
                    ))}
                    {h.details.medicines.length > 3 && (
                      <span style={hs.morePill}>+{h.details.medicines.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PatientLayout>
  );
}

/* ── Prescription styles ──────────────────────────────── */
const s = {
  error:        { background: '#fff0f0', color: '#cc0000', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13 },
  msg:          { color: '#7a92aa', fontSize: 14, padding: '20px 0' },
  emptyBox:     { textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 14, border: '1px solid #e4ecf7' },
  emptyIcon:    { fontSize: 48, marginBottom: 16 },
  emptyTitle:   { fontSize: 16, fontWeight: 700, color: '#0b1f3a', marginBottom: 8 },
  emptySub:     { fontSize: 14, color: '#7a92aa' },
  layout:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' },
  list:         { display: 'flex', flexDirection: 'column', gap: 10 },
  card:         { background: '#fff', border: '1.5px solid #e4ecf7', borderRadius: 14, padding: 16, cursor: 'pointer', transition: 'all 0.15s' },
  cardActive:   { border: '1.5px solid #1a56db', boxShadow: '0 0 0 3px rgba(26,86,219,0.08)' },
  cardTop:      { display: 'flex', alignItems: 'center', gap: 12 },
  docAvatar:    { width: 38, height: 38, borderRadius: 10, background: '#ebf2ff', color: '#1a56db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 },
  cardInfo:     { flex: 1 },
  docName:      { fontSize: 14, fontWeight: 700, color: '#0b1f3a' },
  cardDate:     { fontSize: 12, color: '#7a92aa', marginTop: 2 },
  medCount:     { fontSize: 12, color: '#0891b2', fontWeight: 700, background: '#e0f7fa', padding: '3px 10px', borderRadius: 20 },
  instruction:  { fontSize: 12, color: '#7a92aa', fontStyle: 'italic', marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0f4f9' },
  detail:       { background: '#fff', border: '1px solid #e4ecf7', borderRadius: 14, padding: 24, position: 'sticky', top: 20 },
  detailHead:   { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f0f4f9' },
  detailAvatar: { width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#1a56db,#2DD4BF)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 },
  detailDoc:    { fontSize: 16, fontWeight: 700, color: '#0b1f3a' },
  detailDate:   { fontSize: 12, color: '#7a92aa', marginTop: 3 },
  medsTitle:    { fontSize: 12, fontWeight: 700, color: '#7a92aa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  medRow:       { display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #f0f4f9', alignItems: 'flex-start' },
  medNum:       { width: 24, height: 24, borderRadius: 8, background: '#ebf2ff', color: '#1a56db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 },
  medInfo:      { flex: 1 },
  medName:      { fontSize: 14, fontWeight: 700, color: '#0b1f3a', marginBottom: 4 },
  medDetail:    { display: 'flex', gap: 6, flexWrap: 'wrap' },
  pill:         { fontSize: 11, background: '#f0f4f9', color: '#4a6080', padding: '2px 8px', borderRadius: 20, fontWeight: 600 },
  medNotes:     { fontSize: 12, color: '#7a92aa', marginTop: 4, fontStyle: 'italic' },
  instrBox:     { background: '#f8faff', borderRadius: 10, padding: 14, marginTop: 16 },
  instrLabel:   { fontSize: 11, fontWeight: 700, color: '#7a92aa', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 },
  instrText:    { fontSize: 13, color: '#0b1f3a', lineHeight: 1.6 },
};

/* ── History styles ──────────────────────────────────── */
const hs = {
  error:      { background: '#fff0f0', color: '#cc0000', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13 },
  msg:        { color: '#7a92aa', fontSize: 14, padding: '20px 0' },
  filters:    { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 },
  select:     { height: 38, borderRadius: 10, border: '1px solid #d9e4f2', padding: '0 10px', fontSize: 13, color: '#0b1f3a', background: '#fff' },
  dateInput:  { height: 38, borderRadius: 10, border: '1px solid #d9e4f2', padding: '0 10px', fontSize: 13, color: '#0b1f3a', background: '#fff' },
  clearBtn:   { height: 38, borderRadius: 10, border: '1px solid #d9e4f2', padding: '0 12px', fontSize: 13, color: '#4a6080', background: '#fff', cursor: 'pointer', fontWeight: 600 },
  summaryGrid:{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 18 },
  summaryCard:{ background: '#fff', border: '1px solid #e4ecf7', borderRadius: 12, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#0b1f3a' },
  summaryLabel:{ fontSize: 12, color: '#7a92aa', fontWeight: 600 },
  emptyBox:   { textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 14, border: '1px solid #e4ecf7' },
  emptyIcon:  { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: 700, color: '#0b1f3a', marginBottom: 8 },
  emptySub:   { fontSize: 14, color: '#7a92aa' },
  timeline:   { display: 'flex', flexDirection: 'column', gap: 0 },
  item:       { display: 'flex', gap: 16 },
  dotCol:     { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 },
  dot:        { width: 14, height: 14, borderRadius: '50%', background: '#1a56db', border: '3px solid #e8f0fe', flexShrink: 0, marginTop: 4 },
  line:       { width: 2, flex: 1, background: '#e4ecf7', margin: '4px 0' },
  content:    { flex: 1, background: '#fff', border: '1px solid #e4ecf7', borderRadius: 14, padding: 20, marginBottom: 16 },
  contentHead:{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  title:      { fontSize: 14, fontWeight: 700, color: '#0b1f3a', marginBottom: 10 },
  doctorName: { fontSize: 15, fontWeight: 700, color: '#0b1f3a' },
  specialty:  { fontSize: 12, color: '#1a56db', fontWeight: 600, marginTop: 3 },
  dateTag:    { fontSize: 12, color: '#7a92aa', background: '#f0f4f9', padding: '4px 10px', borderRadius: 20, fontWeight: 500, whiteSpace: 'nowrap' },
  diagBox:    { background: '#f0fdf4', borderRadius: 8, padding: '10px 14px', marginBottom: 10, display: 'flex', gap: 10, alignItems: 'flex-start' },
  diagLabel:  { fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap', marginTop: 1 },
  diagText:   { fontSize: 13, color: '#0b1f3a', fontWeight: 500 },
  notesBox:   { background: '#f8faff', borderRadius: 8, padding: '10px 14px' },
  notesLabel: { fontSize: 11, fontWeight: 700, color: '#7a92aa', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 },
  notesText:  { fontSize: 13, color: '#4a6080', lineHeight: 1.6, margin: 0 },
  medicineRow:{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 },
  medicinePill:{ fontSize: 11, background: '#e8f7ef', color: '#166534', padding: '4px 8px', borderRadius: 20, fontWeight: 600 },
  morePill:   { fontSize: 11, background: '#f0f4f9', color: '#4a6080', padding: '4px 8px', borderRadius: 20, fontWeight: 600 },
};