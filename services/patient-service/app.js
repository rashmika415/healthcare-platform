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
app.use(express.json());

// ── Health check ──────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'patient-service' });
});

// ── Routes ────────────────────────────────────────────
app.use('/patients', require('./routes/patientRoutes'));

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