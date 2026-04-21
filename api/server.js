require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow non-browser requests (Postman, Render health checks) and whitelisted origins
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static file serving (individual share downloads) ─────────────────────────
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/public_datas', express.static(path.join(__dirname, 'public_datas')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/share', require('./routes/shareRoutes'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'PixShard API running' }));

// ── MongoDB connection ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pixshard';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✓ MongoDB connected');
    const server = app.listen(PORT, () =>
      console.log(`✓ PixShard API listening on http://localhost:${PORT}`)
    );
    // Allow up to 10 minutes for large Essential SSS encryption jobs
    server.timeout = 10 * 60 * 1000;
    server.keepAliveTimeout = 10 * 60 * 1000;
  })
  .catch((err) => {
    console.error('✗ MongoDB connection failed:', err.message);
    process.exit(1);
  });
