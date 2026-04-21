import { useNavigate } from 'react-router-dom';
import { Layers, Cpu, Shield, ArrowRight, Lock, Share2, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const Feature = ({ icon, title, desc, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.4 }}
    className="card"
    style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}
  >
    <div style={{
      width: 38, height: 38, borderRadius: 'var(--radius-md)',
      background: 'var(--bg-soft)',
      border: '1px solid var(--border-subtle)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: '1rem',
      color: 'var(--color-primary)',
    }}>
      {icon}
    </div>
    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
      {title}
    </h3>
    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>{desc}</p>
  </motion.div>
);

const SchemeCard = ({ name, formula, desc, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.4 }}
    className="card"
    style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}
  >
    <code style={{
      display: 'inline-block',
      padding: '0.2rem 0.75rem',
      borderRadius: 'var(--radius-pill)',
      fontSize: '0.875rem',
      fontWeight: 700,
      background: 'rgba(124,58,237,0.1)',
      border: '1px solid rgba(124,58,237,0.2)',
      color: '#A78BFA',
      marginBottom: '0.875rem',
      letterSpacing: '0.01em',
    }}>
      {formula}
    </code>
    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
      {name}
    </h3>
    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>{desc}</p>
  </motion.div>
);

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <main style={{ minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section id="hero" style={{
        padding: 'clamp(5rem, 12vh, 7rem) 1.5rem 5rem',
        maxWidth: 700,
        margin: '0 auto',
        textAlign: 'center',
      }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

          {/* Eyebrow label */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '0.3rem 0.875rem',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--bg-soft)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '1.75rem',
          }}>
            <Layers size={11} color="var(--color-primary)" />
            Secret Image Sharing
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(2.25rem, 5vw, 3.25rem)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            color: 'var(--text-primary)',
            marginBottom: '1.5rem',
          }}>
            Split your image.<br />
            <span style={{ color: 'var(--color-primary)' }}>Share the secret.</span>
          </h1>

          {/* Sub-headline */}
          <p style={{
            fontSize: '1.0625rem',
            color: 'var(--text-muted)',
            maxWidth: 520,
            margin: '0 auto 2rem',
            lineHeight: 1.65,
          }}>
            PixShard implements cryptographic secret sharing schemes that split any image
            into <strong style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>n shares</strong>,
            requiring <strong style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>k</strong> to
            reconstruct — lossless, provably secure.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ translateY: -2, boxShadow: '0 8px 28px rgba(124,58,237,0.28)' }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary"
              style={{ padding: '0.75rem 1.625rem', fontSize: '0.9375rem' }}
              onClick={() => navigate('/register')}
              aria-label="Get started with PixShard"
            >
              Get Started <ArrowRight size={15} />
            </motion.button>
            <motion.button
              whileHover={{ translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              className="btn-secondary"
              style={{ padding: '0.75rem 1.625rem', fontSize: '0.9375rem' }}
              onClick={() => navigate('/login')}
              aria-label="Sign in to your account"
            >
              Sign In
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ── Schemes ────────────────────────────────────────────────────── */}
      <section style={{ padding: '2rem 1.5rem 3.5rem', maxWidth: 860, margin: '0 auto' }}>
        <motion.h2
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          style={{
            textAlign: 'center',
            fontSize: '1.375rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '1.75rem',
            letterSpacing: '-0.02em',
          }}
        >
          Two cryptographic schemes
        </motion.h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <SchemeCard
            name="Standard Secret Sharing"
            formula="(k, n)"
            delay={0.05}
            desc="Any k shares out of n can reconstruct the original image. Uses Shamir's polynomial interpolation over GF(257) — mathematically lossless for any image."
          />
          <SchemeCard
            name="Essential Secret Sharing"
            formula="(t, k, n)"
            delay={0.1}
            desc="Extends (k, n) with t 'essential' participants who must all be present. Even with k shares, reconstruction fails without every essential participant."
          />
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section style={{ padding: '0 1.5rem 6rem', maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
          <Feature delay={0.05} icon={<Lock size={18} />} title="Lossless Reconstruction" desc="Arithmetic over GF(257) guarantees exact pixel-perfect reconstruction — no floating-point errors." />
          <Feature delay={0.1} icon={<Shield size={18} />} title="Essential Participants" desc="Designated participants carry cryptographic weight. Missing any one makes reconstruction impossible." />
          <Feature delay={0.15} icon={<Download size={18} />} title="Download as ZIP" desc="Download all shares or public metadata as ZIP bundles — ready to distribute." />
        </div>
      </section>

    </main>
  );
}
