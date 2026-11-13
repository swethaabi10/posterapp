import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import PosterPreview from '../components/PosterPreview';
import TemplateGrid from '../components/TemplateGrid';
import { getWhatsAppShareUrl, sharePoster } from '../utils/whatsappShare';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const posterRef = useRef(null);
  const [featuredTemplate, setFeaturedTemplate] = useState(null);
  const [allTemplates, setAllTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharing, setSharing] = useState(false);

  const today = new Date();
  const todayFormatted = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const todayShort = today.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  // Dynamically check if today is the last day of the calendar month
  const isLastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() === today.getDate();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // Check if the user has already paid/renewed for the upcoming calendar month
  const hasPaidForNextMonth = (() => {
    if (!user?.paymentDate) return false;
    const payDate = new Date(user.paymentDate);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    const payYear = payDate.getFullYear();
    const payMonth = payDate.getMonth();
    const targetYear = nextMonth.getFullYear();
    const targetMonth = nextMonth.getMonth();
    
    return (payYear > targetYear) || (payYear === targetYear && payMonth >= targetMonth);
  })();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch featured template
        const todayRes = await api.get('/templates/today');
        setFeaturedTemplate(todayRes.data.template);

        // Fetch all templates
        const allRes = await api.get('/templates');
        setAllTemplates(allRes.data.templates);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError(err.response?.data?.message || 'Failed to load templates.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const posterData = featuredTemplate
    ? {
        shopName: user?.shopName || 'Your Jewelry Shop',
        shopAddress: user?.shopAddress || '',
        shopPhone: user?.shopPhone || '',
        logoUrl: user?.logoUrl || '',
        gold22k: featuredTemplate.defaultGoldRate22k || 0,
        gold24k: featuredTemplate.defaultGoldRate24k || 0,
        gold18k: featuredTemplate.defaultGoldRate18k || 0,
        silverRate: featuredTemplate.defaultSilverRate || 0,
        layoutType: featuredTemplate.layoutType || 'fullBleed',
        colors: featuredTemplate.colors || { background: '#1a1a2e', primary: '#d4a017', secondary: '#ffffff' },
        backgroundImageUrl: featuredTemplate.backgroundImageUrl || '',
        templateName: featuredTemplate.name,
        category: featuredTemplate.category,
        date: todayShort,
      }
    : null;

  const handleWhatsApp = async () => {
    if (!featuredTemplate || !posterRef.current) return;
    setSuccessMsg('');
    setError('');
    setSharing(true);
    try {
      const result = await sharePoster({
        element: posterRef.current,
        shopName: user?.shopName,
        whatsappNumber: user?.whatsappNumber,
        gold22k: featuredTemplate.defaultGoldRate22k,
        gold24k: featuredTemplate.defaultGoldRate24k,
        gold18k: featuredTemplate.defaultGoldRate18k,
        silverRate: featuredTemplate.defaultSilverRate,
        date: todayShort,
      });

      if (result.success) {
        // Save poster to history to mark it as used
        try {
          await api.post('/posters/save', {
            templateId: featuredTemplate?._id,
            imageUrlOrData: result.base64Image,
            goldRate22k: Number(featuredTemplate.defaultGoldRate22k) || 0,
            goldRate24k: Number(featuredTemplate.defaultGoldRate24k) || 0,
            goldRate18k: Number(featuredTemplate.defaultGoldRate18k) || 0,
            silverRate: Number(featuredTemplate.defaultSilverRate) || 0,
            date: today.toISOString().split('T')[0],
          });
        } catch (saveErr) {
          console.error('Error saving shared poster to history:', saveErr);
        }

        // Log share activity in database
        await api.post('/posters/activity', {
          templateId: featuredTemplate?._id,
          action: 'share',
        });

        if (result.method === 'clipboard') {
          setShowShareModal(true);
        } else if (result.method === 'share') {
          setSuccessMsg('✅ Rates and poster shared successfully!');
        } else if (result.method === 'text-only') {
          setSuccessMsg('✅ WhatsApp opened. (Image copy not supported on this browser).');
        }
      } else {
        if (result.reason !== 'canceled') {
          setError('Failed to share poster. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error sharing to WhatsApp:', err);
      setError('Failed to share poster. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const handleUnlock = (templateId) => {
    setAllTemplates((prev) =>
      prev.map((t) => (t._id === templateId ? { ...t, isUsedThisMonth: false } : t))
    );
    setSuccessMsg('🔓 Design unlocked! You can now edit and download it.');
  };

  const handleResetLocks = async () => {
    try {
      await api.post('/templates/reset-locks');
      setAllTemplates((prev) => prev.map((t) => ({ ...t, isUsedThisMonth: false })));
      setSuccessMsg('✨ All template designs unlocked for fresh usage!');
    } catch (err) {
      console.error('Failed to reset locks:', err);
      setError('Failed to reset locked designs.');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="main-content page-container">
      {/* Expiration warning banner */}
      {isLastDay && user?.role !== 'admin' && user?.paymentStatus === 'approved' && !hasPaidForNextMonth && (
        <div className="alert alert-warning animate-fadeIn" style={{ marginBottom: '20px', border: '1px dashed var(--gold-500)', background: 'rgba(212, 160, 23, 0.08)', padding: '16px', display: 'flex', gap: '12px' }}>
          <span style={{ fontSize: '1.5rem' }}>🚨</span>
          <div style={{ flex: 1, lineHeight: '1.5' }}>
            <strong style={{ color: 'var(--gold-400)', fontSize: '1.05rem', display: 'block', marginBottom: '4px' }}>Subscription Expiration Warning:</strong>
            Hello <strong style={{ color: 'var(--gold-200)' }}>{user?.name}</strong>, your monthly subscription plan is expiring today (<strong style={{ color: 'var(--gold-200)' }}>{lastDayOfMonth}</strong>).
            To continue using the Poster App and access next month's fresh templates, please make a renewal payment of <strong style={{ color: 'var(--white)' }}>₹1,000</strong> to shop UPI: <strong style={{ color: 'var(--gold-300)', textDecoration: 'underline' }}>goldposter@upi</strong> and enter your UTR reference code in the <Link to="/profile" style={{ color: 'var(--gold-400)', textDecoration: 'underline', fontWeight: 'bold' }}>Profile / Settings page</Link>. Thank you!
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="dashboard-hero animate-fadeInUp">
        <div className="dashboard-hero-greeting">Good day, {user?.name?.split(' ')[0]}! 👋</div>
        <h1 className="dashboard-hero-title">Daily Promotional Poster Dashboard</h1>
        <div className="dashboard-hero-date">
          <span>📅</span>
          <span>{todayFormatted}</span>
        </div>

        {!user?.shopName && (
          <div className="alert alert-warning" style={{ marginTop: '16px', marginBottom: '0' }}>
            <span>💡</span>
            <span>
              Complete your{' '}
              <Link to="/profile" style={{ color: 'var(--gold-400)', fontWeight: 600 }}>
                shop profile
              </Link>{' '}
              to show your shop details on posters.
            </span>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="alert alert-success animate-fadeIn" style={{ marginBottom: '20px' }}>
          <span>✅</span>
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error animate-fadeInUp" style={{ marginBottom: '20px' }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Daily Rates Stat Cards */}
      {featuredTemplate && (
        <div className="dashboard-grid">
          <div className="stat-card animate-fadeInUp">
            <div className="stat-card-icon gold-bg">🏅</div>
            <div>
              <div className="stat-card-label">24K Gold Rate</div>
              <div className="stat-card-value">
                ₹{Number(featuredTemplate.defaultGoldRate24k || 0).toLocaleString('en-IN')}
                <span style={{ fontSize: '0.75rem', color: 'var(--white-50)', fontWeight: 400 }}>/gram</span>
              </div>
            </div>
          </div>

          <div className="stat-card animate-fadeInUp">
            <div className="stat-card-icon gold-bg">🥇</div>
            <div>
              <div className="stat-card-label">22K Gold Rate</div>
              <div className="stat-card-value">
                ₹{Number(featuredTemplate.defaultGoldRate22k || 0).toLocaleString('en-IN')}
                <span style={{ fontSize: '0.75rem', color: 'var(--white-50)', fontWeight: 400 }}>/gram</span>
              </div>
            </div>
          </div>

          <div className="stat-card animate-fadeInUp">
            <div className="stat-card-icon gold-bg" style={{ background: 'rgba(212, 160, 23, 0.15)', color: 'var(--gold-400)' }}>🏵️</div>
            <div>
              <div className="stat-card-label">18K Gold Rate</div>
              <div className="stat-card-value">
                ₹{Number(featuredTemplate.defaultGoldRate18k || 0).toLocaleString('en-IN')}
                <span style={{ fontSize: '0.75rem', color: 'var(--white-50)', fontWeight: 400 }}>/gram</span>
              </div>
            </div>
          </div>

          <div className="stat-card animate-fadeInUp">
            <div className="stat-card-icon silver-bg">🥈</div>
            <div>
              <div className="stat-card-label">Silver Rate</div>
              <div className="stat-card-value">
                ₹{Number(featuredTemplate.defaultSilverRate || 0).toLocaleString('en-IN')}
                <span style={{ fontSize: '0.75rem', color: 'var(--white-50)', fontWeight: 400 }}>/gram</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Featured Poster Preview & Quick Actions */}
      {featuredTemplate && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
            gap: '28px',
            alignItems: 'start',
            marginBottom: '48px',
          }}
          className="dashboard-poster-section"
        >
          {/* Left: Featured Preview */}
          <div className="animate-fadeInUp" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="page-header" style={{ width: '100%' }}>
              <h2 className="page-title" style={{ fontSize: '1.25rem' }}>🌟 Today's Featured Template</h2>
              <div className="gold-divider" />
            </div>
            <PosterPreview posterRef={posterRef} data={posterData} />
          </div>

          {/* Right: Quick Actions */}
          <div className="animate-fadeInUp">
            <div className="page-header">
              <h2 className="page-title" style={{ fontSize: '1.25rem' }}>Quick Actions</h2>
              <div className="gold-divider" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                id="dashboard-edit-btn"
                className="btn btn-primary btn-lg"
                onClick={() => navigate(`/editor/${featuredTemplate._id}`)}
              >
                ✏️ Edit & Download This Poster
              </button>

              <button
                id="dashboard-whatsapp-btn"
                className="btn btn-whatsapp btn-lg"
                onClick={handleWhatsApp}
                disabled={sharing}
              >
                {sharing ? (
                  <><div className="spinner spinner-sm" style={{ marginRight: '8px' }} /> Copying Image...</>
                ) : (
                  <>
                    <span style={{ fontSize: '1.1rem', marginRight: '8px' }}>📱</span>
                    Share Rates on WhatsApp
                  </>
                )}
              </button>

              <Link to="/history" className="btn btn-secondary btn-lg">
                📋 View Poster History
              </Link>

              <Link to="/profile" className="btn btn-outline btn-lg">
                👤 Update Shop Profile
              </Link>
            </div>

            <div className="card-gold" style={{ marginTop: '24px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--gold-400)', fontWeight: 700, marginBottom: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                💡 Featured Theme
              </div>
              <h4 style={{ color: 'var(--white)', fontSize: '0.95rem', marginBottom: '4px' }}>{featuredTemplate.name}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--white-70)', lineHeight: 1.5 }}>
                A premium {featuredTemplate.category} template featuring a {featuredTemplate.layoutType} layout with gold accents. Perfect for sharing on Instagram, WhatsApp status, or Facebook.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Unified Grid of all templates with categories */}
      {allTemplates.length > 0 && (
        <div className="animate-fadeInUp" style={{ marginBottom: '40px' }}>
          <div className="page-header">
            <h2 className="page-title" style={{ fontSize: '1.4rem' }}>🎨 Poster Templates ({allTemplates.length})</h2>
            <p className="page-subtitle">Select from our collection of premium gold rate card and festival poster designs</p>
            <div className="gold-divider" />
          </div>
          <TemplateGrid
            templates={allTemplates.map(t => ({
              ...t,
              category: t.category === 'festival' ? 'festival' : 'premium'
            }))}
            onUnlock={handleUnlock}
            onResetLocks={handleResetLocks}
          />
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .dashboard-poster-section {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }
      `}</style>

      {/* WhatsApp Share Copy Clipboard Modal */}
      {showShareModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 13, 26, 0.92)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--navy-900)',
            border: '2px solid var(--gold-500)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            textAlign: 'center',
            color: '#fff',
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>📋</div>
            <h3 style={{ color: 'var(--gold-400)', marginBottom: '16px', fontSize: '1.6rem', fontWeight: 'bold', margin: 0 }}>
              Poster Copied & Ready!
            </h3>
            <p style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '24px', color: 'var(--white-80)' }}>
              Your custom poster image has been copied to your clipboard and WhatsApp has been opened.
            </p>
            <div style={{
              background: 'rgba(212, 160, 23, 0.1)',
              border: '1px dashed var(--gold-500)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              fontSize: '0.95rem',
              lineHeight: '1.5',
              color: 'var(--gold-200)',
              textAlign: 'left'
            }}>
              💡 <strong>How to send:</strong> Select your contact in WhatsApp, click the chat input field, and press <strong>Ctrl + V</strong> (or long press and tap <strong>Paste</strong>) to send the customized poster!
            </div>
            <button 
              className="btn btn-primary btn-lg" 
              onClick={() => setShowShareModal(false)}
              style={{ width: '100%' }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
