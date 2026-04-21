require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/public_datas', express.static(path.join(__dirname, 'public_datas')));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/share', require('./routes/shareRoutes'));

app.get('/api/health', (_req, res) => res.json({ status: 'PixShard API running' }));

module.exports = app;
