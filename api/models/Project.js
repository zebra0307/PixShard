const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    // Firebase UID (string) — replaces MongoDB ObjectId reference
    ownerID: { type: String, required: true, index: true },

    originalImageName: { type: String, required: true },
    schemeType: { type: String, enum: ['Standard', 'Essential'], required: true },
    k: { type: Number, required: true },
    n: { type: Number, required: true },
    t: { type: Number, default: null },
    shareFiles:     [{ type: String }],
    sharesDir:      { type: String },
    publicDataDir:  { type: String },
    status: { type: String, enum: ['processing', 'ready', 'failed'], default: 'processing' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
