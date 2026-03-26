// client/src/pages/patient/PatientSetup.jsx
import { useState } from 'react';
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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box}`}</style>
      <div style={s.card}>
        <div style={s.logoRow}>
          <span style={s.dot}/> MediConnect
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
          <div>
            <div style={s.grid}>
              <Field label="Phone Number"  value={form.phone}       onChange={v => set('phone', v)}       placeholder="0771234567" />
              <Field label="Date of Birth" value={form.dateOfBirth} onChange={v => set('dateOfBirth', v)} type="date" />
            </div>
            <div style={s.grid}>
              <SelectField label="Gender" value={form.gender} onChange={v => set('gender', v)}
                options={[['','Select gender'],['male','Male'],['female','Female'],['other','Other']]} />
              <SelectField label="Blood Group" value={form.bloodGroup} onChange={v => set('bloodGroup', v)}
                options={[['','Select'],['A+','A+'],['A-','A-'],['B+','B+'],['B-','B-'],['AB+','AB+'],['AB-','AB-'],['O+','O+'],['O-','O-']]} />
            </div>
            <Field label="Address" value={form.address} onChange={v => set('address', v)} placeholder="Your full address" />
            <button style={s.btn} onClick={() => setStep(2)}>Continue →</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <p style={s.note}>Who should we contact in case of emergency?</p>
            <Field label="Contact Name"     value={form.emergencyContact.name}         onChange={v => setEC('name', v)}         placeholder="Full name" />
            <Field label="Contact Phone"    value={form.emergencyContact.phone}        onChange={v => setEC('phone', v)}        placeholder="0779999999" />
            <Field label="Relationship"     value={form.emergencyContact.relationship} onChange={v => setEC('relationship', v)} placeholder="e.g. Mother, Spouse" />
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button style={s.btnGhost} onClick={() => setStep(1)}>← Back</button>
              <button style={{ ...s.btn, flex: 1 }} onClick={handleSubmit} disabled={loading}>
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

  useState(() => {
    api.get('/patients/profile')
      .then(r => { setProfile(r.data); setForm(r.data); })
      .catch(() => navigate('/patient/setup'))
      .finally(() => setLoading(false));
  });

  // Use useEffect properly
  const { useEffect } = require('react');
  useEffect(() => {
    api.get('/patients/profile')
      .then(r => { setProfile(r.data); setForm({ ...r.data }); })
      .catch(() => navigate('/patient/setup'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setEC = (k, v) => setForm(f => ({ ...f, emergencyContact: { ...f.emergencyContact, [k]: v } }));

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

  if (loading) return <div style={{ padding: 40, fontFamily: "'DM Sans',sans-serif", color: '#7a92aa' }}>Loading...</div>;
  if (!form) return null;

  return (
    <PatientLayout title="My Profile" subtitle="Manage your personal and medical information">
      {success && <div style={ps.success}>✓ Profile updated successfully</div>}
      {error   && <div style={ps.error}>{error}</div>}

      <div style={ps.grid}>
        {/* Personal info */}
        <div style={ps.section}>
          <div style={ps.sectionHead}>Personal Information</div>
          <div style={ps.fields}>
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
          <div style={ps.sectionHead}>Emergency Contact</div>
          <div style={ps.fields}>
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

      <button style={ps.saveBtn} onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </PatientLayout>
  );
}

/* ── Shared field components ─────────────────────────────── */
function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, background: '#fff', fontFamily: 'inherit' }}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

function PField({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#7a92aa', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e4ecf7', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff' }} />
    </div>
  );
}

function PSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#7a92aa', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e4ecf7', borderRadius: 10, fontSize: 14, background: '#fff', fontFamily: 'inherit' }}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

/* ── Setup styles ──────────────────────────────────────────── */
const s = {
  page:            { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#e8f0fe 0%,#f0f9ff 100%)', padding: 20, fontFamily: "'DM Sans',sans-serif" },
  card:            { background: '#fff', borderRadius: 20, padding: 40, width: '100%', maxWidth: 540, boxShadow: '0 20px 60px rgba(26,86,219,0.1)' },
  logoRow:         { display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700, color: '#0b1f3a', marginBottom: 28 },
  dot:             { width: 8, height: 8, borderRadius: '50%', background: '#2DD4BF', display: 'inline-block' },
  title:           { fontSize: 24, fontWeight: 800, color: '#0b1f3a', margin: '0 0 6px', letterSpacing: '-0.5px' },
  sub:             { fontSize: 14, color: '#7a92aa', margin: '0 0 28px' },
  steps:           { display: 'flex', gap: 8, marginBottom: 28, alignItems: 'center' },
  stepItem:        { display: 'flex', alignItems: 'center', gap: 8, flex: 1 },
  stepCircle:      { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: '#e4ecf7', color: '#7a92aa', flexShrink: 0 },
  stepActive:      { background: '#1a56db', color: '#fff' },
  stepDone:        { background: '#2DD4BF', color: '#fff' },
  stepLabel:       { fontSize: 12, color: '#7a92aa', fontWeight: 500 },
  stepLabelActive: { color: '#0b1f3a', fontWeight: 700 },
  grid:            { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  error:           { background: '#fff0f0', color: '#cc0000', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13 },
  note:            { fontSize: 13, color: '#7a92aa', marginBottom: 16 },
  btn:             { width: '100%', padding: 13, background: '#1a56db', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
  btnGhost:        { padding: '13px 20px', background: '#fff', color: '#1a56db', border: '1.5px solid #1a56db', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
};

/* ── Profile styles ─────────────────────────────────────────── */
const ps = {
  grid:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 },
  section:     { background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #e4ecf7' },
  sectionHead: { fontSize: 13, fontWeight: 700, color: '#0b1f3a', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0f4f9' },
  fields:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  success:     { background: '#f0fdf4', color: '#16a34a', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13, fontWeight: 600 },
  error:       { background: '#fff0f0', color: '#cc0000', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13 },
  readOnly:    { background: '#f8faff', borderRadius: 10, padding: 16 },
  roRow:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f4f9' },
  roKey:       { fontSize: 13, color: '#7a92aa' },
  roVal:       { fontSize: 13, color: '#0b1f3a', fontWeight: 600 },
  roBadge:     { background: '#ebf2ff', color: '#1a56db', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 },
  saveBtn:     { background: '#1a56db', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
};