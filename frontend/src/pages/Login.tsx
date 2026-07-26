import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Zap, ShieldCheck, BarChart3, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const features = [
  {
    icon: <Zap size={14} />,
    title: 'AI-Powered Feedback',
    desc: 'Real-time code analysis and hints',
  },
  {
    icon: <ShieldCheck size={14} />,
    title: 'Secure & Proctored',
    desc: 'Tab-switch detection, zero cheating',
  },
  {
    icon: <BarChart3 size={14} />,
    title: 'Deep Analytics',
    desc: 'Track every candidate in detail',
  },
];

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* ── Ambient background ── */}
      <div className="login-bg-orb login-bg-orb--1" />
      <div className="login-bg-orb login-bg-orb--2" />
      <div className="login-bg-orb login-bg-orb--3" />
      <div className="login-dot-grid" />

      {/* ── Left panel ── */}
      <div className="login-left">
        {/* Brand */}
        <div className="login-brand">
          <div className="login-brand-icon">C7</div>
          <div>
            <span className="login-brand-name">Code7</span>
            <span className="login-brand-sub">Coding Platform</span>
          </div>
        </div>

        {/* Hero */}
        <div className="login-hero">
          <div className="login-live-pill">
            <span className="login-live-dot" />
            Live Platform
          </div>

          <h1 className="login-headline">
            Assess &amp;&nbsp;
            <span className="login-headline-gradient">Elevate</span>
            <br />
            Your Team
          </h1>

          <p className="login-subheadline">
            A modern technical hiring platform built for speed,
            accuracy, and exceptional candidate experience.
          </p>

          {/* Feature list */}
          <ul className="login-features">
            {features.map((f, i) => (
              <li key={i} className="login-feature-item" style={{ animationDelay: `${i * 100}ms` }}>
                <span className="login-feature-icon">{f.icon}</span>
                <div>
                  <p className="login-feature-title">{f.title}</p>
                  <p className="login-feature-desc">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Social proof */}
          <div className="login-social-proof">
            <div className="login-avatar-stack">
              {['A', 'B', 'C', 'D'].map((l, i) => (
                <div key={i} className="login-avatar" style={{ marginLeft: i ? '-8px' : 0 }}>
                  {l}
                </div>
              ))}
            </div>
            <p className="login-social-text">
              Trusted by <span>500+</span> engineering teams
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="login-left-footer">© 2025 Code7 Platform · Built for excellence</p>
      </div>

      {/* ── Divider ── */}
      <div className="login-divider" />

      {/* ── Right panel – Form ── */}
      <div className="login-right">
        {/* Mobile brand */}
        <div className="login-mobile-brand">
          <div className="login-brand-icon">C7</div>
          <span className="login-brand-name">Code7</span>
        </div>

        <div className="login-card">
          {/* Card header */}
          <div className="login-card-header">
            <div className="login-card-icon-wrap">
              <CheckCircle2 size={22} className="login-card-icon" />
            </div>
            <h2 className="login-card-title">Welcome back</h2>
            <p className="login-card-subtitle">
              Sign in to your <span>Code7</span> account
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="login-error" role="alert">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {/* Email field */}
            <div className="login-field">
              <label className="login-label" htmlFor="login-email">
                Email Address
              </label>
              <div className="login-input-wrap">
                <Mail size={15} className="login-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                  placeholder="name@example.com"
                  autoComplete="new-email"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="login-field">
              <div className="login-label-row">
                <label className="login-label" htmlFor="login-password">
                  Password
                </label>
                <a href="#" className="login-forgot">Forgot password?</a>
              </div>
              <div className="login-input-wrap">
                <Lock size={15} className="login-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="login-eye-btn"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="login-submit"
            >
              {loading ? (
                <span className="login-spinner" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} className="login-submit-arrow" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="login-or">
            <span />
            <p>or try a demo account</p>
            <span />
          </div>

          {/* Demo credentials */}
          <div className="login-demo-grid">
            {[
              {
                role: 'Admin',
                email: 'admin@example.com',
                password: 'Admin123!',
                icon: '⚙️',
                color: 'indigo',
              },
              {
                role: 'Candidate',
                email: 'candidate@example.com',
                password: 'Candidate123!',
                icon: '🧑‍💻',
                color: 'purple',
              },
            ].map((d) => (
              <button
                key={d.role}
                type="button"
                onClick={() => {
                  setEmail(d.email);
                  setPassword(d.password);
                }}
                className={`login-demo-btn login-demo-btn--${d.color}`}
              >
                <span className="login-demo-icon">{d.icon}</span>
                <div className="login-demo-info">
                  <p className="login-demo-role">{d.role}</p>
                  <p className="login-demo-email">{d.email}</p>
                </div>
                <span className="login-demo-fill">Use →</span>
              </button>
            ))}
          </div>

          {/* Register link */}
          <p className="login-register-link">
            Don't have an account?{' '}
            <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
