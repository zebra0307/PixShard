import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';
import {
  Upload, ArrowLeft, Loader, CheckCircle,
  ChevronRight, ChevronLeft, Layers, Download, Shield, Cpu
} from 'lucide-react';

const STEPS = ['Scheme', 'Public Data', 'Upload Shares', 'Indices', 'Reconstruct'];

const StepIndicator = ({ current }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 40, flexWrap: 'wrap' }}>
    {STEPS.map((label, i) => (
      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <motion.div animate={{ scale: i === current ? 1.1 : 1 }}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: i < current
              ? 'var(--color-primary)'
              : i === current
                ? 'var(--color-primary)'
                : 'var(--bg-soft)',
            border: i <= current ? 'none' : '1px solid var(--border-subtle)',
            color: i <= current ? '#fff' : 'var(--text-faint)',
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

  const [step, setStep] = useState(0);
  const [selectedScheme, setSelectedScheme] = useState(null); // standard | essential
  const [metaFile, setMetaFile] = useState(null); // metadata.npy (essential only)
  const [pubBFile, setPubBFile] = useState(null); // public_b.npy (essential only)
  const [matAFile, setMatAFile] = useState(null); // matrix_A.npy (essential only)
  const [shareFiles, setShareFiles] = useState([]); // share_#.npy or participant_#.npy
  const [indices, setIndices] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);

  // ── Share files drop/select ───────────────────────────────────────────────
  const handleShareFiles = (files) => {
    const arr = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.npy'));
    setShareFiles(prev => {
      const names = prev.map(f => f.name);
      const newOnes = arr.filter(f => !names.includes(f.name));
      return [...prev, ...newOnes];
    });
    if (!arr.length) {
      toast.error('Please upload .npy share files');
    }
  };

  const parseIndices = () =>
    indices
      .split(',')
      .map((x) => parseInt(x.trim(), 10))
      .filter((x) => Number.isInteger(x) && x > 0);

  const validateStep = (currentStep) => {
    if (currentStep === 0 && !selectedScheme) {
      toast.error('Select a reconstruction scheme first');
      return false;
    }

    if (currentStep === 1) {
      if (selectedScheme === 'essential' && (!metaFile || !pubBFile || !matAFile)) {
        toast.error('Essential SSS requires metadata.npy, public_b.npy, and matrix_A.npy');
        return false;
      }
    }

    if (currentStep === 2 && shareFiles.length === 0) {
      toast.error('Upload at least one share file');
      return false;
    }

    return true;
  };

  // ── Submit reconstruction ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedScheme) { toast.error('Select a reconstruction scheme first'); return; }
    if (selectedScheme === 'essential' && (!metaFile || !pubBFile || !matAFile)) {
      toast.error('Essential SSS requires metadata.npy, public_b.npy, and matrix_A.npy');
      return;
    }
    if (shareFiles.length === 0) { toast.error('Upload at least k share files'); return; }

    const parsedIndices = parseIndices();
    if (!parsedIndices.length) { toast.error('Enter participant indices (e.g. 1,2,3)'); return; }

    const fd = new FormData();
    fd.append('schemeType', selectedScheme === 'essential' ? 'Essential' : 'Standard');
    if (selectedScheme === 'essential') {
      fd.append('metadata', metaFile);
      fd.append('public_b', pubBFile);
      fd.append('matrix_A', matAFile);
    }
    shareFiles.forEach(f => fd.append('shares', f));
    fd.append('indices', parsedIndices.join(','));

    setLoading(true);
    try {
      const { data } = await api.post('/share/reconstruct', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
        timeout: 5 * 60 * 1000,
      });
      const url = URL.createObjectURL(new Blob([data], { type: 'image/png' }));
      setResultUrl(url);
      setStep(4);
      toast.success('Image reconstructed successfully!');
    } catch (err) {
      let msg = 'Reconstruction failed';
      try {
        const payload = err.response?.data;
        if (payload instanceof Blob) {
          const text = await payload.text();
          try {
            msg = JSON.parse(text)?.message || text || msg;
          } catch {
            msg = text || msg;
          }
        } else if (payload?.message) {
          msg = payload.message;
        }
      } catch {
        // Keep fallback message
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep(0);
    setSelectedScheme(null);
    setMetaFile(null);
    setPubBFile(null);
    setMatAFile(null);
    setShareFiles([]);
    setIndices('');
    setResultUrl(null);
  };

  const nextStep = () => {
    if (!validateStep(step)) return;
    setStep((s) => s + 1);
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
          Reconstruct <span style={{ color: 'var(--color-primary)' }}>Image</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 36 }}>
          Upload your shares and public data to recover the original image
        </p>

        <StepIndicator current={step} />

        <div className="glass" style={{ borderRadius: 20, padding: 36 }}>
          <AnimatePresence mode="wait">

            {/* Step 0 — Scheme selection */}
            {step === 0 && (
              <motion.div key="scheme" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p style={{ fontWeight: 600, color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>CHOOSE RECONSTRUCTION SCHEME</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setSelectedScheme('standard')}
                    style={{
                      padding: 20,
                      borderRadius: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                      border: `1px solid ${selectedScheme === 'standard' ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
                      background: selectedScheme === 'standard' ? 'rgba(124,58,237,0.08)' : 'var(--bg-soft)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <Cpu size={20} style={{ marginBottom: 10, color: selectedScheme === 'standard' ? 'var(--color-primary)' : 'var(--text-faint)' }} />
                    <p style={{ fontWeight: 700, marginBottom: 4 }}>Standard (k,n) SSS</p>
                    <p style={{ fontSize: 12, color: '#64748b' }}>Needs only share_*.npy files</p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setSelectedScheme('essential')}
                    style={{
                      padding: 20,
                      borderRadius: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                      border: `1px solid ${selectedScheme === 'essential' ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
                      background: selectedScheme === 'essential' ? 'rgba(124,58,237,0.08)' : 'var(--bg-soft)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <Shield size={20} style={{ marginBottom: 10, color: selectedScheme === 'essential' ? 'var(--color-primary)' : 'var(--text-faint)' }} />
                    <p style={{ fontWeight: 700, marginBottom: 4 }}>Essential (t,k,n) SSS</p>
                    <p style={{ fontSize: 12, color: '#64748b' }}>Needs metadata.npy + public_b.npy + matrix_A.npy + participant shares</p>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 1 — Public Data */}
            {step === 1 && (
              <motion.div key="meta" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p style={{ fontWeight: 600, color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>UPLOAD PUBLIC DATA FILES</p>

                {selectedScheme === 'essential' ? (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a78bfa', marginBottom: 6 }}>
                        metadata.npy <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 16px', borderRadius: 10,
                        border: `1px dashed ${metaFile ? '#22c55e' : 'rgba(255,255,255,0.15)'}`,
                        cursor: 'pointer',
                        background: metaFile ? 'rgba(34,197,94,0.05)' : 'transparent',
                      }}>
                        <Upload size={16} color={metaFile ? '#22c55e' : '#475569'} />
                        <span style={{ fontSize: 13, color: metaFile ? '#22c55e' : '#475569' }}>
                          {metaFile ? metaFile.name : 'Click to upload metadata.npy'}
                        </span>
                        <input type="file" accept=".npy" style={{ display: 'none' }} onChange={e => setMetaFile(e.target.files[0])} />
                      </label>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a78bfa', marginBottom: 6 }}>
                        public_b.npy <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                        borderRadius: 10, border: `1px dashed ${pubBFile ? '#22c55e' : 'rgba(255,255,255,0.15)'}`,
                        cursor: 'pointer',
                        background: pubBFile ? 'rgba(34,197,94,0.05)' : 'transparent',
                      }}>
                        <Upload size={16} color={pubBFile ? '#22c55e' : '#475569'} />
                        <span style={{ fontSize: 13, color: pubBFile ? '#22c55e' : '#475569' }}>
                          {pubBFile ? pubBFile.name : 'Click to upload public_b.npy'}
                        </span>
                        <input type="file" accept=".npy" style={{ display: 'none' }} onChange={e => setPubBFile(e.target.files[0])} />
                      </label>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a78bfa', marginBottom: 6 }}>
                        matrix_A.npy <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                        borderRadius: 10, border: `1px dashed ${matAFile ? '#22c55e' : 'rgba(255,255,255,0.15)'}`,
                        cursor: 'pointer',
                        background: matAFile ? 'rgba(34,197,94,0.05)' : 'transparent',
                      }}>
                        <Upload size={16} color={matAFile ? '#22c55e' : '#475569'} />
                        <span style={{ fontSize: 13, color: matAFile ? '#22c55e' : '#475569' }}>
                          {matAFile ? matAFile.name : 'Click to upload matrix_A.npy'}
                        </span>
                        <input type="file" accept=".npy" style={{ display: 'none' }} onChange={e => setMatAFile(e.target.files[0])} />
                      </label>
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 14 }}>
                    Standard (k,n) reconstruction does not require any public metadata files.
                  </p>
                )}
              </motion.div>
            )}

            {/* Step 2 — Upload Shares */}
            {step === 2 && (
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
                  <p style={{ fontSize: 12, color: '#475569' }}>
                    {selectedScheme === 'essential'
                      ? 'Use participant_#.npy files'
                      : 'Use share_#.npy files'}
                  </p>
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

            {/* Step 3 — Indices */}
            {step === 3 && (
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
                    {selectedScheme === 'essential' && <span> · Essential scheme requires ALL essential participants (1..t)</span>}
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

            {/* Step 4 — Result */}
            {step === 4 && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                    style={{
                      width: 56, height: 56, borderRadius: '50%',
                      background: 'rgba(34,197,94,0.08)',
                      border: '1px solid rgba(34,197,94,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 1.25rem',
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
                          background: '#16A34A',
                          color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 14,
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
          {step < 4 && (
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

              {step < 3 ? (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={nextStep}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px',
                    borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: 'var(--color-primary)', color: '#fff', fontWeight: 600, fontSize: 13,
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
                    background: loading ? 'var(--bg-overlay)' : 'var(--color-primary)',
                    color: '#fff', fontWeight: 600, fontSize: 14,
                  }}>
                  {loading ? <><Loader size={14} /> Decrypting…</> : '🔑 Reconstruct Image'}
                </motion.button>
              )}
            </div>
          )}

          {step === 4 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 28 }}>
              <motion.button whileHover={{ scale: 1.02 }}
                onClick={resetFlow}
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
                  background: 'var(--color-primary)',
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
