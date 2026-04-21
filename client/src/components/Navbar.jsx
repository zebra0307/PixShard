import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  Layers, User, LayoutDashboard, LogOut, Menu, X,
  Plus, KeyRound, ChevronDown,
} from 'lucide-react';

/* ── Avatar ───────────────────────────────────────────────────────────────── */
const Avatar = ({ user, size = 32 }) => {
  const initials = (user?.displayName || user?.email || 'U').charAt(0).toUpperCase();
  if (user?.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt={user.displayName || 'Profile'}
        referrerPolicy="no-referrer"
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--color-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.4,
      flexShrink: 0, userSelect: 'none',
    }}>
      {initials}
    </div>
  );
};

/* ── Dropdown item ────────────────────────────────────────────────────────── */
const DropItem = ({ icon, label, onClick, danger }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: '0.625rem',
      width: '100%', padding: '0.5rem 0.75rem',
      background: 'none', border: 'none', borderRadius: 'var(--radius-md)',
      color: danger ? '#F87171' : 'var(--text-secondary)',
      fontSize: '0.875rem', fontWeight: 500, fontFamily: 'inherit',
      cursor: 'pointer', textAlign: 'left', transition: 'var(--transition)',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.08)' : 'var(--bg-soft)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
  >
    {icon}
    {label}
  </button>
);

/* ── Navbar ───────────────────────────────────────────────────────────────── */
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();

  const [dropdownOpen, setDropdown] = useState(false);
  const [mobileOpen,   setMobile]   = useState(false);
  const [scrolled,     setScrolled] = useState(false);
  const [isMobile,     setIsMobile] = useState(window.innerWidth < 768);
  const dropRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobile(false); setDropdown(false); }, [location.pathname]);

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Responsive
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const scrollToSection = (id) => {
    if (location.pathname !== '/') { navigate('/'); setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100); }
    else { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }
    setMobile(false);
  };

  const CenterLink = ({ to, label, onClick }) => {
    const active = to ? location.pathname === to : false;
    return (
      <button
        onClick={onClick || (() => navigate(to))}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: '0.875rem', fontWeight: 500,
          color: active ? 'var(--text-primary)' : 'var(--text-muted)',
          padding: '0.375rem 0.875rem', borderRadius: 'var(--radius-md)',
          transition: 'var(--transition)',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = active ? 'var(--text-primary)' : 'var(--text-muted)'; }}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      {/* ── Nav bar ─────────────────────────────────────────────────────── */}
      <nav
        aria-label="Main navigation"
        style={{
          position: 'sticky', top: 0, zIndex: 100,
          height: 56,
          background: 'rgba(5,8,22,0.92)',
          borderBottom: `1px solid ${scrolled ? 'var(--border-subtle)' : 'transparent'}`,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          padding: '0 1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'border-color 200ms ease',
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Layers size={14} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Pix<span style={{ color: 'var(--color-primary)' }}>Shard</span>
          </span>
        </Link>

        {/* Center links — desktop */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <CenterLink label="Home" onClick={() => scrollToSection('hero')} />
            <CenterLink to="/about" label="About" />
          </div>
        )}

        {/* Right side — desktop */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {user ? (
              <>
                <Link to="/create" className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.375rem 0.875rem' }}>
                  <Plus size={13} /> New Shard
                </Link>
                <Link to="/reconstruct" className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.375rem 0.875rem' }}>
                  <KeyRound size={13} /> Reconstruct
                </Link>

                {/* Profile avatar + dropdown */}
                <div ref={dropRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setDropdown(o => !o)}
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                    aria-label="Open profile menu"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: 'var(--bg-soft)', border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-pill)', padding: '4px 10px 4px 4px',
                      cursor: 'pointer', transition: 'var(--transition)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-soft)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                  >
                    <Avatar user={user} size={26} />
                    <ChevronDown size={13} color="var(--text-muted)" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -6 }}
                        transition={{ duration: 0.14, ease: 'easeOut' }}
                        style={{
                          position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                          width: 220, background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-lg)',
                          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                          padding: '0.5rem',
                          transformOrigin: 'top right',
                        }}
                        role="menu"
                      >
                        {/* User info */}
                        <div style={{ padding: '0.5rem 0.75rem 0.625rem', marginBottom: '0.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
                          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.displayName || 'User'}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.email}
                          </p>
                        </div>

                        <div style={{ marginTop: '0.375rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <DropItem icon={<User size={14} />}          label="Profile"   onClick={() => { setDropdown(false); navigate('/profile'); }} />
                          <DropItem icon={<LayoutDashboard size={14} />} label="Workspace" onClick={() => { setDropdown(false); navigate('/dashboard'); }} />
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '0.375rem', paddingTop: '0.375rem' }}>
                          <DropItem icon={<LogOut size={14} />} label="Log out" onClick={handleLogout} danger />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link to="/login"    className="nav-link">Login</Link>
                <Link to="/register" className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.875rem' }}>Get Started</Link>
              </>
            )}
          </div>
        )}

        {/* Hamburger — mobile */}
        {isMobile && (
          <button
            onClick={() => setMobile(o => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="btn-icon"
            style={{ padding: '0.45rem' }}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        )}
      </nav>

      {/* ── Mobile drawer ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'sticky', top: 56, zIndex: 99,
              background: 'var(--bg-elevated)',
              borderBottom: '1px solid var(--border-subtle)',
              padding: '0.75rem 1.25rem 1rem',
              display: 'flex', flexDirection: 'column', gap: '0.25rem',
            }}
          >
            <button onClick={() => scrollToSection('hero')} className="nav-link" style={{ justifyContent: 'flex-start', width: '100%' }}>Home</button>
            <Link to="/about" className="nav-link" style={{ width: '100%' }} onClick={() => setMobile(false)}>About</Link>

            {user ? (
              <>
                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0.5rem 0' }} />
                {/* User info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.5rem' }}>
                  <Avatar user={user} size={30} />
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user.displayName || 'User'}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</p>
                  </div>
                </div>
                <Link to="/profile"   className="nav-link" style={{ width: '100%' }} onClick={() => setMobile(false)}><User size={13} /> Profile</Link>
                <Link to="/dashboard" className="nav-link" style={{ width: '100%' }} onClick={() => setMobile(false)}><LayoutDashboard size={13} /> Workspace</Link>
                <Link to="/create"    className="nav-link" style={{ width: '100%' }} onClick={() => setMobile(false)}><Plus size={13} /> New Shard</Link>
                <Link to="/reconstruct" className="nav-link" style={{ width: '100%' }} onClick={() => setMobile(false)}><KeyRound size={13} /> Reconstruct</Link>
                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0.375rem 0' }} />
                <button onClick={handleLogout} className="nav-link" style={{ color: '#F87171', width: '100%', justifyContent: 'flex-start' }}>
                  <LogOut size={13} /> Log out
                </button>
              </>
            ) : (
              <>
                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0.5rem 0' }} />
                <Link to="/login"    className="nav-link" onClick={() => setMobile(false)}>Login</Link>
                <Link to="/register" className="btn-primary" style={{ marginTop: '0.25rem', justifyContent: 'center' }} onClick={() => setMobile(false)}>Get Started</Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
