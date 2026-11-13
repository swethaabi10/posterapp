import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { isAuthenticated, register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    shopName: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
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
    const result = await register(form.name, form.email, form.password, form.shopName);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fadeInUp">
        <div className="auth-logo">
          <div className="auth-logo-icon">💍</div>
          <div className="auth-logo-text">Poster App</div>
          <div className="auth-logo-subtitle">Jewelry Gold Rate Posters</div>
        </div>

        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Start creating beautiful gold rate posters today</p>

        {error && (
          <div className="alert alert-error" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
            {error.toLowerCase().includes('already') && (
              <Link
                to="/login"
                className="btn btn-secondary btn-sm"
                style={{ textAlign: 'center', textDecoration: 'none', marginTop: '4px' }}
              >
                👉 Go to Sign In Page
              </Link>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              type="text"
              name="name"
              className={`form-control ${fieldErrors.name ? 'error' : ''}`}
              placeholder="Your full name"
              value={form.name}
              onChange={handleChange}
              autoFocus
            />
            {fieldErrors.name && <p className="form-error">{fieldErrors.name}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              type="email"
              name="email"
              className={`form-control ${fieldErrors.email ? 'error' : ''}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
            {fieldErrors.email && <p className="form-error">{fieldErrors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-shop">Shop Name <span style={{ color: 'var(--white-50)' }}>(optional)</span></label>
            <input
              id="reg-shop"
              type="text"
              name="shopName"
              className="form-control"
              placeholder="e.g. Lakshmi Jewellers"
              value={form.shopName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              name="password"
              className={`form-control ${fieldErrors.password ? 'error' : ''}`}
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
            />
            {fieldErrors.password && <p className="form-error">{fieldErrors.password}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
            <input
              id="reg-confirm"
              type="password"
              name="confirmPassword"
              className={`form-control ${fieldErrors.confirmPassword ? 'error' : ''}`}
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={handleChange}
            />
            {fieldErrors.confirmPassword && <p className="form-error">{fieldErrors.confirmPassword}</p>}
          </div>

          <button
            id="register-submit"
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{ marginTop: '8px' }}
          >
            {loading ? (
              <>
                <div className="spinner spinner-sm" />
                Creating Account...
              </>
            ) : (
              '🚀 Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
