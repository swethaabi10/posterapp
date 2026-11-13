import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { user, isAuthenticated, login, loginWithGoogle, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: 'bvashwin88@gmail.com', password: 'password123' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [googleFallback, setGoogleFallback] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleChange = (e) => {
    clearError();
    setFieldErrors({});
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    const result = await login(form.email, form.password);
    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  const handleQuickLogin = async (email, password = 'password123') => {
    clearError();
    setForm({ email, password });
    setFieldErrors({});
    const res = await login(email, password);
    if (res.success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split-container">
        {/* LEFT SIDE: JEWELRY SHOWCASE & LIVE RATES */}
        <div className="auth-split-showcase">
          <div>
            <div className="showcase-badge">
              <span>💍</span> Official Jeweler Suite
            </div>
            <h1 className="showcase-heading">
              Daily Gold Rate <span>Promotional Posters</span> in Seconds
            </h1>
            <p className="showcase-subtext">
              Engineered specifically for jewelry retailers across India. Publish 22K/24K gold and silver market rates, festive greetings, and custom shop branding directly to WhatsApp and Instagram.
            </p>

            {/* Live Gold & Silver Market Bullion Box */}
            <div className="showcase-rates-box">
              <div className="rates-box-header">
                <div>
                  <span className="rates-live-pulse" />
                  Live Market Rates (Today)
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--white-50)' }}>Updated 09:30 AM IST</span>
              </div>
              <div className="rates-grid">
                <div className="rate-item">
                  <div className="rate-label">24K Pure Gold (999)</div>
                  <div className="rate-val">
                    ₹7,450<small>/g</small>
                    <span className="rate-delta">+₹35</span>
                  </div>
                </div>
                <div className="rate-item">
                  <div className="rate-label">22K Standard Gold (916)</div>
                  <div className="rate-val">
                    ₹6,890<small>/g</small>
                    <span className="rate-delta">+₹30</span>
                  </div>
                </div>
                <div className="rate-item">
                  <div className="rate-label">18K Hallmarked Gold</div>
                  <div className="rate-val">
                    ₹5,640<small>/g</small>
                  </div>
                </div>
                <div className="rate-item">
                  <div className="rate-label">Fine Silver (999)</div>
                  <div className="rate-val">
                    ₹94.50<small>/g</small>
                    <span className="rate-delta">+0.8%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="showcase-features">
              <div className="showcase-feature-item">
                <div className="showcase-feature-icon">⚡</div>
                <div>
                  <strong>Instant Generation:</strong> Create print-ready and social-ready gold rate posters in 15 seconds.
                </div>
              </div>
              <div className="showcase-feature-item">
                <div className="showcase-feature-icon">🎨</div>
                <div>
                  <strong>60+ Curated Templates:</strong> Diwali, Pongal, Akshaya Tritiya, Wedding Season & Heritage themes.
                </div>
              </div>
              <div className="showcase-feature-item">
                <div className="showcase-feature-icon">📲</div>
                <div>
                  <strong>1-Tap Social Share:</strong> Send posters directly to WhatsApp broadcast groups and Instagram stories.
                </div>
              </div>
            </div>
          </div>

          <div className="showcase-footer">
            <div>🛡️ Enterprise Cloud SQL PostgreSQL Security</div>
            <div>★★★★★ 4.9/5 by 1,200+ Jewelers</div>
          </div>
        </div>

        {/* RIGHT SIDE: AUTHENTICATION PORTAL */}
        <div className="auth-split-portal">
          <div className="auth-card">
            <div className="auth-logo">
              <div className="auth-logo-icon">💍</div>
              <div className="auth-logo-text">Poster App</div>
              <div className="auth-logo-subtitle">Jewelry Gold Rate Posters</div>
            </div>

            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-subtitle">Sign in to customize and download your jewelry rate posters</p>

            {/* 1-Click Fast-Pass Login Cards */}
            <div style={{
              background: 'rgba(232, 185, 35, 0.08)',
              border: '1px solid rgba(232, 185, 35, 0.3)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-400)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ⚡ Quick 1-Click Access
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--white-50)' }}>Instant Sign In</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: '0.78rem',
                    padding: '8px 10px',
                    textAlign: 'left',
                    background: 'rgba(255,255,255,0.06)',
                    borderColor: 'rgba(232, 185, 35, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                  onClick={() => handleQuickLogin('bvashwin88@gmail.com')}
                >
                  <span style={{ fontWeight: 600, color: 'var(--gold-400)' }}>👑 Ashwin Kumar</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--white-50)' }}>bvashwin88@gmail.com</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: '0.78rem',
                    padding: '8px 10px',
                    textAlign: 'left',
                    background: 'rgba(255,255,255,0.06)',
                    borderColor: 'rgba(232, 185, 35, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                  onClick={() => handleQuickLogin('akashvishnu6680@gmail.com')}
                >
                  <span style={{ fontWeight: 600, color: 'var(--gold-400)' }}>💎 Akash Bv (GRT)</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--white-50)' }}>akashvishnu6680@...</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: '0.78rem',
                    padding: '8px 10px',
                    textAlign: 'left',
                    background: 'rgba(255,255,255,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                  onClick={() => handleQuickLogin('demo@goldshop.com')}
                >
                  <span style={{ fontWeight: 600 }}>💍 Demo Jeweler</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--white-50)' }}>Sri Lakshmi Jewelers</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: '0.78rem',
                    padding: '8px 10px',
                    textAlign: 'left',
                    background: 'rgba(255,255,255,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                  onClick={() => handleQuickLogin('admin@goldshop.com')}
                >
                  <span style={{ fontWeight: 600 }}>🛡️ System Admin</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--white-50)' }}>Admin Central</span>
                </button>
              </div>
            </div>

            {/* Error banner if any */}
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              id="google-signin-btn"
              type="button"
              className="btn btn-secondary btn-full btn-lg"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '16px',
                fontWeight: 600,
                background: '#ffffff',
                color: '#1f2937',
                border: '1px solid #d1d5db'
              }}
              onClick={async () => {
                clearError();
                const res = await loginWithGoogle();
                if (res.success) {
                  navigate(from, { replace: true });
                } else {
                  setGoogleFallback(true);
                }
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Sign in with Google
            </button>

            {googleFallback && (
              <div style={{
                marginBottom: '16px',
                padding: '12px 14px',
                background: 'rgba(66, 133, 244, 0.12)',
                border: '1px solid rgba(66, 133, 244, 0.35)',
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.82rem', color: '#93c5fd', marginBottom: '8px' }}>
                  Preview sandbox active. Select verified Google profile to continue:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-full btn-sm"
                    style={{ fontSize: '0.82rem', padding: '8px 12px' }}
                    onClick={async () => {
                      clearError();
                      const res = await loginWithGoogle('bvashwin88@gmail.com');
                      if (res.success) navigate(from, { replace: true });
                    }}
                  >
                    ✨ Continue as Ashwin (bvashwin88@gmail.com)
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-full btn-sm"
                    style={{ fontSize: '0.82rem', padding: '8px 12px' }}
                    onClick={async () => {
                      clearError();
                      const res = await loginWithGoogle('akashvishnu6680@gmail.com');
                      if (res.success) navigate(from, { replace: true });
                    }}
                  >
                    ✨ Continue as Akash Bv (akashvishnu6680@gmail.com)
                  </button>
                </div>
              </div>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '16px 0',
              color: 'var(--white-50)',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.8px'
            }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
              <span>Or sign in with email</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            </div>

            {/* Traditional Email & Password Form */}
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  className={`form-control ${fieldErrors.email ? 'error' : ''}`}
                  placeholder="bvashwin88@gmail.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
                {fieldErrors.email && <p className="form-error">{fieldErrors.email}</p>}
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="login-password">Password</label>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--gold-400)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      padding: 0
                    }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide 👁️' : 'Show 👁️'}
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className={`form-control ${fieldErrors.password ? 'error' : ''}`}
                    placeholder="Enter password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                </div>
                {fieldErrors.password && <p className="form-error">{fieldErrors.password}</p>}
              </div>

              <button
                id="login-submit"
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={loading}
                style={{ marginTop: '12px' }}
              >
                {loading ? (
                  <>
                    <div className="spinner spinner-sm" />
                    Signing In...
                  </>
                ) : (
                  '✨ Sign In to Poster Studio'
                )}
              </button>
            </form>

            <div className="auth-footer">
              Don't have an account yet?{' '}
              <Link to="/register" style={{ fontWeight: 600, color: 'var(--gold-400)' }}>
                Create one free
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

