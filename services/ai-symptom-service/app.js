const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const symptomRoutes = require('./routes/symptomRoutes');

const app = express();
const PORT = process.env.PORT || 3007;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-symptom-service' });
});

app.use('/symptom-checker', symptomRoutes);

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`AI Symptom Service running on port ${PORT}`);
});
