const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3006;

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully for Video Service'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'video-service' });
});

app.use('/video', require('./routes/videoRoutes'));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Video Service running on port ${PORT}`);
});
