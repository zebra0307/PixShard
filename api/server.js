require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

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
