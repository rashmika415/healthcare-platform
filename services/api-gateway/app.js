const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const helmet    = require('helmet');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
require('dotenv').config();

const authRoutes     = require('./routes/authRoutes');
const authMiddleware = require('./middleware/authMiddleware');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Global middleware ─────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// ── Public routes (no token needed) ──────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

app.use('/auth', authRoutes);
// This means:
// POST /auth/register → goes to authRoutes
// POST /auth/login    → goes to authRoutes
// GET  /auth/me       → goes to authRoutes

// ── Protected routes (token required) ────────────────
// authMiddleware runs first → if valid → proxy to service
app.use('/patients',
  authMiddleware,
  createProxyMiddleware({
    target: process.env.PATIENT_SERVICE_URL,
    changeOrigin: true,
    onProxyReq: fixRequestBody
  })
);


// ── Connect MongoDB then start server ─────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected — authdb');
    app.listen(PORT, () => {
      console.log(`✅ API Gateway running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });