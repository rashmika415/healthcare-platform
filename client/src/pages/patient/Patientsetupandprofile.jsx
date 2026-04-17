// client/src/pages/patient/PatientSetup.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function PatientSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    phone: '', dateOfBirth: '', gender: '', bloodGroup: '', address: '',
    emergencyContact: { name: '', phone: '', relationship: '' }
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setEC = (k, v) => setForm(f => ({ ...f, emergencyContact: { ...f.emergencyContact, [k]: v } }));
  const setupFields = [
    form.phone,
    form.dateOfBirth,
    form.gender,
    form.bloodGroup,
    form.address,
    form.emergencyContact.name,
    form.emergencyContact.phone,
    form.emergencyContact.relationship
  ];
  const setupCompletion = Math.round((setupFields.filter(v => String(v || '').trim() !== '').length / setupFields.length) * 100);

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      await api.post('/patients/profile', form);
      navigate('/patient/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save profile');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <style>{setupCss}</style>
      <div style={s.card}>
        <div style={s.hero}>
          <div style={s.logoRow}>
            <span style={s.dot}/> Nexus Health
          </div>
          <div style={s.heroMeter}>
            <div style={s.heroMeterRow}>
              <span>Setup Completion</span>
              <strong>{setupCompletion}%</strong>
            </div>
            <div style={s.heroTrack}>
              <div style={{ ...s.heroFill, width: `${setupCompletion}%` }} />
            </div>
          </div>
        </div>
        <h2 style={s.title}>Complete your profile</h2>
        <p style={s.sub}>This helps doctors understand your health background</p>

        {/* Step indicator */}
        <div style={s.steps}>
          {['Personal Info', 'Emergency Contact'].map((label, i) => (
            <div key={i} style={s.stepItem}>
              <div style={{ ...s.stepCircle, ...(step > i + 1 ? s.stepDone : step === i + 1 ? s.stepActive : {}) }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{ ...s.stepLabel, ...(step === i + 1 ? s.stepLabelActive : {}) }}>{label}</span>
            </div>
          ))}
        </div>

        {error && <div style={s.error}>{error}</div>}

        {step === 1 && (
          <div style={s.stepPanel}>
            <div style={s.grid} className="patient-setup-grid">
              <Field label="Phone Number"  value={form.phone}       onChange={v => set('phone', v)}       placeholder="0771234567" />
              <Field label="Date of Birth" value={form.dateOfBirth} onChange={v => set('dateOfBirth', v)} type="date" />
            </div>
            <div style={s.grid} className="patient-setup-grid">
              <SelectField label="Gender" value={form.gender} onChange={v => set('gender', v)}
                options={[['','Select gender'],['male','Male'],['female','Female'],['other','Other']]} />
              <SelectField label="Blood Group" value={form.bloodGroup} onChange={v => set('bloodGroup', v)}
                options={[['','Select'],['A+','A+'],['A-','A-'],['B+','B+'],['B-','B-'],['AB+','AB+'],['AB-','AB-'],['O+','O+'],['O-','O-']]} />
            </div>
            <Field label="Address" value={form.address} onChange={v => set('address', v)} placeholder="Your full address" />
            <button className="patient-setup-btn" style={s.btn} onClick={() => setStep(2)}>Continue →</button>
          </div>
        )}

        {step === 2 && (
          <div style={s.stepPanel}>
            <p style={s.note}>Who should we contact in case of emergency?</p>
            <Field label="Contact Name"     value={form.emergencyContact.name}         onChange={v => setEC('name', v)}         placeholder="Full name" />
            <Field label="Contact Phone"    value={form.emergencyContact.phone}        onChange={v => setEC('phone', v)}        placeholder="0779999999" />
            <Field label="Relationship"     value={form.emergencyContact.relationship} onChange={v => setEC('relationship', v)} placeholder="e.g. Mother, Spouse" />
            <div style={s.actionRow} className="patient-setup-actions">
              <button className="patient-setup-btn-ghost" style={s.btnGhost} onClick={() => setStep(1)}>← Back</button>
              <button className="patient-setup-btn" style={{ ...s.btn, flex: 1 }} onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : 'Save & Continue →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PatientProfile ──────────────────────────────────────
export function PatientProfile() {
  const navigate = useNavigate();
  const [profile,  setProfile]  = useState(null);
  const [form,     setForm]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    api.get('/patients/profile')
      .then(r => { setProfile(r.data); setForm({ ...r.data }); })
      .catch(() => navigate('/patient/setup'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setEC = (k, v) => setForm(f => ({ ...f, emergencyContact: { ...f.emergencyContact, [k]: v } }));
  const patientName = (form?.name || profile?.name || 'Patient').trim();
  const initials = patientName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('') || 'P';

  const profileScoreFields = [
    form?.name,
    form?.email,
    form?.phone,
    form?.dateOfBirth,
    form?.gender,
    form?.bloodGroup,
    form?.address,
    form?.emergencyContact?.name,
    form?.emergencyContact?.phone
  ];
  const completedCount = profileScoreFields.filter(v => String(v || '').trim() !== '').length;
  const completion = Math.round((completedCount / profileScoreFields.length) * 100);

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess(false);
    try {
      await api.put('/patients/profile', form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    } finally { setSaving(false); }
  };

  const PatientLayout = require('./Patientlayout ').default;

  if (loading) {
    return (
      <FullScreenLoader
        title="Loading your profile"
        subtitle="Preparing your personal and medical details..."
      />
    );
  }
  if (!form) {
    return (
      <FullScreenLoader
        title="Profile data unavailable"
        subtitle="Please refresh this page or complete setup again."
      />
    );
  }

  return (
    <PatientLayout title="My Profile" subtitle="Manage your personal and medical information">
      <style>{profileCss}</style>

      {success && <div style={ps.success}>✓ Profile updated successfully</div>}
      {error   && <div style={ps.error}>{error}</div>}

      <section style={ps.hero}>
        <div style={ps.heroIdentity}>
          <div style={ps.heroAvatar}>{initials}</div>
          <div>
            <div style={ps.heroTitle}>{patientName}</div>
            <div style={ps.heroSub}>Keep your profile updated for faster appointments and safer care.</div>
          </div>
        </div>
        <div style={ps.heroStats}>
          <div style={ps.progressHead}>
            <span>Profile completion</span>
            <strong>{completion}%</strong>
          </div>
          <div style={ps.progressTrack}>
            <div style={{ ...ps.progressFill, width: `${completion}%` }} />
          </div>
        </div>
      </section>

      <div style={ps.grid} className="patient-profile-grid">
        {/* Personal info */}
        <div style={ps.section}>
          <div style={ps.sectionHeadRow}>
            <div style={ps.sectionHead}>Personal Information</div>
            <span style={ps.sectionTag}>Editable</span>
          </div>
          <div style={ps.fields} className="patient-profile-fields">
            <PField label="Full Name"     value={form.name || ''}        onChange={v => set('name', v)}       placeholder="Your full name" />
            <PField label="Email"         value={form.email || ''}       onChange={v => set('email', v)}      placeholder="email@example.com" type="email" />
            <PField label="Phone"         value={form.phone || ''}       onChange={v => set('phone', v)}      placeholder="0771234567" />
            <PField label="Date of Birth" value={form.dateOfBirth ? form.dateOfBirth.slice(0,10) : ''} onChange={v => set('dateOfBirth', v)} type="date" />
            <PSelect label="Gender" value={form.gender || ''} onChange={v => set('gender', v)}
              options={[['','Select gender'],['male','Male'],['female','Female'],['other','Other']]} />
            <PSelect label="Blood Group" value={form.bloodGroup || ''} onChange={v => set('bloodGroup', v)}
              options={[['','Select'],['A+','A+'],['A-','A-'],['B+','B+'],['B-','B-'],['AB+','AB+'],['AB-','AB-'],['O+','O+'],['O-','O-']]} />
            <div style={{ gridColumn: '1 / -1' }}>
              <PField label="Address" value={form.address || ''} onChange={v => set('address', v)} placeholder="Your full address" />
            </div>
          </div>
        </div>

        {/* Emergency contact */}
        <div style={ps.section}>
          <div style={ps.sectionHeadRow}>
            <div style={ps.sectionHead}>Emergency Contact</div>
            <span style={ps.sectionTagMuted}>Safety</span>
          </div>
          <div style={ps.fields} className="patient-profile-fields">
            <PField label="Contact Name"  value={form.emergencyContact?.name         || ''} onChange={v => setEC('name', v)}         placeholder="Full name" />
            <PField label="Phone"         value={form.emergencyContact?.phone        || ''} onChange={v => setEC('phone', v)}        placeholder="0779999999" />
            <PField label="Relationship"  value={form.emergencyContact?.relationship || ''} onChange={v => setEC('relationship', v)} placeholder="e.g. Mother" />
          </div>

          {/* Account info (read only) */}
          <div style={{ ...ps.sectionHead, marginTop: 28 }}>Account Info</div>
          <div style={ps.readOnly}>
            <div style={ps.roRow}><span style={ps.roKey}>Role</span><span style={ps.roBadge}>Patient</span></div>
            <div style={ps.roRow}><span style={ps.roKey}>Member since</span><span style={ps.roVal}>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}</span></div>
          </div>
        </div>
      </div>

      <div style={ps.saveRow}>
        <button style={ps.saveBtn} className="patient-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </PatientLayout>
  );
}

/* ── Shared field components ─────────────────────────────── */
function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#5d7892', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.7 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="setup-input"
        style={{ width: '100%', padding: '11px 14px', border: '1px solid #cfdeee', borderRadius: 11, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fdfefe', color: '#143955' }} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#5d7892', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.7 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="setup-select"
        style={{ width: '100%', padding: '11px 14px', border: '1px solid #cfdeee', borderRadius: 11, fontSize: 14, background: '#fdfefe', fontFamily: 'inherit', color: '#143955' }}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

function PField({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#5d7892', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.7 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '11px 14px', border: '1px solid #cfdeee', borderRadius: 11, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fdfefe', color: '#143955', boxShadow: 'inset 0 1px 0 rgba(0, 24, 54, 0.02)' }} />
    </div>
  );
}

function PSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#5d7892', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.7 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '11px 14px', border: '1px solid #cfdeee', borderRadius: 11, fontSize: 14, background: '#fdfefe', fontFamily: 'inherit', color: '#143955' }}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

function FullScreenLoader({ title, subtitle }) {
  return (
    <div style={loaderStyles.page}>
      <div style={loaderStyles.card}>
        <div style={loaderStyles.spinner} />
        <h3 style={loaderStyles.title}>{title}</h3>
        <p style={loaderStyles.sub}>{subtitle}</p>
      </div>
    </div>
  );
}

/* ── Setup styles ──────────────────────────────────────────── */
const s = {
  page:            { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#e9f2ff 0%,#f4f9ff 100%)', padding: 20, fontFamily: "'DM Sans',sans-serif" },
  card:            { background: '#fff', borderRadius: 20, padding: 30, width: '100%', maxWidth: 640, border: '1px solid #d8e6f5', boxShadow: '0 20px 60px rgba(26,86,219,0.1)' },
  hero:            { background: 'linear-gradient(135deg, #f7fbff, #edf5ff)', border: '1px solid #d8e6f5', borderRadius: 14, padding: 14, marginBottom: 20 },
  heroMeter:       { marginTop: 10 },
  heroMeterRow:    { display: 'flex', justifyContent: 'space-between', color: '#4f6c86', fontSize: 12, marginBottom: 7 },
  heroTrack:       { height: 8, borderRadius: 999, background: '#dce8f5', overflow: 'hidden' },
  heroFill:        { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #0e7490, #1d4ed8)' },
  logoRow:         { display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700, color: '#0b1f3a' },
  dot:             { width: 8, height: 8, borderRadius: '50%', background: '#2DD4BF', display: 'inline-block' },
  title:           { fontSize: 24, fontWeight: 800, color: '#0b1f3a', margin: '0 0 6px', letterSpacing: '-0.5px' },
  sub:             { fontSize: 14, color: '#6a869f', margin: '0 0 24px' },
  steps:           { display: 'flex', gap: 8, marginBottom: 28, alignItems: 'center' },
  stepItem:        { display: 'flex', alignItems: 'center', gap: 8, flex: 1 },
  stepCircle:      { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: '#e4ecf7', color: '#7a92aa', flexShrink: 0 },
  stepActive:      { background: '#1a56db', color: '#fff' },
  stepDone:        { background: '#2DD4BF', color: '#fff' },
  stepLabel:       { fontSize: 12, color: '#7a92aa', fontWeight: 500 },
  stepLabelActive: { color: '#0b1f3a', fontWeight: 700 },
  stepPanel:       { border: '1px solid #dbe8f5', borderRadius: 14, padding: 16, background: '#fbfdff' },
  grid:            { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  error:           { background: '#fff0f0', color: '#cc0000', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13 },
  note:            { fontSize: 13, color: '#7a92aa', marginBottom: 16 },
  actionRow:       { display: 'flex', gap: 12, marginTop: 8 },
  btn:             { width: '100%', padding: 13, background: 'linear-gradient(135deg, #0e7490, #1d4ed8)', color: '#fff', border: '1px solid #457ad4', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8, boxShadow: '0 10px 22px rgba(9, 62, 125, 0.23)' },
  btnGhost:        { padding: '13px 20px', background: '#f3f8ff', color: '#17507a', border: '1px solid #c1d7ee', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
};

/* ── Profile styles ─────────────────────────────────────────── */
const ps = {
  hero:        { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center', background: 'linear-gradient(135deg, #f7fbff, #edf5ff)', border: '1px solid #d8e6f5', borderRadius: 16, padding: 18, marginBottom: 20 },
  heroIdentity:{ display: 'flex', alignItems: 'center', gap: 12 },
  heroAvatar:  { width: 54, height: 54, borderRadius: 14, background: 'linear-gradient(135deg, #001836, #002d5b)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 },
  heroTitle:   { fontSize: 20, fontWeight: 700, color: '#0e2f4b', letterSpacing: '-0.2px' },
  heroSub:     { fontSize: 13, color: '#56718a', marginTop: 2 },
  heroStats:   { minWidth: 220 },
  progressHead:{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#4f6c86', marginBottom: 8 },
  progressTrack:{ height: 8, borderRadius: 999, background: '#dce8f5', overflow: 'hidden' },
  progressFill:{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #0e7490, #1d4ed8)' },
  grid:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 },
  section:     { background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #dbe8f5', boxShadow: '0 10px 30px rgba(0, 24, 54, 0.05)' },
  sectionHeadRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #edf3f9' },
  sectionHead: { fontSize: 13, fontWeight: 700, color: '#0b1f3a' },
  sectionTag:  { fontSize: 11, fontWeight: 700, color: '#0f5d8f', background: '#e6f3ff', border: '1px solid #c9e3fb', padding: '2px 8px', borderRadius: 999 },
  sectionTagMuted: { fontSize: 11, fontWeight: 700, color: '#4e6d86', background: '#eef4fb', border: '1px solid #d8e4f1', padding: '2px 8px', borderRadius: 999 },
  fields:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  success:     { background: '#f0fdf4', color: '#16a34a', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13, fontWeight: 600 },
  error:       { background: '#fff0f0', color: '#cc0000', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13 },
  readOnly:    { background: '#f8fbff', borderRadius: 10, padding: 16, border: '1px solid #e2ebf5' },
  roRow:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f4f9' },
  roKey:       { fontSize: 13, color: '#7a92aa' },
  roVal:       { fontSize: 13, color: '#0b1f3a', fontWeight: 600 },
  roBadge:     { background: '#ebf2ff', color: '#1a56db', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 },
  saveRow:     { display: 'flex', justifyContent: 'flex-end' },
  saveBtn:     { background: 'linear-gradient(135deg, #0e7490, #1d4ed8)', color: '#fff', border: '1px solid #457ad4', borderRadius: 10, padding: '13px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 22px rgba(9, 62, 125, 0.26)' },
};

const profileCss = `
.patient-save-btn {
  transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease;
}
.patient-save-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(9, 62, 125, 0.34);
  filter: brightness(1.04);
}
.patient-save-btn:active {
  transform: translateY(0);
}
@media (max-width: 1080px) {
  .patient-profile-grid {
    grid-template-columns: 1fr !important;
  }
}
@media (max-width: 760px) {
  .patient-profile-fields {
    grid-template-columns: 1fr !important;
  }
}
@media (prefers-reduced-motion: reduce) {
  .patient-save-btn {
    transition: none !important;
  }
}
`;

const setupCss = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
* { box-sizing: border-box; }
.patient-setup-btn,
.patient-setup-btn-ghost,
.setup-input,
.setup-select {
  transition: transform 0.14s ease, box-shadow 0.18s ease, border-color 0.18s ease, background-color 0.18s ease;
}
.patient-setup-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(9, 62, 125, 0.34);
}
.patient-setup-btn:active,
.patient-setup-btn-ghost:active {
  transform: translateY(0);
}
.patient-setup-btn-ghost:hover {
  background: #eaf3ff;
  border-color: #a9c8e7;
}
.setup-input:focus,
.setup-select:focus {
  border-color: #7faad5;
  box-shadow: 0 0 0 3px rgba(55, 125, 193, 0.16);
}
@media (max-width: 760px) {
  .patient-setup-grid {
    grid-template-columns: 1fr !important;
  }
  .patient-setup-actions {
    flex-direction: column;
  }
}
@media (prefers-reduced-motion: reduce) {
  .patient-setup-btn,
  .patient-setup-btn-ghost,
  .setup-input,
  .setup-select {
    transition: none !important;
  }
}
@keyframes spinLoader {
  to {
    transform: rotate(360deg);
  }
}
`;

const loaderStyles = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    background: 'linear-gradient(135deg,#e9f2ff 0%,#f4f9ff 100%)',
    padding: 20,
    fontFamily: "'DM Sans',sans-serif"
  },
  card: {
    width: '100%',
    maxWidth: 460,
    background: '#ffffff',
    border: '1px solid #d8e6f5',
    borderRadius: 16,
    boxShadow: '0 20px 60px rgba(26,86,219,0.1)',
    padding: '26px 22px',
    textAlign: 'center'
  },
  spinner: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    border: '3px solid #cddff2',
    borderTopColor: '#1d4ed8',
    margin: '0 auto 14px',
    animation: 'spinLoader 0.9s linear infinite'
  },
  title: {
    margin: '0 0 6px',
    color: '#0f3250',
    fontSize: 20,
    fontWeight: 700
  },
  sub: {
    margin: 0,
    color: '#5f7a92',
    fontSize: 13
  }
};