import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { firebaseMsg } from '../firebase/firebaseErrors';
import toast from 'react-hot-toast';
import { LogIn } from 'lucide-react';

// Google SVG icon (official brand colours)
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const Divider = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
    <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
    <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>or continue with email</span>
    <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
  </div>
);

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(firebaseMsg(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error(firebaseMsg(err.code));
      }
    } finally {
      setGLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="card"
        style={{ width: '100%', maxWidth: 400, borderRadius: 'var(--radius-xl)', padding: '2.25rem' }}
      >
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          Sign In
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Welcome back to PixShard
        </p>

        {/* Google button */}
        <motion.button
          whileHover={{ translateY: -1 }} whileTap={{ scale: 0.98 }}
          onClick={handleGoogle}
          disabled={gLoading}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem',
            padding: '0.625rem', borderRadius: 'var(--radius-md)',
            background: 'var(--bg-soft)', border: '1px solid var(--border-soft)',
            color: 'var(--text-secondary)', fontFamily: 'inherit', fontSize: '0.875rem',
            fontWeight: 500, cursor: gLoading ? 'not-allowed' : 'pointer',
            opacity: gLoading ? 0.6 : 1, transition: 'var(--transition)',
          }}
          aria-label="Sign in with Google"
        >
          <GoogleIcon />
          {gLoading ? 'Opening…' : 'Continue with Google'}
        </motion.button>

        <Divider />

        {/* Email / password form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
              Email
            </label>
            <input
              id="login-email" type="email" placeholder="you@example.com"
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
              Password
            </label>
            <input
              id="login-password" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required
            />
          </div>

          <motion.button
            whileHover={{ translateY: -1, boxShadow: 'var(--shadow-primary)' }}
            whileTap={{ scale: 0.98 }}
            type="submit" disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem', padding: '0.7rem', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            aria-label="Sign in with email and password"
          >
            <LogIn size={15} />
            {loading ? 'Signing in…' : 'Sign In'}
          </motion.button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          No account?{' '}
          <Link to="/register" style={{ color: '#A78BFA', fontWeight: 600, textDecoration: 'none' }}>Create one</Link>
        </p>
      </motion.div>
    </div>
  );
}
