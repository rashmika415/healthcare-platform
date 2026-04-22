const express = require('express');
const { analyzeSymptoms } = require('../services/analysisService');

const router = express.Router();

router.post('/analyze', async (req, res) => {
  const { symptoms, age, gender, additionalContext, followupAnswers, patientProfile } = req.body || {};

  if (!symptoms || (Array.isArray(symptoms) && symptoms.length === 0)) {
    return res.status(400).json({ error: 'Symptoms are required' });
  }

  try {
    const analysis = await analyzeSymptoms({
      symptoms,
      age,
      gender,
      additionalContext,
      followupAnswers,
      patientProfile
    });

    return res.status(200).json(analysis);
  } catch (error) {
    console.error('Symptom analysis failed:', error.message);
    return res.status(500).json({
      error: 'Unable to analyze symptoms right now. Please try again later.'
    });
  }
});

module.exports = router;
