import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, ShieldCheck, UserPlus, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

const roleGuide = [
  {
    role: 'Candidate',
    desc: 'Practice problems and complete assessments assigned to you.',
    icon: '🧑‍💻',
  },
  {
    role: 'Admin',
    desc: 'Create assessments, manage questions, and track candidate results.',
    icon: '⚙️',
  },
];

export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'candidate' | 'admin'>('candidate');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, fullName, role);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* ── Ambient background ── */}
      <div className="login-bg-orb login-bg-orb--reg1" />
      <div className="login-bg-orb login-bg-orb--reg2" />
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
            Join Today — Free
          </div>

          <h1 className="login-headline">
            Start Your&nbsp;
            <span className="login-headline-gradient">Journey</span>
            <br />
            Today
          </h1>

          <p className="login-subheadline">
            Create your account in seconds and join thousands of engineers sharpening their skills on Code7.
          </p>

          {/* Role descriptions */}
          <ul className="login-features">
            {roleGuide.map((r, i) => (
              <li key={i} className="login-feature-item">
                <span className="login-feature-icon" style={{ fontSize: '1rem' }}>
                  {r.icon}
                </span>
                <div>
                  <p className="login-feature-title">{r.role}</p>
                  <p className="login-feature-desc">{r.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

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
            <h2 className="login-card-title">Create account</h2>
            <p className="login-card-subtitle">
              Join <span>Code7</span> today
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
            {/* Full Name */}
            <div className="login-field">
              <label className="login-label" htmlFor="reg-name">Full Name</label>
              <div className="login-input-wrap">
                <User size={15} className="login-input-icon" />
                <input
                  id="reg-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="login-input"
                  placeholder="John Doe"
                  autoComplete="name"
                  required
                  minLength={2}
                />
              </div>
            </div>

            {/* Email */}
            <div className="login-field">
              <label className="login-label" htmlFor="reg-email">Email Address</label>
              <div className="login-input-wrap">
                <Mail size={15} className="login-input-icon" />
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field">
              <label className="login-label" htmlFor="reg-password">Password</label>
              <div className="login-input-wrap">
                <Lock size={15} className="login-input-icon" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  required
                  minLength={6}
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

            {/* Role selector */}
            <div className="login-field">
              <label className="login-label">Account Role</label>
              <div className="reg-role-grid">
                {(['candidate', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`reg-role-btn ${role === r ? 'reg-role-btn--active' : ''}`}
                  >
                    <ShieldCheck size={14} className={role === r ? 'reg-role-icon--active' : 'reg-role-icon'} />
                    <span className="capitalize">{r}</span>
                    {role === r && <span className="reg-role-check">✓</span>}
                  </button>
                ))}
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
                  <UserPlus size={16} />
                  Get Started
                </>
              )}
            </button>
          </form>

          {/* Sign in link */}
          <p className="login-register-link" style={{ marginTop: '1.25rem' }}>
            Already have an account?{' '}
            <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
