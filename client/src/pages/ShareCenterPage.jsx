import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';
import { Download, FileArchive, File, ArrowLeft, Database } from 'lucide-react';

// Resolve API base: use env var in production, empty string in dev (Vite proxy handles it)
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';

const FileRow = ({ name, projectId, type, index }) => (
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
    <a
      href={`${API_BASE}/api/share/download-file/${projectId}/${name}`}
      download={name}
      className="btn-secondary"
      style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', flexShrink: 0 }}
      aria-label={`Download ${name}`}
    >
      <Download size={11} /> Download
    </a>
  </motion.div>
);

export default function ShareCenterPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setTab]   = useState('shares');

  useEffect(() => {
    api.get(`/share/${id}`)
      .then(({ data }) => setProject(data))
      .catch(() => { toast.error('Project not found'); navigate('/dashboard'); })
      .finally(() => setLoading(false));
  }, [id]);

  const downloadZip = (type) => {
    const url = type === 'shares'
      ? `${API_BASE}/api/share/download-shares/${id}`
      : `${API_BASE}/api/share/download-public/${id}`;
    window.open(url, '_blank');
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
            style={{ fontSize: '0.8125rem' }}
            onClick={() => downloadZip('shares')}
            aria-label="Download all shares as ZIP"
          >
            <FileArchive size={14} /> Download All Shares (ZIP)
          </motion.button>
          <motion.button
            whileHover={{ translateY: -1 }}
            whileTap={{ scale: 0.98 }}
            className="btn-secondary"
            style={{ fontSize: '0.8125rem' }}
            onClick={() => downloadZip('public')}
            aria-label="Download public data as ZIP"
          >
            <Database size={14} /> Download Public Data (ZIP)
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
            {['metadata.json', 'matrix_A.npy', 'public_b.json'].map((f, i) => (
              <FileRow key={f} name={f} projectId={id} type="public" index={i} />
            ))}
          </>
        )}
      </motion.div>
    </div>
  );
}
