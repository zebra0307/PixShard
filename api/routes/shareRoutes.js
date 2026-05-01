const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { v4: uuidv4 } = require('uuid');

const { protect } = require('../middleware/authMiddleware');
const { runPythonScript } = require('../utils/pythonBridge');
const Project = require('../models/Project');

const router = express.Router();

// ── Multer: image uploads (encrypt) ──────────────────────────────────────────
const upload = multer({
  dest: path.join(__dirname, '../uploads/'),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|bmp|gif/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  },
});

// ── Multer: share files upload (decrypt) ─────────────────────────────────────
const uploadAny = multer({
  dest: path.join(__dirname, '../uploads/'),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB for large .npy
});


// ── Paths ─────────────────────────────────────────────────────────────────────
// Resolve LOGIC_DIR relative to api/ root (parent of routes/), NOT api/routes/
const API_ROOT   = path.resolve(__dirname, '..');
const LOGIC_DIR  = process.env.LOGIC_DIR
  ? path.resolve(API_ROOT, process.env.LOGIC_DIR)
  : path.resolve(API_ROOT, './logic');
const IMAGES_DIR = path.join(API_ROOT, 'images');
const PUBLIC_DIR = path.join(API_ROOT, 'public_datas');
const STANDARD_ENCRYPT_SCRIPT = path.join(LOGIC_DIR, 'standard_encrypt.py');
const ESSENTIAL_ENCRYPT_SCRIPT = path.join(LOGIC_DIR, 'essential_encrypt.py');
const STANDARD_DECRYPT_SCRIPT = path.join(LOGIC_DIR, 'standard_decrypt.py');
const ESSENTIAL_DECRYPT_SCRIPT = path.join(LOGIC_DIR, 'essential_decrypt.py');

// Log resolved paths on startup (helps debug)
console.log('[PixShard] LOGIC_DIR resolved to:', LOGIC_DIR);
console.log('[PixShard] standard_encrypt.py exists:', fs.existsSync(STANDARD_ENCRYPT_SCRIPT));
console.log('[PixShard] essential_encrypt.py exists:', fs.existsSync(ESSENTIAL_ENCRYPT_SCRIPT));
console.log('[PixShard] standard_decrypt.py exists:', fs.existsSync(STANDARD_DECRYPT_SCRIPT));
console.log('[PixShard] essential_decrypt.py exists:', fs.existsSync(ESSENTIAL_DECRYPT_SCRIPT));


