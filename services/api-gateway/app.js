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
// Keep proxy routes before body parsing to avoid consumed request streams.
// JSON parsing is enabled later for gateway-owned routes like /auth.

// ── Public routes (no token needed) ──────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

// NOTE:
// Do not parse JSON globally before proxy routes; that can consume request bodies
// and cause downstream services to hang waiting for body bytes.

// ── Protected routes (token required) ────────────────
// authMiddleware runs first → if valid → proxy to service
app.use('/patients',
  authMiddleware,
  createProxyMiddleware({
    target: process.env.PATIENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => path.replace(/^\/patients/, ''),
    on: {
      proxyReq: (proxyReq, req, res) => {
        fixRequestBody(proxyReq, req, res);
      }
    }
  })
);

app.use('/doctor',
  authMiddleware,
  createProxyMiddleware({
    target: process.env.DOCTOR_SERVICE_URL || 'http://localhost:3002',
    changeOrigin: true,
    pathRewrite: { '^/doctor': '' },
    proxyTimeout: 15000,
    timeout: 15000,
    on: {
      proxyReq: (proxyReq, req, res) => {
        // Forward user info headers set by authMiddleware
        if (req.headers['x-user-id']) {
          proxyReq.setHeader('x-user-id', req.headers['x-user-id']);
          proxyReq.setHeader('x-user-role', req.headers['x-user-role']);
          proxyReq.setHeader('x-user-email', req.headers['x-user-email']);
          proxyReq.setHeader('x-user-name', req.headers['x-user-name']);
        }
        fixRequestBody(proxyReq, req, res);
      },
      error: (err, req, res) => {
        console.error('Proxy error:', err);
        if (!res.headersSent) {
          res.status(503).json({ error: 'Doctor service unavailable', details: err.message });
        }
      }
    }
  })
);

app.use('/video',
  authMiddleware,
  createProxyMiddleware({
    target: process.env.VIDEO_SERVICE_URL || 'http://localhost:3006',
    changeOrigin: true,
    pathRewrite: { '^/video': '' },
    proxyTimeout: 15000,
    timeout: 15000,
    on: {
      proxyReq: (proxyReq, req, res) => {
        if (req.headers['x-user-id']) {
          proxyReq.setHeader('x-user-id', req.headers['x-user-id']);
          proxyReq.setHeader('x-user-role', req.headers['x-user-role']);
          proxyReq.setHeader('x-user-email', req.headers['x-user-email']);
          proxyReq.setHeader('x-user-name', req.headers['x-user-name']);
        }
        fixRequestBody(proxyReq, req, res);
      },
      error: (err, req, res) => {
        console.error('Proxy error:', err);
        if (!res.headersSent) {
          res.status(503).json({ error: 'Video service unavailable', details: err.message });
        }
      }
    }
  })
);
app.use('/auth', express.json({ limit: '50mb' }), authRoutes);
// This means:
// POST /auth/register → goes to authRoutes
// POST /auth/login    → goes to authRoutes
// GET  /auth/me       → goes to authRoutes

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