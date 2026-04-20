import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';
import {
  Upload, ArrowLeft, Loader, CheckCircle, Image,
  ChevronRight, ChevronLeft, Layers, Download
} from 'lucide-react';

const STEPS = ['Public Data', 'Upload Shares', 'Indices', 'Reconstruct'];

const StepIndicator = ({ current }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 40, flexWrap: 'wrap' }}>
    {STEPS.map((label, i) => (
      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <motion.div animate={{ scale: i === current ? 1.1 : 1 }}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: i < current
              ? 'linear-gradient(135deg,#7c3aed,#4f46e5)'
              : i === current
                ? 'linear-gradient(135deg,#06b6d4,#7c3aed)'
                : 'rgba(255,255,255,0.05)',
            border: i <= current ? 'none' : '1px solid rgba(255,255,255,0.1)',
            color: i <= current ? '#fff' : '#475569',
            fontSize: 12, fontWeight: 700,
          }}>
          {i < current ? <CheckCircle size={14} /> : i + 1}
        </motion.div>
        <span style={{ fontSize: 12, color: i === current ? '#e2e8f0' : '#475569', fontWeight: i === current ? 600 : 400 }}>
          {label}
        </span>
        {i < STEPS.length - 1 && <div style={{ width: 20, height: 1, background: 'rgba(255,255,255,0.1)' }} />}
      </div>
    ))}
  </div>
);

