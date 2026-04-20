import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';
import { Download, FileArchive, File, ArrowLeft, Database, Loader } from 'lucide-react';

const FileRow = ({ name, projectId, type, index }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)', marginBottom: 8,
    }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <File size={14} color={type === 'share' ? '#06b6d4' : '#a855f7'} />
      <span style={{ fontSize: 13, color: '#cbd5e1', fontFamily: 'monospace' }}>{name}</span>
    </div>
    <a
      href={`/api/share/download-file/${projectId}/${name}`}
      download={name}
      style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
        borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
        color: '#94a3b8', textDecoration: 'none', fontSize: 12, fontWeight: 500,
      }}>
      <Download size={12} /> Download
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
      ? `/api/share/download-shares/${id}`
      : `/api/share/download-public/${id}`;
    window.open(url, '_blank');
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
      <Loader size={32} color="#7c3aed" />
    </div>
  );
  if (!project) return null;

  const schemeColor = project.schemeType === 'Essential' ? '#a855f7' : '#06b6d4';
  const paramStr = project.schemeType === 'Essential'
    ? `t=${project.t}, k=${project.k}, n=${project.n}`
    : `k=${project.k}, n=${project.n}`;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      {/* Back */}
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={() => navigate('/dashboard')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
          borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#64748b', cursor: 'pointer', fontSize: 13, marginBottom: 32,
        }}>
        <ArrowLeft size={14} /> Dashboard
      </motion.button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
            background: `${schemeColor}18`, color: schemeColor,
          }}>
            {project.schemeType.toUpperCase()} ({paramStr})
          </div>
          <div style={{
            padding: '4px 10px', borderRadius: 20, fontSize: 11,
            background: 'rgba(34,197,94,0.1)', color: '#22c55e',
          }}>
            ● {project.status}
          </div>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', marginBottom: 4 }}>
          {project.originalImageName}
        </h1>
        <p style={{ color: '#64748b', fontSize: 13 }}>
          Created {new Date(project.createdAt).toLocaleString()}
        </p>
      </motion.div>

      {/* Download All Buttons */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass" style={{ borderRadius: 16, padding: 24, marginBottom: 28 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', marginBottom: 16, letterSpacing: '0.05em' }}>
          BULK DOWNLOAD
        </h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => downloadZip('shares')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px',
              borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: '#fff', fontWeight: 600, fontSize: 13,
            }}>
            <FileArchive size={15} /> Download All Shares (ZIP)
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => downloadZip('public')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px',
              borderRadius: 10, cursor: 'pointer',
              background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)',
              color: '#a855f7', fontWeight: 600, fontSize: 13,
            }}>
            <Database size={15} /> Download Public Data (ZIP)
          </motion.button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20 }}>
        {[['shares', 'Share Files'], ['public', 'Public Data']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              padding: '10px 20px', border: 'none', cursor: 'pointer',
              background: activeTab === key ? 'rgba(124,58,237,0.15)' : 'transparent',
              borderBottom: `2px solid ${activeTab === key ? '#7c3aed' : 'transparent'}`,
              color: activeTab === key ? '#a78bfa' : '#64748b',
              fontWeight: activeTab === key ? 600 : 400, fontSize: 13, transition: 'all 0.2s',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* File List */}
      <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {activeTab === 'shares' ? (
          project.shareFiles?.length > 0
            ? project.shareFiles.map((f, i) => (
                <FileRow key={f} name={f} projectId={id} type="share" index={i} />
              ))
            : <p style={{ color: '#475569', fontSize: 14 }}>No share files found.</p>
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
