// services/doctor/app.js
require('dotenv').config({ path: __dirname + '/.env' });

const express = require("express");
const mongoose = require("mongoose");

const app = express();

// ── Middleware ─────────────────────────
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('[REQUEST] headers:', {
    'x-user-id': req.headers['x-user-id'],
    'x-user-role': req.headers['x-user-role'],
    'x-user-email': req.headers['x-user-email'],
    'x-user-name': req.headers['x-user-name'],
    'content-type': req.headers['content-type'],
    'content-length': req.headers['content-length']
  });
  console.log('[REQUEST] body:', req.body);
  next();
});

// Import routes
const doctorRoutes = require('./routes/doctorRoutes');

// ── Mongoose configuration ─────────────────────────
mongoose.set('strictQuery', true);
mongoose.set('bufferCommands', false); // Fail fast if DB not connected

// MongoDB connection options
const mongoOptions = {
  serverSelectionTimeoutMS: 10000, // 10 seconds
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  retryWrites: true,
  w: 'majority'
};

// MongoDB logs
mongoose.connection.on('connecting', () => console.log('🔄 MongoDB connecting...'));
mongoose.connection.on('connected', () => console.log('✅ MongoDB connected successfully 🎉'));
mongoose.connection.on('error', (err) => console.error('❌ MongoDB connection error:', err));
mongoose.connection.on('disconnected', () => console.warn('⚠️ MongoDB disconnected'));

// ── Routes (define BEFORE start) ─────────────────────────
app.get('/', (req, res) => {
  res.send('Doctor Service is running...');
});

// Gateway: /doctor/profile → Service: /profile
app.use('/', doctorRoutes);

// DB health check
app.get('/db-health', (req, res) => {
  const state = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({ status: states[state] || 'unknown', readyState: state });
});

// ── Error Handling Middleware ─────────────────────────
// Handle parsing errors (malformed JSON, aborted requests, etc.)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  if (err.message && err.message.includes('request aborted')) {
    return res.status(400).json({ error: 'Request aborted' });
  }
  // Log unexpected errors
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Connect MongoDB THEN start server ─────────────────────────
const PORT = process.env.PORT || 3002;

const doctorMongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/doctordb';
if (!process.env.MONGO_URI) {
  console.warn('⚠️ MONGO_URI not set; using default local mongodb://localhost:27017/doctordb');
}

mongoose.connect(doctorMongoUri, mongoOptions)
  .then(() => {
    console.log('✅ MongoDB connected — doctordb');

    app.listen(PORT, () => {
      console.log(`🚀 Doctor Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    // keep server alive to return service-unavailable instead of exiting
    app.listen(PORT, () => {
      console.log(`🚀 Doctor Service running on port ${PORT} in degraded mode`);
    });
  });