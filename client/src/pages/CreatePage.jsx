import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';
import { Upload, ChevronRight, ChevronLeft, Cpu, Shield, Loader, Image, CheckCircle } from 'lucide-react';

const STEPS = ['Upload', 'Scheme', 'Parameters', 'Confirm'];

const StepIndicator = ({ current }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 40 }}>
    {STEPS.map((label, i) => (
      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <motion.div animate={{ scale: i === current ? 1.1 : 1 }}
          style={{
            width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: i < current ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : i === current ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'rgba(255,255,255,0.05)',
            border: i <= current ? 'none' : '1px solid rgba(255,255,255,0.1)',
            color: i <= current ? '#fff' : '#475569', fontSize: 12, fontWeight: 700,
          }}>
          {i < current ? <CheckCircle size={14} /> : i + 1}
        </motion.div>
        <span style={{ fontSize: 12, color: i === current ? '#e2e8f0' : '#475569', fontWeight: i === current ? 600 : 400 }}>{label}</span>
        {i < STEPS.length - 1 && <div style={{ width: 20, height: 1, background: 'rgba(255,255,255,0.1)' }} />}
      </div>
    ))}
  </div>
);

export default function CreatePage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [step, setStep]               = useState(0);
  const [file, setFile]               = useState(null);
  const [preview, setPreview]         = useState(null);
  const [scheme, setScheme]           = useState('Standard');
  const [params, setParams]           = useState({ k: 3, n: 5, t: 2 });
  const [loading, setLoading]         = useState(false);
  const [dragOver, setDragOver]       = useState(false);

  const handleFileDrop = (f) => {
    if (!f || !f.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStep(1);
  };

  // Validate k/n/t constraints before calling Python
  const validateParams = () => {
    const { k, n, t } = params;
    if (k < 2)        { toast.error('k must be at least 2');          return false; }
    if (n < k + 1)    { toast.error('n must be greater than k');       return false; }
    if (n > 20)       { toast.error('n cannot exceed 20 shares');      return false; }
    if (scheme === 'Essential') {
      if (t < 1)      { toast.error('t must be at least 1');           return false; }
      if (t >= k)     { toast.error('t must be less than k');          return false; }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!file)           { toast.error('No image selected'); return; }
    if (!validateParams()) return;
    setLoading(true);
    const fd = new FormData();
    fd.append('image', file);
    fd.append('schemeType', scheme);
    fd.append('k', params.k);
    fd.append('n', params.n);
    if (scheme === 'Essential') fd.append('t', params.t);

    try {
      const { data } = await api.post('/share/create', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 5 * 60 * 1000,
      });
      toast.success('Encryption complete!');
      navigate(`/project/${data.project._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Encryption failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '48px 24px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', marginBottom: 8 }}>
          Create <span className="grad-text">New Shard</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 36 }}>
          Upload an image and configure a secret sharing scheme
        </p>

        <StepIndicator current={step} />

        <div className="glass" style={{ borderRadius: 20, padding: 36 }}>
          <AnimatePresence mode="wait">

            {/* Step 0 — Upload */}
            {step === 0 && (
              <motion.div key="upload" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFileDrop(e.dataTransfer.files[0]); }}
                  onClick={() => fileRef.current.click()}
                  style={{
                    border: `2px dashed ${dragOver ? '#7c3aed' : 'rgba(255,255,255,0.12)'}`,
                    borderRadius: 14, padding: '60px 24px', textAlign: 'center', cursor: 'pointer',
                    background: dragOver ? 'rgba(124,58,237,0.05)' : 'transparent', transition: 'all 0.2s',
                  }}>
                  <Upload size={36} color="#475569" style={{ margin: '0 auto 16px', display: 'block' }} />
                  <p style={{ fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Drop an image here</p>
                  <p style={{ fontSize: 12, color: '#475569' }}>or click to browse — JPG, PNG, BMP, GIF</p>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => handleFileDrop(e.target.files[0])} />
                </div>
              </motion.div>
            )}

            {/* Step 1 — Scheme */}
            {step === 1 && (
              <motion.div key="scheme" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                {preview && (
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <img src={preview} alt="preview" style={{ maxHeight: 140, maxWidth: '100%', borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)' }} />
                    <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>{file?.name}</p>
                  </div>
                )}
                <p style={{ fontWeight: 600, marginBottom: 16, color: '#94a3b8', fontSize: 13 }}>SELECT SCHEME</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[
                    { key: 'Standard', icon: <Cpu size={20} />, color: '#06b6d4', desc: 'Any k of n shares' },
                    { key: 'Essential', icon: <Shield size={20} />, color: '#a855f7', desc: 't required + k total' },
                  ].map(s => (
                    <motion.div key={s.key} whileHover={{ scale: 1.02 }} onClick={() => setScheme(s.key)}
                      style={{
                        padding: 20, borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                        border: `1px solid ${scheme === s.key ? s.color : 'rgba(255,255,255,0.08)'}`,
                        background: scheme === s.key ? `${s.color}12` : 'rgba(255,255,255,0.02)',
                        transition: 'all 0.2s',
                      }}>
                      <div style={{ color: s.color, marginBottom: 10 }}>{s.icon}</div>
                      <p style={{ fontWeight: 700, marginBottom: 4, color: '#e2e8f0' }}>{s.key}</p>
                      <p style={{ fontSize: 12, color: '#64748b' }}>{s.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2 — Parameters */}
            {step === 2 && (
              <motion.div key="params" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p style={{ fontWeight: 600, marginBottom: 20, color: '#94a3b8', fontSize: 13 }}>CONFIGURE PARAMETERS</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {scheme === 'Essential' && (
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#a78bfa', marginBottom: 6 }}>
                        t — Essential participants (must all be present)
                      </label>
                      <input type="number" min={1} max={params.k - 1} value={params.t}
                        onChange={e => setParams(p => ({ ...p, t: +e.target.value }))} />
                    </div>
                  )}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
                      k — Threshold (minimum shares to reconstruct)
                    </label>
                    <input type="number" min={2} max={params.n - 1} value={params.k}
                      onChange={e => setParams(p => ({ ...p, k: +e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
                      n — Total shares to generate
                    </label>
                    <input type="number" min={params.k + 1} max={20} value={params.n}
                      onChange={e => setParams(p => ({ ...p, n: +e.target.value }))} />
                  </div>
                  <div className="glass" style={{ borderRadius: 10, padding: 14 }}>
                    <p style={{ fontSize: 12, color: '#64748b' }}>
                      ↳ Will generate <strong style={{ color: '#e2e8f0' }}>{params.n}</strong> shares.
                      Any <strong style={{ color: '#e2e8f0' }}>{params.k}</strong> can reconstruct
                      {scheme === 'Essential' && <> (only if all <strong style={{ color: '#a78bfa' }}>{params.t}</strong> essential participants are included)</>}.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3 — Confirm */}
            {step === 3 && (
              <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p style={{ fontWeight: 600, marginBottom: 20, color: '#94a3b8', fontSize: 13 }}>REVIEW & ENCRYPT</p>
                {[
                  ['Image', file?.name],
                  ['Scheme', scheme],
                  ['k (threshold)', params.k],
                  ['n (total shares)', params.n],
                  ...(scheme === 'Essential' ? [['t (essential)', params.t]] : []),
                ].map(([label, val]) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between', padding: '10px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13,
                  }}>
                    <span style={{ color: '#64748b' }}>{label}</span>
                    <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{val}</span>
                  </div>
                ))}

                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ textAlign: 'center', padding: '24px 0' }}>
                    <Loader size={28} color="#7c3aed" style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 12px' }} />
                    <p style={{ color: '#64748b', fontSize: 13 }}>Running encryption… this may take a moment for large images.</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setStep(s => s - 1)} disabled={step === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
                borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: step === 0 ? '#334155' : '#94a3b8',
                cursor: step === 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500,
              }}>
              <ChevronLeft size={15} /> Back
            </motion.button>

            {step < 3 ? (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (step === 2 && !validateParams()) return; // validate before Confirm
                  setStep(s => s + 1);
                }}
                disabled={step === 0 && !file}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px',
                  borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', fontWeight: 700, fontSize: 13,
                }}>
                Next <ChevronRight size={15} />
              </motion.button>
            ) : (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleSubmit} disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 28px',
                  borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? '#374151' : 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                  color: '#fff', fontWeight: 700, fontSize: 14,
                }}>
                {loading ? <><Loader size={14} /> Encrypting…</> : '🔐 Encrypt Now'}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
