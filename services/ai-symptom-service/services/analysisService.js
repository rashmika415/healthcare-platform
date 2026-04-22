const axios = require('axios');

const specialtyRules = [
  { keywords: ['chest pain', 'heart', 'palpitation', 'bp', 'hypertension'], specialty: 'Cardiology' },
  { keywords: ['cough', 'cold', 'fever', 'breath', 'asthma'], specialty: 'Pulmonology / General Medicine' },
  { keywords: ['stomach', 'abdomen', 'diarrhea', 'constipation', 'acidity', 'nausea'], specialty: 'Gastroenterology' },
  { keywords: ['rash', 'itching', 'skin', 'eczema', 'acne'], specialty: 'Dermatology' },
  { keywords: ['headache', 'migraine', 'dizziness', 'seizure'], specialty: 'Neurology' },
  { keywords: ['anxiety', 'stress', 'depression', 'panic', 'sleep'], specialty: 'Psychiatry / Psychology' },
  { keywords: ['urine', 'kidney', 'renal', 'bladder'], specialty: 'Nephrology / Urology' },
  { keywords: ['joint', 'knee', 'back pain', 'arthritis', 'bone'], specialty: 'Orthopedics / Rheumatology' },
  { keywords: ['period', 'pregnancy', 'pelvic', 'vaginal'], specialty: 'Gynecology' },
  { keywords: ['eye', 'vision', 'blurred', 'red eye'], specialty: 'Ophthalmology' },
  { keywords: ['ear', 'throat', 'sinus', 'nose'], specialty: 'ENT' }
];

const urgentKeywords = [
  'chest pain',
  'shortness of breath',
  'difficulty breathing',
  'fainting',
  'severe bleeding',
  'stroke',
  'facial droop',
  'slurred speech',
  'one-sided weakness',
  'seizure',
  'severe allergic reaction',
  'anaphylaxis',
  'blue lips',
  'confusion',
  'suicidal'
];

const DEFAULT_DISCLAIMER =
  'This is a preliminary AI-generated suggestion and not a medical diagnosis. If you are worried or symptoms are severe/worsening, seek urgent care or contact a licensed clinician.';

function asString(value) {
  return String(value === undefined || value === null ? '' : value);
}

function clampNumber(value, min, max) {
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return Math.min(max, Math.max(min, n));
}

function normalizeSymptoms(symptoms) {
  if (Array.isArray(symptoms)) {
    return symptoms.map((item) => String(item).trim()).filter(Boolean).join(', ');
  }

  return String(symptoms || '').trim();
}

function normalizeFollowupAnswers(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const out = {};
  Object.keys(raw).forEach((k) => {
    out[String(k)] = raw[k];
  });
  return out;
}

function normalizePatientProfile(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const dob = raw.dateOfBirth ? new Date(raw.dateOfBirth) : null;
  const ageFromDob = dob && !Number.isNaN(dob.getTime())
    ? Math.max(0, new Date().getFullYear() - dob.getFullYear())
    : null;

  return {
    name: raw.name || null,
    gender: raw.gender || null,
    age: ageFromDob,
    bloodGroup: raw.bloodGroup || null
  };
}

function detectSpecialtiesFromRules(symptomText) {
  const text = symptomText.toLowerCase();
  const matched = [];

  specialtyRules.forEach((rule) => {
    if (rule.keywords.some((word) => text.includes(word))) {
      matched.push(rule.specialty);
    }
  });

  if (matched.length === 0) {
    return ['General Physician'];
  }

  return [...new Set(matched)];
}

function detectRedFlags({ symptomText, followupAnswers }) {
  const text = symptomText.toLowerCase();
  const flags = [];
  const yn = (id) => {
    const v = followupAnswers[id];
    if (v === true) return true;
    const s = String(v || '').toLowerCase().trim();
    return s === 'yes' || s === 'true' || s === '1';
  };

  if (urgentKeywords.some((w) => text.includes(w))) flags.push('Urgent symptom keyword detected in text');
  if (yn('redflag_chest_pain')) flags.push('Chest pain/pressure');
  if (yn('redflag_breathing')) flags.push('Severe shortness of breath / trouble breathing');
  if (yn('redflag_stroke')) flags.push('Stroke-like symptoms (face/arm/speech)');
  if (yn('redflag_bleeding')) flags.push('Severe bleeding');
  if (yn('redflag_fainting')) flags.push('Fainting / near-fainting');
  if (yn('redflag_confusion')) flags.push('New confusion');
  if (yn('redflag_seizure')) flags.push('Seizure');
  if (yn('redflag_allergy')) flags.push('Severe allergic reaction');
  if (yn('redflag_suicidal')) flags.push('Self-harm / suicidal thoughts');

  const fever = clampNumber(followupAnswers.temperature_c, 34, 45);
  if (fever !== null && fever >= 40) flags.push('Very high fever (≥ 40°C)');

  return {
    emergencyWarning: flags.length > 0,
    redFlags: flags
  };
}

