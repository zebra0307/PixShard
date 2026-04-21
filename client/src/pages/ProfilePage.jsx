import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from 'firebase/auth';
import { auth } from '../firebase/config';
import toast from 'react-hot-toast';
import { User, Mail, Edit3, Check, X } from 'lucide-react';

const Avatar = ({ user, size = 80 }) => {
  const initials = (user?.displayName || user?.email || 'U').charAt(0).toUpperCase();
  if (user?.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt={user.displayName || 'Profile photo'}
        referrerPolicy="no-referrer"
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', border: '2px solid var(--border-soft)',
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--color-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.38,
      border: '2px solid var(--border-soft)',
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
};

export default function ProfilePage() {
  const { user } = useAuth();

  const [editing,  setEditing]  = useState(false);
  const [name,     setName]     = useState(user?.displayName || '');
  const [saving,   setSaving]   = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name cannot be empty'); return; }
    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name.trim() });
      await auth.currentUser.reload();
      toast.success('Display name updated');
      setEditing(false);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.displayName || '');
    setEditing(false);
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        {/* Page title */}
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '2rem' }}>
          Profile
        </h1>

        {/* Avatar + identity card */}
        <div className="card" style={{ borderRadius: 'var(--radius-xl)', padding: '2rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.75rem' }}>
            <Avatar user={user} size={72} />
            <div>
              <p style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                {user?.displayName || 'No name set'}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {user?.email}
              </p>
              {user?.providerData?.[0]?.providerId === 'google.com' && (
                <span className="badge badge-cyan" style={{ marginTop: '0.5rem' }}>
                  Google account
                </span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--border-subtle)', marginBottom: '1.5rem' }} />

          {/* Display name field */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              <User size={11} /> Display Name
            </label>
            {editing ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
                  autoFocus
                  style={{ flex: 1 }}
                  placeholder="Your display name"
                />
                <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: '0.5rem 0.875rem', borderRadius: 'var(--radius-md)' }} aria-label="Save name">
                  {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={14} />}
                </button>
                <button onClick={handleCancel} className="btn-secondary" style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)' }} aria-label="Cancel">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5625rem 0.875rem', background: 'var(--bg-soft)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  {user?.displayName || <span style={{ color: 'var(--text-faint)' }}>Not set</span>}
                </span>
                <button onClick={() => setEditing(true)} className="btn-icon" style={{ padding: '0.3rem' }} aria-label="Edit display name">
                  <Edit3 size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Email field — read only */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              <Mail size={11} /> Email Address
            </label>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5625rem 0.875rem', background: 'var(--bg-soft)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {user?.email}
              </span>
              <span className="badge" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ADE80', fontSize: '0.6875rem' }}>
                verified
              </span>
            </div>
          </div>
        </div>

        {/* Account info card */}
        <div className="card" style={{ borderRadius: 'var(--radius-xl)', padding: '1.5rem' }}>
          <p className="label-caps" style={{ marginBottom: '0.875rem' }}>Account details</p>
          {[
            { label: 'User ID',       value: user?.uid },
            { label: 'Joined',        value: user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
            { label: 'Last sign-in',  value: user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontFamily: label === 'User ID' ? 'monospace' : 'inherit', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {value}
              </span>
            </div>
          ))}
        </div>

      </motion.div>
    </div>
  );
}
