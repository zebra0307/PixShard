import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { firebaseMsg } from '../firebase/firebaseErrors';
import toast from 'react-hot-toast';
import { UserPlus, Loader } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Welcome to PixShard 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(firebaseMsg(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="glass" style={{ width: '100%', maxWidth: 420, borderRadius: 20, padding: 40 }}>

        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, fontFamily: 'Space Grotesk, sans-serif' }}>Create Account</h1>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 32 }}>Start sharding images securely</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { key: 'name',     label: 'Full Name',  type: 'text',     placeholder: 'Alice' },
            { key: 'email',    label: 'Email',       type: 'email',    placeholder: 'you@example.com' },
            { key: 'password', label: 'Password',    type: 'password', placeholder: '••••••••' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>{label}</label>
              <input type={type} placeholder={placeholder} value={form[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} required />
            </div>
          ))}

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
            style={{
              marginTop: 8, padding: '12px', borderRadius: 10, border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: '#fff', fontWeight: 700, fontSize: 14, opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            {loading ? <Loader size={16} /> : <UserPlus size={16} />}
            {loading ? 'Creating…' : 'Create Account'}
          </motion.button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#64748b' }}>
          Have an account?{' '}
          <Link to="/login" style={{ color: '#a78bfa', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
