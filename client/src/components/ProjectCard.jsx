import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trash2, ExternalLink, Shield, Cpu } from 'lucide-react';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';

const schemeColors = {
  Standard: { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  Essential: { color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
};

export default function ProjectCard({ project, onDelete }) {
  const navigate = useNavigate();
  const sc = schemeColors[project.schemeType] || schemeColors.Standard;

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

  const params = project.schemeType === 'Essential'
    ? `t=${project.t}, k=${project.k}, n=${project.n}`
    : `k=${project.k}, n=${project.n}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 20px 60px rgba(124,58,237,0.15)' }}
      transition={{ duration: 0.2 }}
      onClick={() => navigate(`/project/${project._id}`)}
      className="glass"
      style={{ borderRadius: 16, padding: 24, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
    >
      {/* Subtle gradient top-accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${sc.color}, transparent)`,
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
          borderRadius: 20, background: sc.bg, color: sc.color,
          fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
        }}>
          {project.schemeType === 'Essential' ? <Shield size={11} /> : <Cpu size={11} />}
          {project.schemeType.toUpperCase()}
        </div>
        <button
          onClick={handleDelete}
          style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#ef4444',
            transition: 'all 0.2s',
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>

      <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6, color: '#f1f5f9' }}>
        {project.originalImageName}
      </p>
      <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>({params})</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#475569' }}>
          {new Date(project.createdAt).toLocaleDateString()}
        </span>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          color: sc.color, fontSize: 12, fontWeight: 500,
        }}>
          <ExternalLink size={12} /> View Shares
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <span style={{
          display: 'inline-block', padding: '3px 8px', borderRadius: 6,
          fontSize: 11,
          background: project.status === 'ready' ? 'rgba(34,197,94,0.1)' : project.status === 'failed' ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)',
          color: project.status === 'ready' ? '#22c55e' : project.status === 'failed' ? '#ef4444' : '#fbbf24',
        }}>
          ● {project.status}
        </span>
      </div>
    </motion.div>
  );
}
