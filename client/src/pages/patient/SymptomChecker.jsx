import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PatientLayout from './Patientlayout ';
import { analyzeSymptoms } from '../../services/symptomCheckerApi';

export default function SymptomChecker() {
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [patientProfile, setPatientProfile] = useState(null);
  const [followupAnswers, setFollowupAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        const res = await api.get('/patients/profile');
        if (!active) return;
        setPatientProfile(res.data || null);

        if (!age && res.data?.dateOfBirth) {
          const d = new Date(res.data.dateOfBirth);
          if (!Number.isNaN(d.getTime())) {
            const computed = Math.max(0, new Date().getFullYear() - d.getFullYear());
            setAge(String(computed));
          }
        }
        if (!gender && res.data?.gender) {
          setGender(String(res.data.gender));
        }
      } catch {
        if (active) setPatientProfile(null);
      }
    };
    loadProfile();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const primarySpecialty = useMemo(() => {
    const s = result?.primarySpecialty || result?.recommendedSpecialties?.[0] || '';
    return String(s || '').split('/')[0].trim();
  }, [result]);

  const submitAnalysis = async ({ resetResult = true } = {}) => {
    if (!symptoms.trim()) {
      setError('Please enter your symptoms.');
      return;
    }

    setLoading(true);
    setError('');
    if (resetResult) setResult(null);

    try {
      const data = await analyzeSymptoms({
        symptoms,
        age: age ? Number(age) : undefined,
        gender: gender || undefined,
        additionalContext: additionalContext || undefined,
        followupAnswers,
        patientProfile: patientProfile || undefined
      });
      setResult(data);
    } catch (apiError) {
      const message = apiError?.response?.data?.error || 'Failed to analyze symptoms.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInitialSubmit = async (event) => {
    event.preventDefault();
    setFollowupAnswers({});
    await submitAnalysis({ resetResult: true });
  };

  const handleFollowupSubmit = async (event) => {
    event.preventDefault();
    await submitAnalysis({ resetResult: true });
  };

  const onAnswerChange = (id, value, type) => {
    setFollowupAnswers((prev) => {
      const next = { ...prev };
      if (type === 'number') {
        next[id] = value === '' ? '' : Number(value);
      } else {
        next[id] = value;
      }
      return next;
    });
  };

  const handleFindDoctors = () => {
    const params = new URLSearchParams();
    if (primarySpecialty) params.set('specialization', primarySpecialty);
    navigate(`/appointments/results?${params.toString()}`, {
      state: {
        aiNote: result?.doctorSummary || '',
        aiSpecialty: primarySpecialty || ''
      }
    });
  };

  const copyDoctorSummary = async () => {
    const text = String(result?.doctorSummary || '').trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      alert('Doctor summary copied.');
    } catch {
      alert('Copy failed. Please select and copy manually.');
    }
  };

  return (
    <PatientLayout
      title="AI Symptom Checker"
      subtitle="Get preliminary suggestions and recommended doctor specialties."
    >
      <div style={s.wrapper}>
        <form onSubmit={handleInitialSubmit} style={s.card}>
          <div style={s.field}>
            <label style={s.label} htmlFor="symptoms">Symptoms *</label>
            <textarea
              id="symptoms"
              rows={5}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Example: fever, dry cough, sore throat for 2 days"
              style={s.textarea}
            />
          </div>

          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label} htmlFor="age">Age</label>
              <input
                id="age"
                type="number"
                min="0"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                style={s.input}
              />
            </div>
            <div style={s.field}>
              <label style={s.label} htmlFor="gender">Gender</label>
              <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} style={s.input}>
                <option value="">Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label} htmlFor="additionalContext">Additional Context</label>
            <textarea
              id="additionalContext"
              rows={3}
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Existing conditions, medications, allergies..."
              style={s.textarea}
            />
          </div>

          {error && <div style={s.error}>{error}</div>}

          <button type="submit" disabled={loading} style={s.button}>
            {loading ? 'Analyzing...' : 'Analyze Symptoms'}
          </button>
        </form>

        {result?.emergencyWarning && (
          <div style={s.emergency}>
            <div style={s.emergencyTitle}>Urgent warning</div>
            <div style={s.emergencyText}>
              Some symptoms/answers may indicate an emergency. Please seek immediate medical care.
            </div>
            {(Array.isArray(result?.redFlags) && result.redFlags.length > 0) && (
              <ul style={s.redFlagList}>
                {result.redFlags.slice(0, 6).map((f, idx) => (
                  <li key={`rf-${idx}`}>{f}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {result?.needsMoreInfo && Array.isArray(result?.questionsToAskNext) && (
          <form onSubmit={handleFollowupSubmit} style={s.card}>
            <h3 style={s.resultTitle}>Quick follow-up questions</h3>
            <p style={s.summary}>
              Answering these makes the guidance safer and more specific.
            </p>

            {result.questionsToAskNext.map((q) => (
              <div key={q.id} style={s.field}>
                <label style={s.label} htmlFor={`q-${q.id}`}>
                  {q.prompt} {q.required ? '*' : ''}
                </label>
                {q.type === 'yesno' ? (
                  <select
                    id={`q-${q.id}`}
                    value={String(followupAnswers[q.id] ?? '')}
                    onChange={(e) => onAnswerChange(q.id, e.target.value, q.type)}
                    style={s.input}
                  >
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                ) : (
                  <input
                    id={`q-${q.id}`}
                    type="number"
                    value={followupAnswers[q.id] ?? ''}
                    onChange={(e) => onAnswerChange(q.id, e.target.value, q.type)}
                    style={s.input}
                  />
                )}
              </div>
            ))}

            <button type="submit" disabled={loading} style={s.button}>
              {loading ? 'Analyzing...' : 'Get Recommendation'}
            </button>
          </form>
        )}

        {result && !result.needsMoreInfo && (
          <div style={s.card}>
            <h3 style={s.resultTitle}>Result</h3>
            <p style={s.disclaimer}>{result.disclaimer}</p>
            <p style={s.summary}>{result.summary}</p>

            {result.whenToSeeDoctor && (
              <div style={s.whenToSeeDoctor}>
                When to see a doctor: <strong>{result.whenToSeeDoctor}</strong>
              </div>
            )}

            <Section title="Possible Conditions" items={result.possibleConditions} />
            <Section title="Recommended Specialties" items={result.recommendedSpecialties} />
            <Section title="Recommended Next Steps" items={result.recommendedNextSteps} />
            <Section title="Home care (general)" items={result.homeCareAdvice} />

            {result.doctorSummary && (
              <div style={s.section}>
                <div style={s.sectionTitle}>Doctor-ready summary</div>
                <div style={s.doctorSummaryBox}>{result.doctorSummary}</div>
                <div style={s.rowButtons}>
                  <button type="button" onClick={copyDoctorSummary} style={s.secondaryBtn}>Copy summary</button>
                  <button type="button" onClick={handleFindDoctors} style={s.secondaryBtn}>
                    Find doctors ({primarySpecialty || 'General'})
                  </button>
                </div>
              </div>
            )}

            <div style={s.meta}>Triage: {result.triageLevel || 'unknown'} | Source: {result.source || 'n/a'}</div>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}

function Section({ title, items }) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (list.length === 0) return null;

  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>{title}</div>
      <ul style={s.list}>
        {list.map((item, idx) => (
          <li key={`${title}-${idx}`}>{String(item)}</li>
        ))}
      </ul>
    </div>
  );
}

const s = {
  wrapper: { display: 'grid', gap: 16, maxWidth: 900 },
  card: { background: '#fff', border: '1px solid #d7e5f3', borderRadius: 12, padding: 16, boxShadow: '0 10px 24px rgba(3, 40, 88, 0.06)' },
  row: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 },
  rowButtons: { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 },
  field: { display: 'grid', gap: 6, marginBottom: 10 },
  label: { fontSize: 13, fontWeight: 600, color: '#274960' },
  input: { height: 38, borderRadius: 8, border: '1px solid #cdddef', padding: '0 10px' },
  textarea: { borderRadius: 8, border: '1px solid #cdddef', padding: 10, resize: 'vertical' },
  button: { height: 40, border: 'none', borderRadius: 8, background: '#0d4d7d', color: '#fff', fontWeight: 700, cursor: 'pointer', padding: '0 14px' },
  secondaryBtn: { height: 38, borderRadius: 8, border: '1px solid #cdddef', background: '#f4f9ff', color: '#1a4566', fontWeight: 700, cursor: 'pointer', padding: '0 12px' },
  error: { background: '#fff1f1', color: '#b73f3f', border: '1px solid #eec9c9', borderRadius: 8, padding: '8px 10px', marginBottom: 10 },
  resultTitle: { margin: '0 0 6px', color: '#123855' },
  disclaimer: { margin: '0 0 10px', color: '#7b4f22', background: '#fff7e7', border: '1px solid #f0dbb3', borderRadius: 8, padding: '8px 10px', fontSize: 13 },
  summary: { margin: '0 0 10px', color: '#274960' },
  whenToSeeDoctor: { margin: '0 0 10px', color: '#173d59', background: '#edf7ff', border: '1px solid #cfe6f7', borderRadius: 8, padding: '8px 10px', fontSize: 13 },
  section: { marginTop: 10 },
  sectionTitle: { fontWeight: 700, color: '#173d59', marginBottom: 4 },
  list: { margin: 0, paddingLeft: 18, color: '#355970' },
  doctorSummaryBox: { border: '1px solid #d7e5f3', borderRadius: 10, padding: 10, background: '#fbfdff', fontSize: 13, color: '#274960', lineHeight: 1.45 },
  emergency: { background: '#fff1f1', color: '#7c1d1d', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 12px' },
  emergencyTitle: { fontWeight: 800, marginBottom: 6 },
  emergencyText: { fontSize: 13 },
  redFlagList: { margin: '8px 0 0', paddingLeft: 18, fontSize: 13 },
  meta: { marginTop: 12, fontSize: 12, color: '#5d7891' }
};
