// client/src/pages/patient/PatientPrescriptions.jsx
import { useEffect, useState } from 'react';
import api from '../../services/api';
import PatientLayout from './Patientlayout ';

const getStoredUser = () => {
  try {
    const raw = sessionStorage.getItem('user') || localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const parseHistoryResponse = (payload) => {
  const root = payload?.data && (payload.data.timeline || payload.data.history)
    ? payload.data
    : payload || {};

  const timeline = Array.isArray(root.timeline)
    ? root.timeline
    : Array.isArray(root.history)
      ? root.history
      : [];

  return {
    timeline,
    summary: root.summary || null
  };
};

const dedupeTimeline = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const details = item?.details || item?.data || {};
    const key = [
      item?.type || 'history',
      item?.date || details?.date || '',
      item?.title || '',
      item?.doctorName || details?.doctorName || details?.doctor || '',
    ].join('|');

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const buildFallbackTimeline = async () => {
  const user = getStoredUser();
  const patientUserId = String(user?.id ?? user?._id ?? user?.userId ?? '').trim();

  const [rxResult, apptResult] = await Promise.allSettled([
    api.get('/patients/prescriptions'),
    patientUserId
      ? api.get(`/appointments/patient/${encodeURIComponent(patientUserId)}`)
      : Promise.resolve({ data: { appointments: [] } })
  ]);

  const prescriptions = rxResult.status === 'fulfilled'
    ? (rxResult.value?.data?.prescriptions || [])
    : [];

  const appointments = apptResult.status === 'fulfilled'
    ? (apptResult.value?.data?.appointments || [])
    : [];

  const prescriptionTimeline = prescriptions.map((p) => ({
    type: 'prescription',
    date: p.issuedAt || p.createdAt || p.date || null,
    title: p.doctorName ? `Prescription by ${p.doctorName}` : 'Prescription',
    doctorName: p.doctorName || '',
    specialty: p.specialty || '',
    data: {
      medicines: p.medicines || [],
      instructions: p.instructions || '',
      diagnosis: p.diagnosis || ''
    }
  }));

  const appointmentTimeline = appointments.map((a) => ({
    type: 'appointment',
    date: a.date || a.createdAt || a.updatedAt || null,
    title: a.doctorName ? `Appointment with ${a.doctorName}` : 'Appointment',
    doctorName: a.doctorName || '',
    specialty: a.specialization || a.specialty || '',
    data: {
      diagnosis: a.diagnosis || '',
      notes: a.notes || a.reason || a.description || '',
    }
  }));

  return dedupeTimeline([...prescriptionTimeline, ...appointmentTimeline]);
};

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

  const selectedPrescription = selected !== null ? prescriptions[selected] : null;
  const totalMedicines = prescriptions.reduce((sum, p) => sum + (p.medicines?.length || 0), 0);
  const latestDate = prescriptions.length > 0
    ? prescriptions
      .map((p) => new Date(p.createdAt || p.issuedAt || 0).getTime())
      .filter((t) => !Number.isNaN(t) && t > 0)
      .sort((a, b) => b - a)[0]
    : null;

  return (
    <PatientLayout title="Prescriptions" subtitle="Digital prescriptions from your doctors">
      <style>{prescriptionCss}</style>

      {error && <div style={s.error}>{error}</div>}

      {!loading && prescriptions.length > 0 && (
        <section style={s.hero}>
          <div style={s.heroTitle}>Medication Overview</div>
          <div style={s.heroGrid} className="patient-prescription-hero-grid">
            <div style={s.heroStatCard}>
              <div style={s.heroStatLabel}>Total Prescriptions</div>
              <div style={s.heroStatValue}>{prescriptions.length}</div>
            </div>
            <div style={s.heroStatCard}>
              <div style={s.heroStatLabel}>Total Medicines</div>
              <div style={s.heroStatValue}>{totalMedicines}</div>
            </div>
            <div style={s.heroStatCard}>
              <div style={s.heroStatLabel}>Last Updated</div>
              <div style={s.heroStatValueSm}>{latestDate ? new Date(latestDate).toLocaleDateString() : '—'}</div>
            </div>
          </div>
        </section>
      )}

      {loading ? (
        <div style={s.msg}>Loading prescriptions...</div>
      ) : prescriptions.length === 0 ? (
        <div style={s.emptyBox}>
          <div style={s.emptyIcon}>💊</div>
          <div style={s.emptyTitle}>No prescriptions yet</div>
          <div style={s.emptySub}>Your prescriptions will appear here after a consultation</div>
        </div>
      ) : (
        <div style={s.layout} className="patient-prescription-layout">
          {/* List */}
          <div style={s.list}>
            {prescriptions.map((p, i) => (
              <div key={i}
                className="patient-prescription-card"
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
          {selectedPrescription ? (
            <div style={s.detail} className="patient-prescription-detail">
              <div style={s.detailHead}>
                <div style={s.detailAvatar}>{selectedPrescription.doctorName?.charAt(0)}</div>
                <div>
                  <div style={s.detailDoc}>Dr. {selectedPrescription.doctorName}</div>
                  <div style={s.detailDate}>{new Date(selectedPrescription.createdAt || selectedPrescription.issuedAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div style={s.medsTitle}>Medicines</div>
              {selectedPrescription.medicines?.map((m, i) => (
                <div key={i} style={s.medRow} className="patient-prescription-med-row">
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

              {selectedPrescription.instructions && (
                <div style={s.instrBox}>
                  <div style={s.instrLabel}>Doctor's Instructions</div>
                  <div style={s.instrText}>{selectedPrescription.instructions}</div>
                </div>
              )}
            </div>
          ) : (
            <div style={s.detailEmpty}>
              <div style={s.detailEmptyIcon}>🩺</div>
              <div style={s.detailEmptyTitle}>Select a prescription</div>
              <div style={s.detailEmptySub}>Choose a card on the left to view medicine details and doctor instructions.</div>
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
    const loadHistory = async () => {
      try {
        const response = await api.get('/patients/medical-history');
        const parsed = parseHistoryResponse(response.data);
        let mergedTimeline = parsed.timeline;

        if (mergedTimeline.length === 0) {
          mergedTimeline = await buildFallbackTimeline();
        }

        setTimeline(dedupeTimeline(mergedTimeline));
        setSummary(parsed.summary);
      } catch {
        try {
          // Fallback for older patient-service route shape.
          const fallbackResponse = await api.get('/patients/history');
          const parsedFallback = parseHistoryResponse(fallbackResponse.data);
          let mergedTimeline = parsedFallback.timeline;

          if (mergedTimeline.length === 0) {
            mergedTimeline = await buildFallbackTimeline();
          }

          setTimeline(dedupeTimeline(mergedTimeline));
          setSummary(parsedFallback.summary);
        } catch {
          try {
            const fallbackTimeline = await buildFallbackTimeline();
            setTimeline(dedupeTimeline(fallbackTimeline));
            if (fallbackTimeline.length === 0) {
              setError('Failed to load history');
            }
          } catch {
            setError('Failed to load history');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const toDateValue = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const inferType = (item) => {
    if (item?.type) return item.type;
    const details = item?.details || item?.data || {};
    if (Array.isArray(details?.medicines) || Array.isArray(item?.medicines)) return 'prescription';
    if (details?.diagnosis || details?.notes) return 'history';
    return 'history';
  };

  const normalizedTimeline = timeline
    .map((item) => {
      const type = inferType(item);
      const details = item.details || item.data || {};
      const date = toDateValue(item.date || details.date || item.createdAt || details.createdAt || item.updatedAt || details.updatedAt);
      const medicines = Array.isArray(details.medicines)
        ? details.medicines
        : Array.isArray(item.medicines)
          ? item.medicines
          : [];
      const diagnosis = details.diagnosis || item.diagnosis || '';
      const notes = details.notes || details.description || item.notes || '';
      const doctorName = item.doctorName || details.doctorName || details.doctor || '';
      const specialty = item.specialty || details.specialty || '';

      return {
        ...item,
        type,
        displayDate: date,
        displayTitle: item.title || diagnosis || `${type.charAt(0).toUpperCase()}${type.slice(1)} update`,
        displayDoctor: doctorName ? `Dr. ${doctorName}` : 'Healthcare Record',
        displaySpecialty: specialty || (type === 'history' ? 'Consultation Notes' : type.toUpperCase()),
        diagnosis,
        notes,
        medicines
      };
    })
    .sort((a, b) => {
      const aTime = a.displayDate ? a.displayDate.getTime() : 0;
      const bTime = b.displayDate ? b.displayDate.getTime() : 0;
      return bTime - aTime;
    });

  const filteredTimeline = normalizedTimeline.filter((item) => {
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;

    const itemDate = item.displayDate;
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
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return 'No date';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const itemAccent = (type) => {
    if (type === 'prescription') return '#16a34a';
    if (type === 'appointment') return '#1a56db';
    if (type === 'report') return '#9a3412';
    return '#0f766e';
  };

  const getTypeLabel = (type) => {
    if (type === 'prescription') return 'Prescription';
    if (type === 'appointment') return 'Appointment';
    if (type === 'report') return 'Report';
    return 'Consultation';
  };

  const computedSummary = {
    totalEntries: normalizedTimeline.length,
    appointments: normalizedTimeline.filter((item) => item.type === 'appointment').length,
    prescriptions: normalizedTimeline.filter((item) => item.type === 'prescription').length,
    reports: normalizedTimeline.filter((item) => item.type === 'report').length
  };
  const displaySummary = {
    totalEntries: summary?.totalEntries ?? computedSummary.totalEntries,
    appointments: summary?.appointments ?? computedSummary.appointments,
    prescriptions: summary?.prescriptions ?? computedSummary.prescriptions,
    reports: summary?.reports ?? computedSummary.reports
  };

  return (
    <PatientLayout title="Medical History" subtitle="Your past consultations and diagnoses">
      <style>{historyCss}</style>

      {error && <div style={hs.error}>{error}</div>}

      {!loading && !error && (
        <>
          <div style={hs.filters} className="patient-history-filters">
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

          <div style={hs.activeFilterInfo}>
            Showing {filteredTimeline.length} of {normalizedTimeline.length} entries
          </div>

          {(summary || normalizedTimeline.length > 0) && (
            <div style={hs.summaryGrid} className="patient-history-summary-grid">
              <div style={hs.summaryCard} className="patient-history-summary-card"><span style={hs.summaryLabel}>Total</span><strong>{displaySummary.totalEntries || 0}</strong></div>
              <div style={hs.summaryCard} className="patient-history-summary-card"><span style={hs.summaryLabel}>Appointments</span><strong>{displaySummary.appointments || 0}</strong></div>
              <div style={hs.summaryCard} className="patient-history-summary-card"><span style={hs.summaryLabel}>Prescriptions</span><strong>{displaySummary.prescriptions || 0}</strong></div>
              <div style={hs.summaryCard} className="patient-history-summary-card"><span style={hs.summaryLabel}>Reports</span><strong>{displaySummary.reports || 0}</strong></div>
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
            <div key={i} style={hs.item} className="patient-history-item">
              {/* Timeline dot */}
              <div style={hs.dotCol}>
                <div style={{ ...hs.dot, background: itemAccent(h.type) }} />
                {i < filteredTimeline.length - 1 && <div style={hs.line} />}
              </div>

              {/* Content */}
              <div style={hs.content} className="patient-history-content-card">
                <div style={hs.contentHead}>
                  <div>
                    <div style={hs.doctorName}>{h.displayDoctor}</div>
                    <div style={hs.specialty}>{h.displaySpecialty}</div>
                  </div>
                  <div style={hs.headMeta}>
                    <span
                      style={{
                        ...hs.typeBadge,
                        background: `${itemAccent(h.type)}15`,
                        color: itemAccent(h.type),
                        borderColor: `${itemAccent(h.type)}30`
                      }}
                    >
                      {getTypeLabel(h.type)}
                    </span>
                    <div style={hs.dateTag}>
                      {formatDate(h.displayDate)}
                    </div>
                  </div>
                </div>

                <div style={hs.title}>{h.displayTitle}</div>

                {h.diagnosis && (
                  <div style={hs.diagBox}>
                    <span style={hs.diagLabel}>Diagnosis</span>
                    <span style={hs.diagText}>{h.diagnosis}</span>
                  </div>
                )}

                {h.notes && (
                  <div style={hs.notesBox}>
                    <span style={hs.notesLabel}>Notes</span>
                    <p style={hs.notesText}>{h.notes}</p>
                  </div>
                )}

                {h.type === 'prescription' && h.medicines.length > 0 && (
                  <div style={hs.medicineRow}>
                    {h.medicines.slice(0, 3).map((m, idx) => (
                      <span key={idx} style={hs.medicinePill}>{m.name}</span>
                    ))}
                    {h.medicines.length > 3 && (
                      <span style={hs.morePill}>+{h.medicines.length - 3} more</span>
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
  error:        { background: '#fff1f1', color: '#bf3131', border: '1px solid #f1cece', padding: '12px 16px', borderRadius: 12, marginBottom: 16, fontSize: 13 },
  msg:          { color: '#7a92aa', fontSize: 14, padding: '20px 0' },
  emptyBox:     { textAlign: 'center', padding: '60px 20px', background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)', borderRadius: 14, border: '1px solid #d8e6f5' },
  emptyIcon:    { fontSize: 48, marginBottom: 16 },
  emptyTitle:   { fontSize: 16, fontWeight: 700, color: '#10314d', marginBottom: 8 },
  emptySub:     { fontSize: 14, color: '#6c889f' },
  hero:         { background: 'linear-gradient(120deg, #001836 0%, #003566 54%, #0e7490 100%)', borderRadius: 14, padding: 16, marginBottom: 14, border: '1px solid #174a78', boxShadow: '0 14px 32px rgba(3, 32, 66, 0.22)' },
  heroTitle:    { color: '#eaf4ff', fontSize: 14, fontWeight: 700, letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' },
  heroGrid:     { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 },
  heroStatCard: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(188, 216, 243, 0.28)', borderRadius: 10, padding: '10px 12px' },
  heroStatLabel:{ color: '#b8d3ea', fontSize: 11, fontWeight: 600, letterSpacing: 0.3 },
  heroStatValue:{ color: '#ffffff', fontSize: 25, fontWeight: 700, lineHeight: 1.15, marginTop: 4, fontFamily: "'Sora', sans-serif" },
  heroStatValueSm:{ color: '#e7f2ff', fontSize: 15, fontWeight: 700, marginTop: 6 },
  layout:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' },
  list:         { display: 'flex', flexDirection: 'column', gap: 10 },
  card:         { background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)', border: '1.5px solid #d8e6f5', borderRadius: 14, padding: 16, cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 10px 24px rgba(3, 40, 88, 0.06)' },
  cardActive:   { border: '1.5px solid #2f6fae', boxShadow: '0 0 0 3px rgba(47,111,174,0.12)' },
  cardTop:      { display: 'flex', alignItems: 'center', gap: 12 },
  docAvatar:    { width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #e9f2ff, #dceaff)', color: '#1f4f7b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0, border: '1px solid #c7dbef' },
  cardInfo:     { flex: 1 },
  docName:      { fontSize: 14, fontWeight: 700, color: '#10314d' },
  cardDate:     { fontSize: 12, color: '#69869e', marginTop: 2 },
  medCount:     { fontSize: 12, color: '#1f4f7b', fontWeight: 700, background: '#eaf3ff', border: '1px solid #c8dcf0', padding: '3px 10px', borderRadius: 20 },
  instruction:  { fontSize: 12, color: '#6d8aa2', fontStyle: 'italic', marginTop: 10, paddingTop: 10, borderTop: '1px solid #eef4fa' },
  detail:       { background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)', border: '1px solid #d8e6f5', borderRadius: 14, padding: 24, position: 'sticky', top: 20, boxShadow: '0 12px 28px rgba(3, 40, 88, 0.08)' },
  detailHead:   { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f0f4f9' },
  detailAvatar: { width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#001836,#0e7490)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 },
  detailDoc:    { fontSize: 16, fontWeight: 700, color: '#10314d' },
  detailDate:   { fontSize: 12, color: '#69869e', marginTop: 3 },
  medsTitle:    { fontSize: 12, fontWeight: 700, color: '#648099', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  medRow:       { display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #eef4fa', alignItems: 'flex-start' },
  medNum:       { width: 24, height: 24, borderRadius: 8, background: '#eaf3ff', color: '#1f4f7b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1, border: '1px solid #c8dcf0' },
  medInfo:      { flex: 1 },
  medName:      { fontSize: 14, fontWeight: 700, color: '#10314d', marginBottom: 4 },
  medDetail:    { display: 'flex', gap: 6, flexWrap: 'wrap' },
  pill:         { fontSize: 11, background: '#edf3fa', color: '#4f6c87', padding: '2px 8px', borderRadius: 20, fontWeight: 600, border: '1px solid #d7e4f0' },
  medNotes:     { fontSize: 12, color: '#6d8aa2', marginTop: 4, fontStyle: 'italic' },
  instrBox:     { background: '#f5faff', borderRadius: 10, padding: 14, marginTop: 16, border: '1px solid #dbe8f5' },
  instrLabel:   { fontSize: 11, fontWeight: 700, color: '#66829b', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 },
  instrText:    { fontSize: 13, color: '#10314d', lineHeight: 1.6 },
  detailEmpty:  { background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)', border: '1px solid #d8e6f5', borderRadius: 14, minHeight: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24, boxShadow: '0 12px 28px rgba(3, 40, 88, 0.08)' },
  detailEmptyIcon:{ fontSize: 44, marginBottom: 10 },
  detailEmptyTitle:{ fontSize: 16, fontWeight: 700, color: '#10314d', marginBottom: 6 },
  detailEmptySub:{ fontSize: 13, color: '#6d8aa2', maxWidth: 260, lineHeight: 1.5 },
};

/* ── History styles ──────────────────────────────────── */
const hs = {
  error:      { background: '#fff1f1', color: '#bf3131', border: '1px solid #f1cece', padding: '12px 16px', borderRadius: 12, marginBottom: 16, fontSize: 13 },
  msg:        { color: '#7a92aa', fontSize: 14, padding: '20px 0' },
  filters:    { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16, background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)', border: '1px solid #d8e6f5', borderRadius: 12, padding: 12 },
  select:     { height: 38, borderRadius: 10, border: '1px solid #cedff1', padding: '0 10px', fontSize: 13, color: '#10314d', background: '#fff' },
  dateInput:  { height: 38, borderRadius: 10, border: '1px solid #cedff1', padding: '0 10px', fontSize: 13, color: '#10314d', background: '#fff' },
  clearBtn:   { height: 38, borderRadius: 10, border: '1px solid #cedff1', padding: '0 12px', fontSize: 13, color: '#355a79', background: '#f4f9ff', cursor: 'pointer', fontWeight: 700 },
  activeFilterInfo: { marginBottom: 10, color: '#5f7c94', fontSize: 12, fontWeight: 600 },
  summaryGrid:{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 18 },
  summaryCard:{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)', border: '1px solid #d8e6f5', borderRadius: 12, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#10314d', boxShadow: '0 10px 24px rgba(3, 40, 88, 0.06)' },
  summaryLabel:{ fontSize: 12, color: '#6e8ba3', fontWeight: 600 },
  emptyBox:   { textAlign: 'center', padding: '60px 20px', background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)', borderRadius: 14, border: '1px solid #d8e6f5' },
  emptyIcon:  { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: 700, color: '#10314d', marginBottom: 8 },
  emptySub:   { fontSize: 14, color: '#6c889f' },
  timeline:   { display: 'flex', flexDirection: 'column', gap: 0 },
  item:       { display: 'flex', gap: 16 },
  dotCol:     { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 },
  dot:        { width: 14, height: 14, borderRadius: '50%', background: '#1a56db', border: '3px solid #e8f0fe', flexShrink: 0, marginTop: 4 },
  line:       { width: 2, flex: 1, background: '#e4ecf7', margin: '4px 0' },
  content:    { flex: 1, background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)', border: '1px solid #d8e6f5', borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: '0 10px 24px rgba(3, 40, 88, 0.06)' },
  contentHead:{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  title:      { fontSize: 14, fontWeight: 700, color: '#10314d', marginBottom: 10 },
  doctorName: { fontSize: 15, fontWeight: 700, color: '#10314d' },
  specialty:  { fontSize: 12, color: '#1f4f7b', fontWeight: 700, marginTop: 3 },
  dateTag:    { fontSize: 12, color: '#6f8ca4', background: '#edf3fa', border: '1px solid #d8e4ef', padding: '4px 10px', borderRadius: 20, fontWeight: 500, whiteSpace: 'nowrap' },
  headMeta:   { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' },
  typeBadge:  { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 24, padding: '0 10px', borderRadius: 999, border: '1px solid transparent', fontSize: 11, fontWeight: 700, letterSpacing: 0.3, textTransform: 'capitalize' },
  diagBox:    { background: '#f0fdf4', borderRadius: 8, padding: '10px 14px', marginBottom: 10, display: 'flex', gap: 10, alignItems: 'flex-start' },
  diagLabel:  { fontSize: 11, fontWeight: 700, color: '#10834e', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap', marginTop: 1 },
  diagText:   { fontSize: 13, color: '#10314d', fontWeight: 500 },
  notesBox:   { background: '#f5faff', borderRadius: 8, padding: '10px 14px', border: '1px solid #dbe8f5' },
  notesLabel: { fontSize: 11, fontWeight: 700, color: '#6f8ca4', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 },
  notesText:  { fontSize: 13, color: '#4f6c87', lineHeight: 1.6, margin: 0 },
  medicineRow:{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 },
  medicinePill:{ fontSize: 11, background: '#e8f7ef', color: '#166534', padding: '4px 8px', borderRadius: 20, fontWeight: 600 },
  morePill:   { fontSize: 11, background: '#edf3fa', color: '#4f6c87', padding: '4px 8px', borderRadius: 20, fontWeight: 600, border: '1px solid #d8e4ef' },
};

const prescriptionCss = `
.patient-prescription-card,
.patient-prescription-detail,
.patient-prescription-med-row {
  transition: transform 0.16s ease, box-shadow 0.2s ease, border-color 0.16s ease;
}
.patient-prescription-card:hover {
  transform: translateY(-1px);
  border-color: #bfd4e9;
  box-shadow: 0 14px 26px rgba(3, 40, 88, 0.1);
}
@media (max-width: 980px) {
  .patient-prescription-layout {
    grid-template-columns: 1fr !important;
  }
  .patient-prescription-detail {
    position: static !important;
  }
}
@media (max-width: 760px) {
  .patient-prescription-layout {
    gap: 12px !important;
  }
  .patient-prescription-card {
    padding: 14px !important;
  }
  .patient-prescription-hero-grid {
    grid-template-columns: 1fr !important;
  }
}
@media (prefers-reduced-motion: reduce) {
  .patient-prescription-card,
  .patient-prescription-detail,
  .patient-prescription-med-row {
    transition: none !important;
  }
}
`;

const historyCss = `
.patient-history-summary-card,
.patient-history-content-card,
.patient-history-item {
  transition: transform 0.16s ease, box-shadow 0.2s ease, border-color 0.16s ease;
}
.patient-history-summary-card:hover,
.patient-history-content-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(3, 40, 88, 0.1);
  border-color: #c5daee;
}
@media (max-width: 760px) {
  .patient-history-filters {
    flex-direction: column;
    align-items: stretch;
  }
  .patient-history-filters select,
  .patient-history-filters input,
  .patient-history-filters button {
    width: 100%;
  }
  .patient-history-item {
    gap: 10px !important;
  }
  .patient-history-content-card {
    padding: 14px !important;
  }
}
@media (prefers-reduced-motion: reduce) {
  .patient-history-summary-card,
  .patient-history-content-card,
  .patient-history-item {
    transition: none !important;
  }
}
`;