import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Payment = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  // Automatically redirect to dashboard if user gets approved or is admin
  useEffect(() => {
    if (user?.paymentStatus === 'approved' || user?.role === 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [user?.paymentStatus, user?.role, navigate]);
  
  const [txnId, setTxnId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isExpired = user && user.paymentDate;

  // Handle transaction ID submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!txnId.trim()) {
      setError('Please enter a valid Transaction Reference ID (UTR).');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const { data } = await api.post('/user/submit-payment', { txnId });
      updateUser(data.user);
      setSuccessMsg('Payment details submitted successfully! Pending admin approval.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit payment details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Refresh user status from server
  const handleRefreshStatus = async () => {
    setLoadingStatus(true);
    setError('');
    try {
      const { data } = await api.get('/user/profile');
      updateUser(data.user);
      if (data.user.paymentStatus === 'approved') {
        navigate('/dashboard');
      } else {
        setSuccessMsg('Status refreshed. Your request is still pending approval.');
      }
    } catch (err) {
      setError('Failed to refresh status. Please check your network connection.');
    } finally {
      setLoadingStatus(false);
    }
  };

  // Redirect to dashboard if already approved
  if (user?.paymentStatus === 'approved' || user?.role === 'admin') {
    return (
      <div className="auth-page">
        <div className="auth-card text-center" style={{ padding: '40px 24px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>✅</div>
          <h2 className="auth-title">Access Unlocked!</h2>
          <p className="auth-subtitle" style={{ marginBottom: '24px' }}>
            Your account is active. You have full access to create gold rate posters.
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary btn-full btn-lg">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-fadeInUp" style={{ maxWidth: '480px', padding: '32px 24px' }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">💍</div>
          <div className="auth-logo-text">Poster App Paywall</div>
          <div className="auth-logo-subtitle">One-time Activation Fee</div>
        </div>

        {user?.paymentStatus === 'pending' ? (
          /* Pending Verification UI */
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', margin: '16px 0', animation: 'pulse 2s infinite' }}>⏳</div>
            <h2 className="auth-title">Payment Pending Verification</h2>
            <p className="auth-subtitle" style={{ fontSize: '0.85rem', marginBottom: '24px', lineHeight: '1.5' }}>
              Your payment reference <strong style={{ color: 'var(--gold-500)' }}>{user.paymentTxnId}</strong> has been submitted. 
              Our admin team is verifying your payment of ₹1,000. Access will be enabled automatically.
            </p>

            {successMsg && (
              <div className="alert alert-success" style={{ margin: '12px 0', fontSize: '0.8rem' }}>
                <span>{successMsg}</span>
              </div>
            )}
            {error && (
              <div className="alert alert-error" style={{ margin: '12px 0', fontSize: '0.8rem' }}>
                <span>⚠️ {error}</span>
              </div>
            )}

            <button
              onClick={handleRefreshStatus}
              className="btn btn-primary btn-full btn-lg"
              disabled={loadingStatus}
              style={{ marginBottom: '12px' }}
            >
              {loadingStatus ? 'Checking Status...' : '🔄 Refresh Status'}
            </button>

            <button onClick={logout} className="btn btn-secondary btn-full">
              Logout
            </button>
          </div>
        ) : (
          /* Unpaid Submission UI (none status) */
          <div>
            <h2 className="auth-title" style={{ textAlign: 'center', fontSize: '1.25rem', color: isExpired ? '#ef4444' : 'inherit' }}>
              {isExpired ? '❌ Subscription Expired' : 'Activate Your Account'}
            </h2>
            <p className="auth-subtitle" style={{ textAlign: 'center', fontSize: '0.8rem', marginBottom: '20px' }}>
              {isExpired 
                ? 'Your monthly subscription has expired. Please make a payment of ₹1,000 to renew your access for the new month.' 
                : 'Pay a flat subscription of ₹1,000 to unlock all 60 premium templates.'}
            </p>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '16px', fontSize: '0.8rem' }}>
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* QR and UPI instruction box */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '140px',
                height: '140px',
                margin: '0 auto 12px',
                background: '#ffffff',
                borderRadius: '8px',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                {/* SVG mock QR code representation */}
                <svg width="124" height="124" viewBox="0 0 100 100">
                  <path d="M5 5h30v30H5zm5 5v20h20V10zM65 5h30v30H65zm5 5v20h20V10zM5 65h30v30H5zm5 5v20h20V70z" fill="#0f2040" />
                  <path d="M15 15h10v10H15zm60 0h10v10H75zM15 75h10v10H15z" fill="#d4a017" />
                  <path d="M45 5h10v10H45zm0 20h10v15H45zm20 20h10v10H65zm10-10h10v10H75zm10 20h10v20H85zm-40 0h10v25H45zm20 20h15v10H65zm-20 10h10v10H45zm20-30h10v10H65zm-10 10H45v10h10z" fill="#0f2040" />
                  <circle cx="50" cy="50" r="8" fill="#d4a017" />
                </svg>
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--white-90)', marginBottom: '4px' }}>
                Scan QR Code to Pay
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--white-70)' }}>
                UPI ID: <strong style={{ color: 'var(--gold-500)' }}>goldposter@upi</strong>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" htmlFor="txn-id">
                  UPI Transaction ID / UTR Code
                </label>
                <input
                  id="txn-id"
                  type="text"
                  className="form-control"
                  placeholder="Enter the 12-digit UTR/Txn number"
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                  disabled={submitting}
                  required
                />
                <span style={{ fontSize: '0.65rem', color: 'var(--white-60)', display: 'block', marginTop: '4px' }}>
                  Please make a payment of ₹1,000 first, then enter the UTR ref number to activate.
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={submitting}
                style={{ marginBottom: '12px' }}
              >
                {submitting ? 'Submitting Details...' : '✓ Submit Transaction ID'}
              </button>

              <button type="button" onClick={logout} className="btn btn-secondary btn-full">
                Logout
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