function baseQuestion(id, prompt, type, required, options) {
  const q = { id, prompt, type, required: Boolean(required) };
  if (options) q.options = options;
  return q;
}

function getFollowupQuestions(symptomText) {
  const t = symptomText.toLowerCase();
  const questions = [];

  // Always-valuable basics
  questions.push(baseQuestion('duration_days', 'How many days have you had these symptoms?', 'number', true));
  questions.push(baseQuestion('severity_1_10', 'Overall severity (1–10)?', 'number', true));

  // Fever / infection-like
  if (t.includes('fever') || t.includes('cold') || t.includes('cough') || t.includes('flu') || t.includes('sore throat')) {
    questions.push(baseQuestion('temperature_c', 'Highest temperature (°C), if known', 'number', false));
  }

  // Respiratory
  if (t.includes('breath') || t.includes('cough') || t.includes('asthma') || t.includes('wheeze') || t.includes('chest')) {
    questions.push(baseQuestion('redflag_breathing', 'Are you struggling to breathe (at rest) or lips turning blue?', 'yesno', true));
  }

  // Chest pain
  if (t.includes('chest') || t.includes('heart') || t.includes('palpitation')) {
    questions.push(baseQuestion('redflag_chest_pain', 'Do you have chest pain/pressure that is severe or spreading to arm/jaw?', 'yesno', true));
  }

  // Neuro
  if (t.includes('stroke') || t.includes('weak') || t.includes('numb') || t.includes('speech') || t.includes('seizure') || t.includes('confusion') || t.includes('headache')) {
    questions.push(baseQuestion('redflag_stroke', 'Any face droop, one‑sided weakness, or trouble speaking?', 'yesno', true));
    questions.push(baseQuestion('redflag_confusion', 'New confusion or extreme drowsiness?', 'yesno', false));
    questions.push(baseQuestion('redflag_seizure', 'Any seizure activity?', 'yesno', false));
  }

  // GI
  if (t.includes('diarrhea') || t.includes('vomit') || t.includes('vomiting') || t.includes('abdomen') || t.includes('stomach')) {
    questions.push(baseQuestion('dehydration', 'Signs of dehydration (very dry mouth, dizziness, not peeing)?', 'yesno', false));
    questions.push(baseQuestion('blood_in_stool', 'Any blood in stool or vomit?', 'yesno', false));
  }

  // Bleeding
  if (t.includes('bleed') || t.includes('blood')) {
    questions.push(baseQuestion('redflag_bleeding', 'Is the bleeding severe or hard to stop?', 'yesno', true));
  }

  // Allergy
  if (t.includes('rash') || t.includes('swelling') || t.includes('hives')) {
    questions.push(baseQuestion('redflag_allergy', 'Any swelling of lips/tongue/face or trouble breathing after an allergen?', 'yesno', false));
  }

  // Mental health
  if (t.includes('depress') || t.includes('panic') || t.includes('anxiety') || t.includes('suicid')) {
    questions.push(baseQuestion('redflag_suicidal', 'Are you having thoughts of harming yourself?', 'yesno', true));
  }

  // Pregnancy (only ask if female/unknown; UI can skip if not relevant)
  questions.push(baseQuestion('pregnant', 'Are you pregnant (or could you be)?', 'yesno', false));

  // Filter duplicates by id
  const seen = new Set();
  return questions.filter((q) => {
    if (seen.has(q.id)) return false;
    seen.add(q.id);
    return true;
  });
}

function missingRequiredAnswers(questions, followupAnswers) {
  return questions
    .filter((q) => q.required)
    .filter((q) => {
      const v = followupAnswers[q.id];
      if (v === undefined || v === null) return true;
      const s = String(v).trim();
      return s.length === 0;
    })
    .map((q) => q.id);
}

function computeWhenToSeeDoctor({ triageLevel, emergencyWarning, durationDays, severity }) {
  if (emergencyWarning || triageLevel === 'high') return 'Now / Emergency care';
  if ((severity || 0) >= 8) return 'Today (urgent clinic)';
  if ((durationDays || 0) >= 7) return 'Within 24–48 hours';
  return 'Within 3–7 days (or sooner if worse)';
}

