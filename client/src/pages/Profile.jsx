import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    name: '',
    ownerName: '',
    shopName: '',
    shopAddress: '',
    shopPhone: '',
    whatsappNumber: '',
    logoUrl: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [utrCode, setUtrCode] = useState('');
  const [submittingUtr, setSubmittingUtr] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/user/profile');
        const u = data.user;
        setForm({
          name: u.name || '',
          ownerName: u.ownerName || '',
          shopName: u.shopName || '',
          shopAddress: u.shopAddress || '',
          shopPhone: u.shopPhone || '',
          whatsappNumber: u.whatsappNumber || '',
          logoUrl: u.logoUrl || '',
        });
      } catch (err) {
        setErrorMsg(err.response?.data?.message || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setSuccessMsg('');
    setErrorMsg('');
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Logo file size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((p) => ({ ...p, logoUrl: reader.result }));
        setSuccessMsg('Logo uploaded successfully!');
      };
      reader.onerror = () => {
        setErrorMsg('Failed to read logo file');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const { data } = await api.put('/user/profile', form);
      updateUser(data.user);
      setSuccessMsg('✅ Profile updated successfully!');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleUtrSubmit = async (e) => {
    e.preventDefault();
    if (!utrCode.trim()) return;
    setSubmittingUtr(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const { data } = await api.post('/user/submit-payment', { txnId: utrCode });
      updateUser(data.user);
      setSuccessMsg('✅ Payment UTR reference submitted successfully! Verification is now pending.');
      setUtrCode('');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit UTR reference. Please try again.');
    } finally {
      setSubmittingUtr(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="main-content page-container">
      {/* Header */}
      <div className="page-header animate-fadeInUp">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="profile-avatar">
            {user?.name ? user.name[0].toUpperCase() : '👤'}
          </div>
          <div>
            <h1 className="page-title" style={{ marginBottom: '4px' }}>Shop Profile</h1>
            <p className="page-subtitle">{user?.email}</p>
          </div>
        </div>
        <div className="gold-divider" style={{ marginTop: '20px' }} />
      </div>

      {successMsg && (
        <div className="alert alert-success animate-fadeIn">
          <span>✅</span><span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="alert alert-error animate-fadeIn">
          <span>⚠️</span><span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="animate-fadeInUp">
        <div className="profile-grid">
          {/* Account Details */}
          <div className="card">
            <div className="editor-form-title">👤 Account Details</div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-name">Full Name</label>
              <input
                id="profile-name"
                type="text"
                name="name"
                className="form-control"
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                value={user?.email || ''}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <p className="form-hint">Email cannot be changed.</p>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="profile-owner">Owner Name</label>
              <input
                id="profile-owner"
                type="text"
                name="ownerName"
                className="form-control"
                placeholder="Proprietor / Owner name"
                value={form.ownerName}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Shop Details */}
          <div className="card">
            <div className="editor-form-title">🏪 Shop Details</div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-shopname">Shop Name</label>
              <input
                id="profile-shopname"
                type="text"
                name="shopName"
                className="form-control"
                placeholder="Lakshmi Jewellers"
                value={form.shopName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-address">Shop Address</label>
              <input
                id="profile-address"
                type="text"
                name="shopAddress"
                className="form-control"
                placeholder="123 Main St, City, State"
                value={form.shopAddress}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-phone">Shop Phone</label>
              <input
                id="profile-phone"
                type="tel"
                name="shopPhone"
                className="form-control"
                placeholder="+91 98765 43210"
                value={form.shopPhone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="profile-whatsapp">WhatsApp Number</label>
              <input
                id="profile-whatsapp"
                type="tel"
                name="whatsappNumber"
                className="form-control"
                placeholder="919876543210 (with country code)"
                value={form.whatsappNumber}
                onChange={handleChange}
              />
              <p className="form-hint">Include country code, e.g. 919876543210 for India</p>
            </div>
          </div>

          {/* Branding */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="editor-form-title">🖼️ Shop Logo</div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" htmlFor="profile-logo-upload">Logo File (PNG/JPG format)</label>
              <input
                id="profile-logo-upload"
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="form-control"
                style={{ padding: '8px 12px' }}
                onChange={handleLogoUpload}
              />
              <p className="form-hint">
                Upload a transparent PNG logo of your shop to overlay on your posters.
              </p>
            </div>

            {form.logoUrl && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: 'var(--navy-950)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--white-10)',
                }}
              >
                <img
                  src={form.logoUrl}
                  alt="Logo preview"
                  style={{
                    width: '60px',
                    height: '60px',
                    objectFit: 'cover',
                    borderRadius: '50%',
                    border: '2px solid var(--gold-500)',
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--white-50)' }}>Logo Uploaded</span>
                  <button type="button" className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => setForm(p => ({ ...p, logoUrl: '' }))}>Remove Logo</button>
                </div>
              </div>
            )}
          </div>

          {/* Subscription & Renewal Section */}
          {user?.role !== 'admin' && (
            <div className="card" style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
              <div className="editor-form-title">💳 Subscription & Renewal</div>
              
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Current Status:</span>
                {user?.paymentStatus === 'approved' && (
                  <span className="badge badge-success" style={{ background: '#15803d', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>✅ Active Subscription</span>
                )}
                {user?.paymentStatus === 'pending' && (
                  <span className="badge badge-warning" style={{ background: '#b45309', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>⏳ Pending Verification</span>
                )}
                {(!user?.paymentStatus || user?.paymentStatus === 'none') && (
                  <span className="badge badge-danger" style={{ background: '#b91c1c', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>❌ Inactive / Expired</span>
                )}
              </div>

              {user?.paymentStatus === 'pending' && user?.paymentTxnId && (
                <div className="alert alert-info" style={{ marginBottom: '16px', background: 'rgba(56, 189, 248, 0.08)', border: '1px dashed var(--blue-500)', display: 'flex', gap: '8px' }}>
                  <span>ℹ️</span>
                  <span>Currently verifying transaction reference UTR: <strong>{user.paymentTxnId}</strong>. We will notify you once admin approves it.</span>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="profile-utr">Submit Renewal Payment UTR Reference</label>
                <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                  <input
                    id="profile-utr"
                    type="text"
                    className="form-control"
                    placeholder="Enter 12-digit UPI UTR reference number"
                    value={utrCode}
                    onChange={(e) => {
                      setSuccessMsg('');
                      setErrorMsg('');
                      setUtrCode(e.target.value);
                    }}
                    style={{ flex: 1 }}
                    disabled={submittingUtr}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleUtrSubmit}
                    disabled={submittingUtr || !utrCode.trim()}
                    style={{ minWidth: '150px' }}
                  >
                    {submittingUtr ? 'Submitting...' : 'Submit UTR'}
                  </button>
                </div>
                <p className="form-hint">
                  Pay ₹1,000 via UPI to <strong>goldposter@upi</strong>, copy the 12-digit UTR reference code, and submit it above.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          <button
            id="profile-save-btn"
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={saving}
          >
            {saving ? (
              <><div className="spinner spinner-sm" /> Saving...</>
            ) : (
              '💾 Save Profile'
            )}
          </button>
          <a href="/editor" className="btn btn-outline btn-lg">
            ✏️ Go to Editor
          </a>
        </div>
      </form>
    </div>
  );
};

export default Profile;
