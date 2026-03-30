const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const helmet    = require('helmet');

const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
require('dotenv').config();
const adminRoutes = require('./routes/adminRoutes');
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

// ── Authenticated doctor availability for logged-in doctor
// GET /doctor/availability/me -> /availability/me (requires login)
app.use('/doctor/availability/me',
  authMiddleware,
  createProxyMiddleware({
    target: process.env.DOCTOR_SERVICE_URL || 'http://localhost:3002',
    changeOrigin: true,
    pathRewrite: (path) => `/availability/me`,
    proxyTimeout: 15000,
    timeout: 15000,
    on: {
      proxyReq: (proxyReq, req, res) => {
        if (req.headers['x-user-id']) {
          proxyReq.setHeader('x-user-id', req.headers['x-user-id']);
          proxyReq.setHeader('x-user-role', req.headers['x-user-role']);
          proxyReq.setHeader('x-user-email', req.headers['x-user-email']);
          proxyReq.setHeader('x-user-name', req.headers['x-user-name']);
          const verified = req.headers['x-user-verified'];
          if (verified !== undefined && verified !== null) {
            proxyReq.setHeader('x-user-verified', verified);
          }
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

// ── Public doctor availability (no token)
// Used by patients / appointment service to view a doctor's active slots
app.use('/doctor/availability',
  createProxyMiddleware({
    target: process.env.DOCTOR_SERVICE_URL || 'http://localhost:3002',
    changeOrigin: true,
    // Express strips the mount path (/doctor/availability) from req.url,
    // so here `path` is like "/?day=Monday" or "/:doctorId" etc.
    pathRewrite: (path) => `/availability${path}`,
    proxyTimeout: 15000,
    timeout: 15000,
    on: {
      proxyReq: (proxyReq, req, res) => {
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

app.use('/patients',
  authMiddleware,
  createProxyMiddleware({
    target: process.env.PATIENT_SERVICE_URL,
    changeOrigin: true,
    // Preserve /patients prefix because patient-service mounts routes at /patients
    pathRewrite: (path) => `/patients${path}`,
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
    // Express strips the mount path (/video) from req.url, but video-service
    // mounts routes at /video. Re-add the prefix so /video/sessions/* matches.
    pathRewrite: (path) => `/video${path}`,
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


// Parse request body for routes that are handled inside gateway.
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);




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