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
const ENCRYPT_SCRIPT = path.join(LOGIC_DIR, 'encrypt.py');

// Log resolved paths on startup (helps debug)
console.log('[PixShard] LOGIC_DIR resolved to:', LOGIC_DIR);
console.log('[PixShard] encrypt.py exists:', fs.existsSync(ENCRYPT_SCRIPT));


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

  // Build Python args (isEssential used inside try block)
  const isEssential = schemeType === 'Essential';

  try {
    // ── Fix: rename multer temp file to include original extension ───────────
    // PIL identifies image format from extension when content-sniffing fails
    const origExt = path.extname(req.file.originalname).toLowerCase() || '.jpg';
    const renamedPath = req.file.path + origExt;
    fs.renameSync(req.file.path, renamedPath);

    await runPythonScript(ENCRYPT_SCRIPT, [
      '--type',        isEssential ? 't,k,n' : 'k,n',
      '--input',       renamedPath,
      '--shares_dir',  sharesDir,
      '--public_dir',  pubDir,
      '--k',           String(kNum),
      '--n',           String(nNum),
      ...(isEssential ? ['--t', String(tNum)] : []),
    ]);

    // Collect generated share filenames
    const shareFiles = fs.readdirSync(sharesDir);

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
// GET /api/share/:id  — single project
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/:id', protect, async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, ownerID: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/share/download-shares/:id  — ZIP all share files
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/download-shares/:id', protect, async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, ownerID: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (project.status !== 'ready') return res.status(400).json({ message: 'Project not ready' });
  streamZip(res, project.sharesDir, `pixshard_shares_${req.params.id}.zip`);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/share/download-public/:id  — ZIP public data directory
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/download-public/:id', protect, async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, ownerID: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (project.status !== 'ready') return res.status(400).json({ message: 'Project not ready' });
  streamZip(res, project.publicDataDir, `pixshard_public_${req.params.id}.zip`);
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
// GET /api/share/download-file/:id/:filename  — individual file download
// Searches both sharesDir and publicDataDir for the requested filename
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
// POST /api/share/reconstruct
// Body (multipart):
//   metadata  — metadata.json
//   public_b  — public_b.json  (essential)
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
      // Move metadata.json to pubDir
      if (!req.files?.metadata?.[0])
        return res.status(400).json({ message: 'metadata.json is required' });
      fs.renameSync(req.files.metadata[0].path, path.join(pubDir, 'metadata.json'));

      // Move public_b.json if provided
      if (req.files?.public_b?.[0])
        fs.renameSync(req.files.public_b[0].path, path.join(pubDir, 'public_b.json'));

      // Move matrix_A.npy if provided
      if (req.files?.matrix_A?.[0])
        fs.renameSync(req.files.matrix_A[0].path, path.join(pubDir, 'matrix_A.npy'));

      // Move all share files, restoring their original names
      if (!req.files?.shares?.length)
        return res.status(400).json({ message: 'At least one share file is required' });

      for (const shareFile of req.files.shares) {
        const dest = path.join(sharesDir, shareFile.originalname);
        fs.renameSync(shareFile.path, dest);
      }

      const { indices } = req.body;
      if (!indices) return res.status(400).json({ message: 'indices are required' });

      const DECRYPT_SCRIPT = path.join(LOGIC_DIR, 'decrypt.py');
      await runPythonScript(DECRYPT_SCRIPT, [
        '--shares_dir', sharesDir,
        '--public_dir', pubDir,
        '--indices',    indices,
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