export default function ReconstructPage() {
  const navigate = useNavigate();

  const [step, setStep]               = useState(0);
  const [metaFile, setMetaFile]       = useState(null);   // metadata.json
  const [pubBFile, setPubBFile]       = useState(null);   // public_b.json (essential only)
  const [matAFile, setMatAFile]       = useState(null);   // matrix_A.npy (essential only)
  const [shareFiles, setShareFiles]   = useState([]);     // participant share .npy files
  const [indices, setIndices]         = useState('');     // "1,2,3"
  const [loading, setLoading]         = useState(false);
  const [resultUrl, setResultUrl]     = useState(null);   // blob URL of reconstructed image
  const [scheme, setScheme]           = useState(null);   // detected from metadata.json

  // ── Metadata upload handler ───────────────────────────────────────────────
  const handleMetaUpload = (f) => {
    if (!f) return;
    setMetaFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const meta = JSON.parse(e.target.result);
        setScheme(meta.scheme);
        toast.success(`Detected: ${meta.scheme === 'essential' ? 'Essential' : 'Standard'} scheme (k=${meta.k})`);
      } catch { toast.error('Invalid metadata.json'); }
    };
    reader.readAsText(f);
  };

  // ── Share files drop/select ───────────────────────────────────────────────
  const handleShareFiles = (files) => {
    const arr = Array.from(files).filter(f => f.name.endsWith('.npy') || f.name.endsWith('.json'));
    setShareFiles(prev => {
      const names = prev.map(f => f.name);
      const newOnes = arr.filter(f => !names.includes(f.name));
      return [...prev, ...newOnes];
    });
  };

  // ── Submit reconstruction ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!metaFile) { toast.error('metadata.json is required'); return; }
    if (shareFiles.length === 0) { toast.error('Upload at least k share files'); return; }
    if (!indices.trim()) { toast.error('Enter participant indices (e.g. 1,2,3)'); return; }

    const fd = new FormData();
    fd.append('metadata', metaFile);
    if (pubBFile) fd.append('public_b', pubBFile);
    if (matAFile) fd.append('matrix_A', matAFile);
    shareFiles.forEach(f => fd.append('shares', f));
    fd.append('indices', indices);

    setLoading(true);
    try {
      const { data } = await api.post('/share/reconstruct', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
        timeout: 5 * 60 * 1000,
      });
      const url = URL.createObjectURL(new Blob([data], { type: 'image/png' }));
      setResultUrl(url);
      setStep(3);
      toast.success('Image reconstructed successfully!');
    } catch (err) {
      const text = await err.response?.data?.text?.();
      const msg = text ? JSON.parse(text)?.message : 'Reconstruction failed';
      toast.error(msg || 'Reconstruction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={() => navigate('/dashboard')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
          borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#64748b', cursor: 'pointer', fontSize: 13, marginBottom: 32,
        }}>
        <ArrowLeft size={14} /> Dashboard
      </motion.button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', marginBottom: 8 }}>
          Reconstruct <span className="grad-text">Image</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 36 }}>
          Upload your shares and public data to recover the original image
        </p>

        <StepIndicator current={step} />

        <div className="glass" style={{ borderRadius: 20, padding: 36 }}>
          <AnimatePresence mode="wait">

            {/* Step 0 — Public Data */}
            {step === 0 && (
              <motion.div key="meta" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p style={{ fontWeight: 600, color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>UPLOAD PUBLIC DATA FILES</p>

                {/* metadata.json — required */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a78bfa', marginBottom: 6 }}>
                    metadata.json <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                    borderRadius: 10, border: `1px dashed ${metaFile ? '#22c55e' : 'rgba(255,255,255,0.15)'}`,
                    cursor: 'pointer', background: metaFile ? 'rgba(34,197,94,0.05)' : 'transparent',
                    transition: 'all 0.2s',
                  }}>
                    <Upload size={16} color={metaFile ? '#22c55e' : '#64748b'} />
                    <span style={{ fontSize: 13, color: metaFile ? '#22c55e' : '#64748b' }}>
                      {metaFile ? metaFile.name : 'Click to upload metadata.json'}
                    </span>
                    <input type="file" accept=".json" style={{ display: 'none' }} onChange={e => handleMetaUpload(e.target.files[0])} />
                  </label>
                </div>

                {/* public_b.json — essential only */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
                    public_b.json <span style={{ color: '#64748b', fontWeight: 400 }}>(Essential scheme only)</span>
                  </label>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                    borderRadius: 10, border: `1px dashed ${pubBFile ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
                    cursor: 'pointer',
                  }}>
                    <Upload size={16} color={pubBFile ? '#22c55e' : '#475569'} />
                    <span style={{ fontSize: 13, color: pubBFile ? '#22c55e' : '#475569' }}>
                      {pubBFile ? pubBFile.name : 'Click to upload public_b.json'}
                    </span>
                    <input type="file" accept=".json" style={{ display: 'none' }} onChange={e => setPubBFile(e.target.files[0])} />
                  </label>
                </div>

                {/* matrix_A.npy — essential only */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
                    matrix_A.npy <span style={{ color: '#64748b', fontWeight: 400 }}>(Essential scheme only)</span>
                  </label>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                    borderRadius: 10, border: `1px dashed ${matAFile ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
                    cursor: 'pointer',
                  }}>
                    <Upload size={16} color={matAFile ? '#22c55e' : '#475569'} />
                    <span style={{ fontSize: 13, color: matAFile ? '#22c55e' : '#475569' }}>
                      {matAFile ? matAFile.name : 'Click to upload matrix_A.npy'}
                    </span>
                    <input type="file" accept=".npy" style={{ display: 'none' }} onChange={e => setMatAFile(e.target.files[0])} />
                  </label>
                </div>

                {scheme && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{
                      marginTop: 16, padding: '10px 14px', borderRadius: 8,
                      background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
                      fontSize: 12, color: '#a78bfa',
                    }}>
                    ✓ Detected scheme: <strong>{scheme}</strong>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 1 — Upload Shares */}
            {step === 1 && (
              <motion.div key="shares" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p style={{ fontWeight: 600, color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>UPLOAD YOUR SHARE FILES (.npy)</p>

                <label
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); handleShareFiles(e.dataTransfer.files); }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '40px 24px', borderRadius: 12,
                    border: '2px dashed rgba(255,255,255,0.12)',
                    cursor: 'pointer', textAlign: 'center', marginBottom: 20,
                  }}>
                  <Upload size={32} color="#475569" style={{ marginBottom: 12 }} />
                  <p style={{ fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>Drop .npy share files here</p>
                  <p style={{ fontSize: 12, color: '#475569' }}>or click to browse — select multiple</p>
                  <input type="file" accept=".npy" multiple style={{ display: 'none' }}
                    onChange={e => handleShareFiles(e.target.files)} />
                </label>

                {shareFiles.length > 0 && (
                  <div>
                    <p style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
                      {shareFiles.length} file{shareFiles.length > 1 ? 's' : ''} selected:
                    </p>
                    {shareFiles.map((f, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 12px', marginBottom: 6, borderRadius: 8,
                        background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)',
                      }}>
                        <span style={{ fontSize: 13, color: '#86efac', fontFamily: 'monospace' }}>{f.name}</span>
                        <button onClick={() => setShareFiles(p => p.filter((_, j) => j !== i))}
                          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2 — Indices */}
            {step === 2 && (
              <motion.div key="indices" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p style={{ fontWeight: 600, color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>SPECIFY PARTICIPANT INDICES</p>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>
                    Indices (comma-separated, matching your share filenames)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1,2,3"
                    value={indices}
                    onChange={e => setIndices(e.target.value)}
                    style={{ fontFamily: 'monospace', fontSize: 16, letterSpacing: '0.05em' }}
                  />
                  <p style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>
                    ↳ share_1.npy → index 1, participant_2.npy → index 2, etc.
                  </p>
                </div>

                <div className="glass" style={{ borderRadius: 10, padding: 14 }}>
                  <p style={{ fontSize: 12, color: '#64748b' }}>
                    Files loaded: <strong style={{ color: '#e2e8f0' }}>{shareFiles.length}</strong> share{shareFiles.length !== 1 ? 's' : ''}
                    {scheme === 'essential' && <span> · Essential scheme requires ALL essential participants (1..t)</span>}
                  </p>
                </div>

                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ textAlign: 'center', padding: '24px 0' }}>
                    <Loader size={28} color="#7c3aed" style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 12px' }} />
                    <p style={{ color: '#64748b', fontSize: 13 }}>Running Python decryption…</p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 3 — Result */}
            {step === 3 && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                    style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(6,182,212,0.2))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 20px',
                    }}>
                    <CheckCircle size={30} color="#22c55e" />
                  </motion.div>

                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Reconstruction Complete!</h3>
                  <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>Your original image has been recovered.</p>

                  {resultUrl && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <img
                        src={resultUrl}
                        alt="Reconstructed"
                        style={{
                          maxWidth: '100%', maxHeight: 320, borderRadius: 12,
                          border: '1px solid rgba(255,255,255,0.1)',
                          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                          marginBottom: 20,
                        }}
                      />
                      <a
                        href={resultUrl}
                        download="reconstructed.png"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 8,
                          padding: '12px 28px', borderRadius: 10,
                          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                          color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14,
                        }}>
                        <Download size={16} /> Download Reconstructed Image
                      </a>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          {step < 3 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setStep(s => s - 1)} disabled={step === 0}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
                  borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent', color: step === 0 ? '#334155' : '#94a3b8',
                  cursor: step === 0 ? 'not-allowed' : 'pointer', fontSize: 13,
                }}>
                <ChevronLeft size={15} /> Back
              </motion.button>

              {step < 2 ? (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(s => s + 1)} disabled={step === 0 && !metaFile}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px',
                    borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    color: '#fff', fontWeight: 700, fontSize: 13,
                  }}>
                  Next <ChevronRight size={15} />
                </motion.button>
              ) : (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit} disabled={loading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 28px',
                    borderRadius: 10, border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    background: loading ? '#374151' : 'linear-gradient(135deg, #06b6d4, #7c3aed)',
                    color: '#fff', fontWeight: 700, fontSize: 14,
                  }}>
                  {loading ? <><Loader size={14} /> Decrypting…</> : '🔑 Reconstruct Image'}
                </motion.button>
              )}
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 28 }}>
              <motion.button whileHover={{ scale: 1.02 }}
                onClick={() => { setStep(0); setMetaFile(null); setPubBFile(null); setMatAFile(null); setShareFiles([]); setIndices(''); setResultUrl(null); setScheme(null); }}
                style={{
                  padding: '10px 22px', borderRadius: 10, background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', fontSize: 13,
                }}>
                Reconstruct Another
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }}
                onClick={() => navigate('/dashboard')}
                style={{
                  padding: '10px 22px', borderRadius: 10,
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                }}>
                <Layers size={13} style={{ marginRight: 6, display: 'inline' }} />
                Dashboard
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