function buildDoctorSummary({ symptomText, age, gender, additionalContext, followupAnswers, redFlags }) {
  const parts = [];
  parts.push(`Symptoms: ${symptomText}`);
  if (age || gender) parts.push(`Patient: ${age ? `${age}y` : 'age ?'}, ${gender || 'gender ?'}`);
  if (followupAnswers.duration_days) parts.push(`Duration: ${followupAnswers.duration_days} day(s)`);
  if (followupAnswers.severity_1_10) parts.push(`Severity: ${followupAnswers.severity_1_10}/10`);
  if (followupAnswers.temperature_c) parts.push(`Temp: ${followupAnswers.temperature_c}°C`);
  if (additionalContext) parts.push(`Context: ${String(additionalContext).trim()}`);
  if (redFlags.length) parts.push(`Red flags: ${redFlags.join('; ')}`);
  return parts.join(' | ');
}

function normalizeSpecialtyForSearch(value) {
  const s = asString(value).trim();
  if (!s) return '';
  // Keep the first specialty when we have "A / B"
  return s.split('/')[0].trim();
}

function buildSafeHomeCare({ symptomText }) {
  const t = symptomText.toLowerCase();
  const advice = [];
  advice.push('Rest and stay well hydrated.');
  advice.push('Monitor symptom changes (worsening, new symptoms, or higher fever).');
  if (t.includes('fever') || t.includes('cold') || t.includes('flu')) {
    advice.push('Consider fever comfort measures like fluids and light clothing. Avoid combining multiple fever medicines without guidance.');
  }
  if (t.includes('cough') || t.includes('sore throat')) {
    advice.push('Warm fluids and honey (if age-appropriate) may soothe throat irritation.');
  }
  if (t.includes('diarrhea') || t.includes('vomit')) {
    advice.push('Use oral rehydration solutions if you are losing fluids.');
  }
  return advice.slice(0, 6);
}

function buildStructuredFallback({ symptomText, age, gender, additionalContext, followupAnswers, patientProfile }) {
  const specialties = detectSpecialtiesFromRules(symptomText);
  const lower = symptomText.toLowerCase();
  const urgentFromText = urgentKeywords.some((word) => lower.includes(word));
  const redFlag = detectRedFlags({ symptomText, followupAnswers });
  const triageLevel = redFlag.emergencyWarning || urgentFromText ? 'high' : 'medium';

  const durationDays = clampNumber(followupAnswers.duration_days, 0, 3650) || null;
  const severity = clampNumber(followupAnswers.severity_1_10, 1, 10) || null;

  const whenToSeeDoctor = computeWhenToSeeDoctor({
    triageLevel,
    emergencyWarning: redFlag.emergencyWarning,
    durationDays,
    severity
  });

  const primarySpecialty = normalizeSpecialtyForSearch(specialties[0]);
  const doctorSummary = buildDoctorSummary({
    symptomText,
    age,
    gender,
    additionalContext,
    followupAnswers,
    redFlags: redFlag.redFlags
  });

  return {
    source: 'rule-based-fallback',
    disclaimer: DEFAULT_DISCLAIMER,
    needsMoreInfo: false,
    questionsToAskNext: [],
    emergencyWarning: redFlag.emergencyWarning,
    redFlags: redFlag.redFlags,
    triageLevel,
    whenToSeeDoctor,
    summary: redFlag.emergencyWarning
      ? 'Some answers suggest a possible emergency. Please seek immediate medical care.'
      : 'This looks non-emergency, but a clinician review is recommended.',
    possibleConditions: redFlag.emergencyWarning
      ? ['Potential emergency condition (requires clinician evaluation)']
      : ['General viral illness', 'Inflammatory condition', 'Lifestyle-related trigger'],
    recommendedSpecialties: specialties,
    likelySpecialties: specialties.map((s, idx) => ({ specialty: s, score: Math.max(0.2, 1 - idx * 0.15) })),
    primarySpecialty,
    recommendedNextSteps: [
      redFlag.emergencyWarning ? 'Seek emergency care now.' : `Book an appointment: ${primarySpecialty || specialties[0] || 'General Physician'}.`,
      'Track symptom duration, severity, and triggers.',
      'If symptoms worsen suddenly, seek urgent care.'
    ],
    homeCareAdvice: redFlag.emergencyWarning ? [] : buildSafeHomeCare({ symptomText }),
    doctorSummary,
    inputEcho: {
      symptoms: symptomText,
      age: age || null,
      gender: gender || null,
      additionalContext: additionalContext || null,
      followupAnswers: followupAnswers || {},
      patientProfile: patientProfile || null
    }
  };
}

