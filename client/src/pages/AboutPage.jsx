import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layers, Shield, Cpu, ArrowRight, BookOpen, GitBranch } from 'lucide-react';

const Section = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.4 }}
  >
    {children}
  </motion.div>
);

const SchemeCard = ({ icon, formula, name, description, steps, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.4 }}
    className="card"
    style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)' }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--radius-md)',
        background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--color-primary)',
      }}>
        {icon}
      </div>
      <code style={{
        padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-pill)',
        background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)',
        color: '#A78BFA', fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.02em',
      }}>
        {formula}
      </code>
    </div>

    <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
      {name}
    </h3>
    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '1.25rem' }}>
      {description}
    </p>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          <span style={{
            flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
            background: 'rgba(124,58,237,0.12)', color: '#A78BFA',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, marginTop: 1,
          }}>
            {i + 1}
          </span>
          {s}
        </div>
      ))}
    </div>
  </motion.div>
);

const StatCard = ({ value, label }) => (
  <div className="card" style={{ padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
    <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>{value}</p>
    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{label}</p>
  </div>
);

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <main style={{ minHeight: '100vh' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(4rem, 10vh, 6rem) 1.5rem 3rem', textAlign: 'center' }}>
        <Section>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '0.3rem 0.875rem', borderRadius: 'var(--radius-pill)',
            background: 'var(--bg-soft)', border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)', fontSize: '0.6875rem',
            fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
            marginBottom: '1.5rem',
          }}>
            <BookOpen size={11} color="var(--color-primary)" />
            About PixShard
          </div>

          <h1 style={{
            fontSize: 'clamp(1.875rem, 4.5vw, 2.75rem)',
            fontWeight: 700, letterSpacing: '-0.03em',
            color: 'var(--text-primary)', lineHeight: 1.15, marginBottom: '1.25rem',
          }}>
            Cryptographic image sharing<br />
            <span style={{ color: 'var(--color-primary)' }}>built on Shamir's schemes</span>
          </h1>

          <p style={{ fontSize: '1.0625rem', color: 'var(--text-muted)', lineHeight: 1.65, maxWidth: 580, margin: '0 auto 2rem' }}>
            PixShard implements the <strong style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>(k, n)</strong> Standard
            and <strong style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>(t, k, n)</strong> Essential Shamir's Secret
            Sharing schemes, enabling lossless, provably secure image splitting and reconstruction.
          </p>

          <button
            className="btn-primary"
            style={{ fontSize: '0.9375rem', padding: '0.7rem 1.5rem' }}
            onClick={() => navigate('/register')}
          >
            Try It Free <ArrowRight size={15} />
          </button>
        </Section>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '0 1.5rem 3.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          <StatCard value="GF(257)" label="Prime finite field" />
          <StatCard value="2 schemes" label="Standard + Essential" />
          <StatCard value="Lossless" label="Pixel-perfect reconstruction" />
          <StatCard value="∞" label="Image formats supported" />
        </div>
      </section>

      {/* ── Schemes ──────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem 3.5rem' }}>
        <Section>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <p className="label-caps" style={{ marginBottom: '0.625rem' }}>The Mathematics</p>
            <h2 style={{ fontSize: 'clamp(1.375rem, 3vw, 1.875rem)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Two cryptographic schemes
            </h2>
          </div>
        </Section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          <SchemeCard
            delay={0.05}
            icon={<Cpu size={20} />}
            formula="(k, n)"
            name="Standard Secret Sharing"
            description="Split an image into n shares such that any k of them can reconstruct the original — but any k-1 or fewer reveals nothing about the image."
            steps={[
              'Choose a prime field GF(257) and construct a random degree-(k-1) polynomial f(x)',
              'Each of the n shares is a point (i, f(i)) on this polynomial',
              'Reconstruction uses Lagrange interpolation on k points to recover f(0)',
              'Applied pixel-by-pixel across all RGB channels with vectorised NumPy',
            ]}
          />
          <SchemeCard
            delay={0.1}
            icon={<Shield size={20} />}
            formula="(t, k, n)"
            name="Essential Secret Sharing"
            description="Extends (k, n) with a set of t 'essential' shares that must all participate. Even with k shares, reconstruction is impossible if any essential participant is absent."
            steps={[
              'Partition shares into essential (1…t) and regular (t+1…n) participants',
              'Construct a Vandermonde matrix A ∈ GF(257) tying essential shares to the secret',
              'Public vector b encodes the required essential constraint',
              'Reconstruction requires all t essential shares plus any (k-t) regular shares',
            ]}
          />
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '0 1.5rem 5rem' }}>
        <Section>
          <div className="card" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.5rem' }}>
              <GitBranch size={16} color="var(--color-primary)" />
              <p className="label-caps">How PixShard works</p>
            </div>
            {[
              { step: '01', title: 'Upload',       desc: 'Upload any image (JPG, PNG, BMP). PixShard reads pixel values into a NumPy array.' },
              { step: '02', title: 'Parameterise', desc: 'Choose Standard (k, n) or Essential (t, k, n) and set your thresholds.' },
              { step: '03', title: 'Encrypt',      desc: 'Python applies GF(257) polynomial splitting, generating n binary .npy share files.' },
              { step: '04', title: 'Distribute',   desc: 'Download shares as a ZIP. Each participant receives exactly one share.' },
              { step: '05', title: 'Reconstruct',  desc: 'Upload k (or k + all-essential) shares back to recover the pixel-perfect original.' },
            ].map(({ step, title, desc }) => (
              <div key={step} style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{
                  flexShrink: 0, width: 32, height: 32, borderRadius: 'var(--radius-md)',
                  background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.6875rem', fontWeight: 700, color: '#A78BFA', letterSpacing: '0.02em',
                }}>
                  {step}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{title}</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </section>

    </main>
  );
}
