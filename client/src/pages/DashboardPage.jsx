import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ProjectCard from '../components/ProjectCard';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';
import { Plus, FolderOpen } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/share')
      .then(({ data }) => setProjects(data))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id) => setProjects(p => p.filter(x => x._id !== id));

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem' }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}
      >
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            My <span style={{ color: 'var(--color-primary)' }}>Shards</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {user?.displayName || user?.email?.split('@')[0]}'s secret sharing projects
          </p>
        </div>
        <motion.button
          whileHover={{ translateY: -1, boxShadow: 'var(--shadow-primary)' }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary"
          onClick={() => navigate('/create')}
          aria-label="Create new shard project"
        >
          <Plus size={15} /> New Shard
        </motion.button>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
          <div className="spinner" aria-label="Loading projects" />
        </div>

      ) : projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '5rem 1.5rem' }}
        >
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-soft)', border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}>
            <FolderOpen size={24} color="var(--text-faint)" />
          </div>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            No shards yet
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', maxWidth: 340, margin: '0 auto 1.5rem' }}>
            Upload an image and choose a sharing scheme to create your first project.
          </p>
          <button className="btn-primary" onClick={() => navigate('/create')}>
            Create First Shard
          </button>
        </motion.div>

      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1rem' }}>
          {projects.map(p => <ProjectCard key={p._id} project={p} onDelete={handleDelete} />)}
        </div>
      )}
    </div>
  );
}