// ── Helper: ZIP a directory and pipe to response ──────────────────────────────
const streamZip = (res, sourceDir, zipName) => {
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
  const archive = archiver('zip', { zlib: { level: 6 } });
  archive.on('error', (err) => res.status(500).end(err.message));
  archive.pipe(res);
  archive.directory(sourceDir, false);
  archive.finalize();
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/share/create
// Body (multipart): image, schemeType, k, n, [t]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post('/create', protect, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Image file required' });

  const { schemeType, k, n, t } = req.body;
  const kNum = parseInt(k), nNum = parseInt(n), tNum = t ? parseInt(t) : null;

  if (!schemeType || !kNum || !nNum)
    return res.status(400).json({ message: 'schemeType, k, and n are required' });
  if (!['Standard', 'Essential'].includes(schemeType))
    return res.status(400).json({ message: 'schemeType must be Standard or Essential' });
  if (schemeType === 'Essential' && !tNum)
    return res.status(400).json({ message: 't is required for Essential scheme' });

  // Create a unique project ID and per-project directories
  const projectId = uuidv4();
  const sharesDir = path.join(IMAGES_DIR, projectId);
  const pubDir    = path.join(PUBLIC_DIR, projectId);
  fs.mkdirSync(sharesDir, { recursive: true });
  fs.mkdirSync(pubDir,    { recursive: true });

  // Persist a "processing" project to MongoDB immediately
  const project = await Project.create({
    ownerID: req.user._id,
    originalImageName: req.file.originalname,
    schemeType,
    k: kNum, n: nNum, t: tNum,
    sharesDir, publicDataDir: pubDir,
    status: 'processing',
  });

  // Select Python script based on scheme.
  const isEssential = schemeType === 'Essential';
  const encryptScript = isEssential ? ESSENTIAL_ENCRYPT_SCRIPT : STANDARD_ENCRYPT_SCRIPT;

  try {
    // ── Fix: rename multer temp file to include original extension ───────────
    // PIL identifies image format from extension when content-sniffing fails
    const origExt = path.extname(req.file.originalname).toLowerCase() || '.jpg';
    const renamedPath = req.file.path + origExt;
    fs.renameSync(req.file.path, renamedPath);

    await runPythonScript(encryptScript, [
      '--input',       renamedPath,
      '--shares_dir',  sharesDir,
      '--public_dir',  pubDir,
      '--k',           String(kNum),
      '--n',           String(nNum),
      ...(isEssential ? ['--t', String(tNum)] : []),
    ]);

    // Collect generated share filenames
    const shareFiles = fs.readdirSync(sharesDir);

    // Ensure output artifacts are complete to avoid future reconstruction failures.
    const requiredPublicFiles = isEssential
      ? ['metadata.npy', 'public_b.npy', 'matrix_A.npy']
      : [];

    for (const filename of requiredPublicFiles) {
      if (!fs.existsSync(path.join(pubDir, filename))) {
        throw new Error(`Encryption output missing required file: ${filename}`);
      }
    }

    if (!shareFiles.length) {
      throw new Error('Encryption output missing share files');
    }

    const expectedPrefix = isEssential ? 'participant_' : 'share_';
    if (shareFiles.some((name) => !name.startsWith(expectedPrefix) || !name.endsWith('.npy'))) {
      throw new Error(`Unexpected share filenames for ${schemeType} scheme`);
    }

    // Update project as ready
    project.shareFiles = shareFiles;
    project.status = 'ready';
    await project.save();

    // Clean up temp upload
    if (fs.existsSync(renamedPath)) fs.unlinkSync(renamedPath);

    res.status(201).json({ message: 'Encryption complete', project });
  } catch (err) {
    project.status = 'failed';
    await project.save();
    // Clean up regardless
    const renamedPath = req.file.path + (path.extname(req.file.originalname) || '.jpg');
    [req.file.path, renamedPath].forEach(p => { try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch {} });
    console.error('[PixShard] Encryption error:', err.message);
    res.status(500).json({ message: 'Python encryption failed', error: err.message });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/share  — list current user's projects
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/', protect, async (req, res) => {
  const projects = await Project.find({ ownerID: req.user._id }).sort({ createdAt: -1 });
  res.json(projects);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/share/download-shares/:id  — ZIP all share files
// MUST be before /:id wildcard to avoid Express swallowing the path segment
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/download-shares/:id', protect, async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, ownerID: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (project.status !== 'ready') return res.status(400).json({ message: 'Project not ready' });
  streamZip(res, project.sharesDir, `pixshard_shares_${req.params.id}.zip`);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/share/download-public/:id  — ZIP public data directory
// MUST be before /:id wildcard
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/download-public/:id', protect, async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, ownerID: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (project.status !== 'ready') return res.status(400).json({ message: 'Project not ready' });
  streamZip(res, project.publicDataDir, `pixshard_public_${req.params.id}.zip`);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/share/download-file/:id/:filename  — individual file download
// Searches both sharesDir and publicDataDir for the requested filename
// MUST be before /:id wildcard
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/download-file/:id/:filename', protect, async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, ownerID: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const filename = path.basename(req.params.filename); // sanitize
  const candidates = [
    path.join(project.sharesDir, filename),
    path.join(project.publicDataDir, filename),
  ];
  const found = candidates.find(fs.existsSync);
  if (!found) return res.status(404).json({ message: 'File not found' });

  res.download(found, filename);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/share/:id  — single project (wildcard — MUST be after all named GET routes)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/:id', protect, async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, ownerID: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DELETE /api/share/:id  — delete project + files
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.delete('/:id', protect, async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, ownerID: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });

  // Remove share + public data directories
  [project.sharesDir, project.publicDataDir].forEach((dir) => {
    if (dir && fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  });
  await project.deleteOne();
  res.json({ message: 'Project deleted' });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/share/reconstruct
// Body (multipart):
//   schemeType — Standard | Essential
//   metadata  — metadata.npy  (essential)
//   public_b  — public_b.npy  (essential)
//   matrix_A  — matrix_A.npy  (essential)
//   shares[]  — participant .npy files
//   indices   — "1,2,3"
// Returns: image/png blob
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post(
  '/reconstruct',
  protect,
  uploadAny.fields([
    { name: 'metadata', maxCount: 1 },
    { name: 'public_b', maxCount: 1 },
    { name: 'matrix_A', maxCount: 1 },
    { name: 'shares',   maxCount: 20 },
  ]),
  async (req, res) => {
    const sessionId = uuidv4();
    const sessionDir = path.join(__dirname, `../uploads/session_${sessionId}`);
    const sharesDir  = path.join(sessionDir, 'shares');
    const pubDir     = path.join(sessionDir, 'public');
    const outFile    = path.join(sessionDir, 'reconstructed.png');

    fs.mkdirSync(sharesDir, { recursive: true });
    fs.mkdirSync(pubDir,    { recursive: true });

    const cleanup = () => {
      if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
    };

    try {
      const { schemeType } = req.body;
      if (!['Standard', 'Essential'].includes(schemeType)) {
        return res.status(400).json({ message: 'schemeType must be Standard or Essential' });
      }

      const isEssential = schemeType === 'Essential';

      if (isEssential) {
        if (!req.files?.metadata?.[0] || !req.files?.public_b?.[0] || !req.files?.matrix_A?.[0]) {
          return res.status(400).json({
            message: 'Essential reconstruction requires metadata.npy, public_b.npy, and matrix_A.npy',
          });
        }

        const metadataName = req.files.metadata[0].originalname.toLowerCase();
        const publicBName = req.files.public_b[0].originalname.toLowerCase();
        const matrixAName = req.files.matrix_A[0].originalname.toLowerCase();

        if (!metadataName.endsWith('.npy') || !publicBName.endsWith('.npy') || !matrixAName.endsWith('.npy')) {
          return res.status(400).json({ message: 'Essential public files must be .npy files' });
        }

        fs.renameSync(req.files.metadata[0].path, path.join(pubDir, 'metadata.npy'));
        fs.renameSync(req.files.public_b[0].path, path.join(pubDir, 'public_b.npy'));
        fs.renameSync(req.files.matrix_A[0].path, path.join(pubDir, 'matrix_A.npy'));
      } else {
        // Standard scheme does not use public metadata files.
        ['metadata', 'public_b', 'matrix_A'].forEach((fieldName) => {
          const file = req.files?.[fieldName]?.[0];
          if (file?.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }

      // Move all share files, restoring their original names
      if (!req.files?.shares?.length)
        return res.status(400).json({ message: 'At least one share file is required' });

      const hasInvalidShare = req.files.shares.some((shareFile) => !shareFile.originalname.toLowerCase().endsWith('.npy'));
      if (hasInvalidShare) {
        return res.status(400).json({ message: 'Share files must be .npy files' });
      }

      const expectedShareRegex = isEssential ? /^participant_\d+\.npy$/i : /^share_\d+\.npy$/i;
      const hasUnexpectedShareName = req.files.shares.some((shareFile) => !expectedShareRegex.test(shareFile.originalname));
      if (hasUnexpectedShareName) {
        return res.status(400).json({
          message: isEssential
            ? 'Essential share files must be named participant_<index>.npy'
            : 'Standard share files must be named share_<index>.npy',
        });
      }

      for (const shareFile of req.files.shares) {
        const dest = path.join(sharesDir, shareFile.originalname);
        fs.renameSync(shareFile.path, dest);
      }

      const { indices } = req.body;
      if (!indices) return res.status(400).json({ message: 'indices are required' });

      const parsedIndices = String(indices)
        .split(',')
        .map((x) => parseInt(x.trim(), 10))
        .filter((x) => Number.isInteger(x) && x > 0);

      if (!parsedIndices.length) {
        return res.status(400).json({ message: 'indices must be comma-separated positive integers' });
      }

      const decryptScript = isEssential ? ESSENTIAL_DECRYPT_SCRIPT : STANDARD_DECRYPT_SCRIPT;

      await runPythonScript(decryptScript, [
        '--shares_dir', sharesDir,
        '--public_dir', pubDir,
        '--indices',    parsedIndices.join(','),
        '--output',     outFile,
      ]);

      if (!fs.existsSync(outFile)) {
        cleanup();
        return res.status(500).json({ message: 'Reconstruction produced no output' });
      }

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'attachment; filename="reconstructed.png"');
      const stream = fs.createReadStream(outFile);
      stream.on('end', cleanup);
      stream.on('error', (e) => { cleanup(); res.status(500).end(e.message); });
      stream.pipe(res);
    } catch (err) {
      cleanup();
      res.status(500).json({ message: 'Reconstruction failed', error: err.message });
    }
  }
);

module.exports = router;
