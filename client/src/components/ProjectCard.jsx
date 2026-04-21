import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trash2, ExternalLink, Shield, Cpu } from 'lucide-react';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  ready:      { label: 'ready',      cls: 'badge badge-green' },
  failed:     { label: 'failed',     cls: 'badge badge-red'   },
  processing: { label: 'processing', cls: 'badge badge-amber' },
};

const SCHEME_BADGE = {
  Standard: { cls: 'badge badge-cyan',   icon: <Cpu size={10} /> },
  Essential:{ cls: 'badge badge-purple', icon: <Shield size={10} /> },
};

export default function ProjectCard({ project, onDelete }) {
  const navigate = useNavigate();
  const sb = SCHEME_BADGE[project.schemeType] || SCHEME_BADGE.Standard;
  const st = STATUS_BADGE[project.status]    || STATUS_BADGE.processing;

  const params = project.schemeType === 'Essential'
    ? `t=${project.t}, k=${project.k}, n=${project.n}`
    : `k=${project.k}, n=${project.n}`;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm('Delete this project and all its share files?')) return;
    try {
      await api.delete(`/share/${project._id}`);
      toast.success('Project deleted');
      onDelete(project._id);
    } catch {
      toast.error('Failed to delete project');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: 'var(--shadow-card-hover)' }}
      transition={{ duration: 0.2 }}
      onClick={() => navigate(`/project/${project._id}`)}
      className="card"
      style={{ borderRadius: 'var(--radius-lg)', padding: '1.25rem', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
      role="button"
      tabIndex={0}
      aria-label={`Open project ${project.originalImageName}`}
      onKeyDown={e => e.key === 'Enter' && navigate(`/project/${project._id}`)}
    >
      {/* Top accent line — single color, not gradient */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--color-primary)', opacity: 0.7 }} />

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
        <span className={sb.cls} style={{ gap: '0.3rem' }}>
          {sb.icon}
          {project.schemeType.toUpperCase()}
        </span>
        <button
          onClick={handleDelete}
          className="btn-danger"
          aria-label={`Delete project ${project.originalImageName}`}
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* File name */}
      <p style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.25rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
        {project.originalImageName}
      </p>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem', fontFamily: 'monospace' }}>
        ({params})
      </p>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className={st.cls}>{st.label}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <ExternalLink size={11} />
          {new Date(project.createdAt).toLocaleDateString()}
        </span>
      </div>
    </motion.div>
  );
}
