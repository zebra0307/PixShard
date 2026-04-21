import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, LogOut, LayoutDashboard, Plus, KeyRound } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="navbar" aria-label="Main navigation">
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'var(--color-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Layers size={15} color="#fff" />
        </div>
        <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Pix<span style={{ color: 'var(--color-primary)' }}>Shard</span>
        </span>
      </Link>

      {/* Nav actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {user ? (
          <>
            <Link to="/dashboard" className="nav-link" aria-label="Dashboard">
              <LayoutDashboard size={13} /> Dashboard
            </Link>
            <Link to="/reconstruct" className="nav-link" aria-label="Reconstruct image">
              <KeyRound size={13} /> Reconstruct
            </Link>
            <Link to="/create" className="btn-primary" style={{ fontSize: '0.8125rem', padding: '0.4rem 0.875rem' }} aria-label="Create new shard">
              <Plus size={13} /> New Shard
            </Link>
            <button onClick={handleLogout} className="btn-icon" aria-label="Sign out">
              <LogOut size={14} />
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="btn-primary" style={{ fontSize: '0.8125rem', padding: '0.4rem 0.875rem' }}>
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
