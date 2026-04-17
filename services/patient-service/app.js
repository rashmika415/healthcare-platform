const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const helmet   = require('helmet');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ── Health check ──────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'patient-service' });
});

// ── Routes ────────────────────────────────────────────
app.use('/patients', require('./routes/patientRoutes'));

// ── Error Handling Middleware ─────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  if (err.message && err.message.includes('request aborted')) {
    return res.status(400).json({ error: 'Request aborted' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Connect MongoDB then start ────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected — patientdb');
    app.listen(PORT, () => {
      console.log(`✅ Patient Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  })