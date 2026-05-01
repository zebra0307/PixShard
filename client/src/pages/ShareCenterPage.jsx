import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';
import { Download, FileArchive, File, ArrowLeft, Database } from 'lucide-react';

// Resolve API base: use env var in production, empty string in dev (Vite proxy handles it)
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';

// ── Authenticated blob download ─────────────────────────────────────────────
// Uses axios so the Firebase token is sent automatically via the request interceptor.
// Plain <a href> / window.open cannot attach the Authorization header.
const authDownload = async (url, filename) => {
  try {
    const { data } = await api.get(url, { responseType: 'blob' });

    // Force download: use a temporary object URL and trigger click synchronously
    const blobUrl = URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.setAttribute('download', filename); // must use setAttribute for cross-browser
    a.removeAttribute('target');          // prevent new-tab behavior
    document.body.appendChild(a);
    a.click();
    // Cleanup after a short delay to allow the download to start
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 5000);
  } catch (err) {
    // The API returns JSON errors as a Blob when responseType:'blob' — parse it
    let msg = 'Download failed — please try again';
    try {
      const blob = err.response?.data;
      if (blob instanceof Blob) {
        const text = await blob.text();
        msg = JSON.parse(text)?.message || msg;
      }
    } catch { /* keep fallback */ }
    toast.error(msg);
  }
};

// ── File row ────────────────────────────────────────────────────────────────
const FileRow = ({ name, projectId, type, index }) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    await authDownload(`/share/download-file/${projectId}/${name}`, name);
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="file-row"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
        <File size={13} color={type === 'share' ? 'var(--color-secondary)' : 'var(--color-primary)'} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </span>
      </div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="btn-secondary"
        style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', flexShrink: 0, opacity: loading ? 0.6 : 1 }}
        aria-label={`Download ${name}`}
      >
        {loading
          ? <span className="spinner" style={{ width: 11, height: 11, borderWidth: 1.5 }} />
          : <><Download size={11} /> Download</>
        }
      </button>
    </motion.div>
  );
};

// ── Page ────────────────────────────────────────────────────────────────────
export default function ShareCenterPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setTab]   = useState('shares');
  const [zipLoading, setZipLoading] = useState({ shares: false, public: false });

  useEffect(() => {
    api.get(`/share/${id}`)
      .then(({ data }) => setProject(data))
      .catch(() => { toast.error('Project not found'); navigate('/dashboard'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const downloadZip = async (type) => {
    setZipLoading(prev => ({ ...prev, [type]: true }));
    const url      = type === 'shares' ? `/share/download-shares/${id}` : `/share/download-public/${id}`;
    const filename = type === 'shares' ? `pixshard_shares_${id}.zip` : `pixshard_public_${id}.zip`;
    await authDownload(url, filename);
    setZipLoading(prev => ({ ...prev, [type]: false }));
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem 0' }}>
      <div className="spinner" aria-label="Loading project" />
    </div>
  );
  if (!project) return null;

  const paramStr = project.schemeType === 'Essential'
    ? `t=${project.t}, k=${project.k}, n=${project.n}`
    : `k=${project.k}, n=${project.n}`;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '3rem 1.5rem' }}>

      {/* Back */}
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={() => navigate('/dashboard')}
        className="btn-secondary"
        style={{ marginBottom: '2rem', fontSize: '0.8125rem', padding: '0.4rem 0.875rem' }}
      >
        <ArrowLeft size={13} /> Dashboard
      </motion.button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <span className={project.schemeType === 'Essential' ? 'badge badge-purple' : 'badge badge-cyan'}>
            {project.schemeType} ({paramStr})
          </span>
          <span className={`badge ${project.status === 'ready' ? 'badge-green' : project.status === 'failed' ? 'badge-red' : 'badge-amber'}`}>
            {project.status}
          </span>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          {project.originalImageName}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
          Created {new Date(project.createdAt).toLocaleString()}
        </p>
      </motion.div>

      {/* Bulk download */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="card"
        style={{ padding: '1.25rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-lg)' }}
      >
        <p className="label-caps" style={{ marginBottom: '0.875rem' }}>Bulk download</p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <motion.button
            whileHover={{ translateY: -1, boxShadow: 'var(--shadow-primary)' }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary"
            style={{ fontSize: '0.8125rem', opacity: zipLoading.shares ? 0.7 : 1 }}
            onClick={() => downloadZip('shares')}
            disabled={zipLoading.shares}
            aria-label="Download all shares as ZIP"
          >
            {zipLoading.shares
              ? <span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} />
              : <FileArchive size={14} />}
            Download All Shares (ZIP)
          </motion.button>
          <motion.button
            whileHover={{ translateY: -1 }}
            whileTap={{ scale: 0.98 }}
            className="btn-secondary"
            style={{ fontSize: '0.8125rem', opacity: zipLoading.public ? 0.7 : 1 }}
            onClick={() => downloadZip('public')}
            disabled={zipLoading.public}
            aria-label="Download public data as ZIP"
          >
            {zipLoading.public
              ? <span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} />
              : <Database size={14} />}
            Download Public Data (ZIP)
          </motion.button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="tab-bar">
        {[['shares', 'Share Files'], ['public', 'Public Data']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`tab-btn${activeTab === key ? ' active' : ''}`}
            aria-selected={activeTab === key}
          >
            {label}
          </button>
        ))}
      </div>

      {/* File list */}
      <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {activeTab === 'shares' ? (
          project.shareFiles?.length > 0
            ? project.shareFiles.map((f, i) => (
                <FileRow key={f} name={f} projectId={id} type="share" index={i} />
              ))
            : <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No share files found.</p>
        ) : (
          <>
            {project.schemeType === 'Essential' ? (
              <>
                <FileRow name="metadata.npy"  projectId={id} type="public" index={0} />
                <FileRow name="matrix_A.npy"  projectId={id} type="public" index={1} />
                <FileRow name="public_b.npy" projectId={id} type="public" index={2} />
              </>
            ) : (
              <div style={{
                marginTop: '0.75rem', padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(56,189,248,0.05)',
                border: '1px solid rgba(56,189,248,0.12)',
              }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  <span style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>Standard (k,n) scheme</span>
                  {' '}— no public metadata files are required for reconstruction.
                  <code>metadata.npy</code>, <code>matrix_A.npy</code>, and <code>public_b.npy</code>
                  are generated only by the Essential (t,k,n) scheme.
                </p>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
