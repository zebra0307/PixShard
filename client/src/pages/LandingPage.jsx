import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layers, Cpu, Shield, ArrowRight } from 'lucide-react';

const FeatureCard = ({ icon, title, desc, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    viewport={{ once: true }}
    className="glass"
    style={{ borderRadius: 16, padding: 28 }}
  >
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.2))',
      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    }}>
      {icon}
    </div>
    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#f1f5f9' }}>{title}</h3>
    <p style={{ fontSize: 13, lineHeight: 1.7, color: '#64748b' }}>{desc}</p>
  </motion.div>
);

const SchemeBox = ({ name, formula, desc, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.4 }}
    className="glass"
    style={{ borderRadius: 16, padding: 28, borderLeft: `3px solid ${color}` }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <code style={{
        padding: '4px 12px', borderRadius: 8, fontSize: 15, fontWeight: 700,
        background: `${color}18`, color,
      }}>{formula}</code>
    </div>
    <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: '#e2e8f0' }}>{name}</h3>
    <p style={{ fontSize: 13, lineHeight: 1.7, color: '#64748b' }}>{desc}</p>
  </motion.div>
);

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Hero */}
      <section style={{ padding: '100px 24px 80px', textAlign: 'center', position: 'relative' }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 400, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 20,
            border: '1px solid rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.08)',
            color: '#a78bfa', fontSize: 12, fontWeight: 600, marginBottom: 28, letterSpacing: '0.05em',
          }}>
            <Layers size={13} /> SECRET IMAGE SHARING
          </div>

          <h1 style={{
            fontSize: 'clamp(40px, 7vw, 72px)', fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 800, lineHeight: 1.1, marginBottom: 24, color: '#f1f5f9',
          }}>
            Split your image.<br />
            <span className="grad-text">Share the secret.</span>
          </h1>

          <p style={{ fontSize: 17, color: '#64748b', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
            PixShard implements cryptographic secret sharing schemes that split
            any image into <strong style={{ color: '#94a3b8' }}>n shares</strong>,
            requiring <strong style={{ color: '#94a3b8' }}>k</strong> to reconstruct — zero loss, zero compromise.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/register')}
              style={{
                padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                color: '#fff', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              Get Started <ArrowRight size={16} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/login')}
              style={{
                padding: '14px 32px', borderRadius: 12, cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#94a3b8', fontWeight: 600, fontSize: 15,
              }}
            >
              Sign In
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Schemes */}
      <section style={{ padding: '60px 24px', maxWidth: 900, margin: '0 auto' }}>
        <motion.h2
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, marginBottom: 40, color: '#e2e8f0' }}
        >
          Two Cryptographic Schemes
        </motion.h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          <SchemeBox
            name="Standard Secret Sharing"
            formula="(k, n)"
            color="#06b6d4"
            delay={0.1}
            desc="Any k shares out of n can reconstruct the original image. Uses Shamir's polynomial interpolation over GF(257) — mathematically lossless for any image."
          />
          <SchemeBox
            name="Essential Secret Sharing"
            formula="(t, k, n)"
            color="#a855f7"
            delay={0.2}
            desc="Extends (k,n) with t 'essential' participants who must be present. Even with k shares, reconstruction fails without all t essential holders."
          />
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '40px 24px 100px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          <FeatureCard delay={0.1} icon={<Cpu size={20} color="#06b6d4" />} title="Lossless Reconstruction" desc="Arithmetic over GF(257) guarantees exact pixel-perfect reconstruction — no floating-point errors." />
          <FeatureCard delay={0.2} icon={<Shield size={20} color="#a855f7" />} title="Essential Participants" desc="t designated participants carry cryptographic weight. Missing any one makes reconstruction mathematically impossible." />
          <FeatureCard delay={0.3} icon={<Layers size={20} color="#f59e0b" />} title="Download as ZIP" desc="Download all shares or public metadata as ZIP bundles — ready to distribute to your participants." />
        </div>
      </section>
    </div>
  );
}