function buildNeedsMoreInfoResponse({ symptomText, age, gender, additionalContext, followupAnswers, patientProfile, questions, missing }) {
  const specialties = detectSpecialtiesFromRules(symptomText);
  const redFlag = detectRedFlags({ symptomText, followupAnswers });
  const triageLevel = redFlag.emergencyWarning ? 'high' : 'medium';
  const doctorSummary = buildDoctorSummary({
    symptomText,
    age,
    gender,
    additionalContext,
    followupAnswers,
    redFlags: redFlag.redFlags
  });

  return {
    source: 'followup-needed',
    disclaimer: DEFAULT_DISCLAIMER,
    needsMoreInfo: true,
    missingAnswerIds: missing,
    questionsToAskNext: questions,
    emergencyWarning: redFlag.emergencyWarning,
    redFlags: redFlag.redFlags,
    triageLevel,
    whenToSeeDoctor: redFlag.emergencyWarning ? 'Now / Emergency care' : 'After answering a few questions',
    summary: redFlag.emergencyWarning
      ? 'Some symptoms/answers may be urgent. Please seek immediate care. If safe, you can still answer the questions to help summarize for a doctor.'
      : 'Please answer a few quick questions so we can provide a safer recommendation.',
    possibleConditions: [],
    recommendedSpecialties: specialties,
    likelySpecialties: specialties.map((s, idx) => ({ specialty: s, score: Math.max(0.2, 1 - idx * 0.15) })),
    primarySpecialty: normalizeSpecialtyForSearch(specialties[0]),
    recommendedNextSteps: redFlag.emergencyWarning
      ? ['Seek emergency care now.', 'If possible, share the doctor summary with a clinician.']
      : ['Answer the follow-up questions.', 'If symptoms worsen, seek urgent care.'],
    homeCareAdvice: [],
    doctorSummary,
    inputEcho: {
      symptoms: symptomText,
      age: age || null,
      gender: gender || null,
      additionalContext: additionalContext || null,
      followupAnswers: followupAnswers || {},
      patientProfile: patientProfile || null
    }
  };
}

function buildFallbackAnalysis({ symptomText, age, gender, additionalContext, followupAnswers, patientProfile }) {
  return buildStructuredFallback({ symptomText, age, gender, additionalContext, followupAnswers, patientProfile });
}

async function callOpenAIModel({ symptomText, age, gender, additionalContext }) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) return null;

  const systemPrompt =
    'You are a clinical triage assistant. Provide concise, safe, non-diagnostic preliminary guidance in JSON only. Never provide drug dosing. If emergency signs are present, recommend urgent care.';

  const userPrompt = `
Patient symptom input:
- Symptoms: ${symptomText}
- Age: ${age || 'unknown'}
- Gender: ${gender || 'unknown'}
- Additional context: ${additionalContext || 'none'}

Return valid JSON with keys:
source, disclaimer, summary, possibleConditions (array), recommendedSpecialties (array), triageLevel (low|medium|high), recommendedNextSteps (array), homeCareAdvice (array), whenToSeeDoctor (string), doctorSummary (string).
`;

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    }
  );

  const raw = response?.data?.choices?.[0]?.message?.content;
  if (!raw) return null;

  const parsed = JSON.parse(raw);
  parsed.source = `openai-${model}`;
  return parsed;
}

