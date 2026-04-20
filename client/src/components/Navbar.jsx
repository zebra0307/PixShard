import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Layers, LogOut, LayoutDashboard, Plus, KeyRound } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(8,8,15,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 24px', height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}
    >
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Layers size={16} color="#fff" />
        </div>
        <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 18, color: '#f1f5f9' }}>
          Pix<span style={{ color: '#7c3aed' }}>Shard</span>
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {user ? (
          <>
            <Link to="/dashboard" style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              borderRadius: 8, background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8',
              textDecoration: 'none', fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
            }}>
              <LayoutDashboard size={14} /> Dashboard
            </Link>
            <Link to="/create" style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600,
            }}>
              <Plus size={14} /> New Shard
            </Link>
            <Link to="/reconstruct" style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              borderRadius: 8, background: 'rgba(6,182,212,0.10)',
              border: '1px solid rgba(6,182,212,0.2)', color: '#06b6d4',
              textDecoration: 'none', fontSize: 13, fontWeight: 600,
            }}>
              <KeyRound size={14} /> Reconstruct
            </Link>
            <button onClick={handleLogout} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
              borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
              color: '#64748b', cursor: 'pointer', fontSize: 13, transition: 'color 0.2s',
            }}>
              <LogOut size={14} />
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{
              padding: '7px 16px', borderRadius: 8, color: '#94a3b8',
              textDecoration: 'none', fontSize: 13, fontWeight: 500,
            }}>Login</Link>
            <Link to="/register" style={{
              padding: '7px 16px', borderRadius: 8,
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600,
            }}>Get Started</Link>
          </>
        )}
      </div>
    </motion.nav>
  );
}
