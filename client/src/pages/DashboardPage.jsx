import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ProjectCard from '../components/ProjectCard';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';
import { Plus, FolderOpen, Loader } from 'lucide-react';

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
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif' }}>
            My <span className="grad-text">Shards</span>
          </h1>
          <p style={{ color: '#64748b', fontsize: 14, marginTop: 4 }}>
            {user?.displayName || user?.email?.split('@')[0]}'s secret sharing projects
          </p>
        </div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/create')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px',
            borderRadius: 12, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            color: '#fff', fontWeight: 700, fontSize: 14,
          }}>
          <Plus size={16} /> New Shard
        </motion.button>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <Loader size={32} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : projects.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '100px 24px' }}>
          <FolderOpen size={56} color="#334155" style={{ margin: '0 auto 20px', display: 'block' }} />
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>No shards yet</h2>
          <p style={{ color: '#475569', fontSize: 14, marginBottom: 28 }}>Upload an image and choose a scheme to generate your first shard project.</p>
          <motion.button whileHover={{ scale: 1.04 }} onClick={() => navigate('/create')}
            style={{
              padding: '12px 28px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', fontWeight: 700,
            }}>
            Create First Shard
          </motion.button>
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {projects.map(p => <ProjectCard key={p._id} project={p} onDelete={handleDelete} />)}
        </div>
      )}
    </div>
  );
}