async function callGeminiModel({ symptomText, age, gender, additionalContext }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  if (!apiKey) return null;

  const prompt = `
You are a clinical triage assistant. Provide concise, safe, non-diagnostic preliminary guidance. Never provide drug dosing. If emergency signs are present, recommend urgent care.

Patient symptom input:
- Symptoms: ${symptomText}
- Age: ${age || 'unknown'}
- Gender: ${gender || 'unknown'}
- Additional context: ${additionalContext || 'none'}

Return ONLY valid JSON with keys:
source, disclaimer, summary, possibleConditions (array), recommendedSpecialties (array), triageLevel (low|medium|high), recommendedNextSteps (array), homeCareAdvice (array), whenToSeeDoctor (string), doctorSummary (string).
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await axios.post(
    url,
    {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    },
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    }
  );

  const raw = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) return null;

  const parsed = JSON.parse(raw);
  parsed.source = `gemini-${model}`;
  return parsed;
}

async function analyzeSymptoms(payload) {
  const symptomText = normalizeSymptoms(payload.symptoms);
  if (!symptomText) {
    throw new Error('Symptoms are required');
  }

  const followupAnswers = normalizeFollowupAnswers(payload.followupAnswers);
  const patientProfile = normalizePatientProfile(payload.patientProfile);
  const resolvedAge = payload.age ?? patientProfile?.age ?? null;
  const resolvedGender = payload.gender ?? patientProfile?.gender ?? null;
  const additionalContext = payload.additionalContext;

  const questions = getFollowupQuestions(symptomText);
  const missing = missingRequiredAnswers(questions, followupAnswers);
  if (missing.length > 0) {
    return buildNeedsMoreInfoResponse({
      symptomText,
      age: resolvedAge,
      gender: resolvedGender,
      additionalContext,
      followupAnswers,
      patientProfile,
      questions,
      missing
    });
  }

  try {
    const aiResult =
      (await callGeminiModel({
        symptomText,
        age: resolvedAge,
        gender: resolvedGender,
        additionalContext
      })) ||
      (await callOpenAIModel({
        symptomText,
        age: resolvedAge,
        gender: resolvedGender,
        additionalContext
      }));

    if (aiResult) {
      const redFlag = detectRedFlags({ symptomText, followupAnswers });
      const triageLevel = redFlag.emergencyWarning ? 'high' : (aiResult.triageLevel || 'medium');
      const durationDays = clampNumber(followupAnswers.duration_days, 0, 3650) || null;
      const severity = clampNumber(followupAnswers.severity_1_10, 1, 10) || null;
      const whenToSeeDoctor = aiResult.whenToSeeDoctor || computeWhenToSeeDoctor({
        triageLevel,
        emergencyWarning: redFlag.emergencyWarning,
        durationDays,
        severity
      });

      const specialtiesFromAI = Array.isArray(aiResult.recommendedSpecialties) && aiResult.recommendedSpecialties.length
        ? aiResult.recommendedSpecialties
        : detectSpecialtiesFromRules(symptomText);

      const primarySpecialty = normalizeSpecialtyForSearch(specialtiesFromAI[0] || '');
      const doctorSummary = aiResult.doctorSummary || buildDoctorSummary({
        symptomText,
        age: resolvedAge,
        gender: resolvedGender,
        additionalContext,
        followupAnswers,
        redFlags: redFlag.redFlags
      });

      return {
        source: aiResult.source || 'ai',
        disclaimer: aiResult.disclaimer || DEFAULT_DISCLAIMER,
        needsMoreInfo: false,
        questionsToAskNext: [],
        emergencyWarning: redFlag.emergencyWarning,
        redFlags: redFlag.redFlags,
        triageLevel,
        whenToSeeDoctor,
        summary: redFlag.emergencyWarning
          ? 'Some answers suggest a possible emergency. Please seek immediate medical care.'
          : (aiResult.summary || 'A clinician review is recommended.'),
        possibleConditions: Array.isArray(aiResult.possibleConditions) ? aiResult.possibleConditions : [],
        recommendedSpecialties: specialtiesFromAI,
        likelySpecialties: specialtiesFromAI.map((s, idx) => ({ specialty: s, score: Math.max(0.2, 1 - idx * 0.15) })),
        primarySpecialty,
        recommendedNextSteps: Array.isArray(aiResult.recommendedNextSteps) && aiResult.recommendedNextSteps.length
          ? aiResult.recommendedNextSteps
          : buildStructuredFallback({ symptomText, age: resolvedAge, gender: resolvedGender, additionalContext, followupAnswers, patientProfile }).recommendedNextSteps,
        homeCareAdvice: redFlag.emergencyWarning ? [] : (Array.isArray(aiResult.homeCareAdvice) ? aiResult.homeCareAdvice : buildSafeHomeCare({ symptomText })),
        doctorSummary,
        inputEcho: {
          symptoms: symptomText,
          age: resolvedAge || null,
          gender: resolvedGender || null,
          additionalContext: additionalContext || null,
          followupAnswers: followupAnswers || {},
          patientProfile: patientProfile || null
        }
      };
    }
  } catch (error) {
    console.warn('AI provider unavailable, using fallback:', error.message);
  }

  return buildFallbackAnalysis({
    symptomText,
    age: resolvedAge,
    gender: resolvedGender,
    additionalContext,
    followupAnswers,
    patientProfile
  });
}

module.exports = {
  analyzeSymptoms
};
