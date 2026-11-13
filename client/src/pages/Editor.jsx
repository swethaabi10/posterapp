import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import PosterPreview from '../components/PosterPreview';
import LoadingSpinner from '../components/LoadingSpinner';
import downloadPoster from '../utils/downloadPoster';
import { getWhatsAppShareUrl, sharePoster } from '../utils/whatsappShare';

const Editor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { templateId } = useParams();
  const posterRef = useRef(null);

  const today = new Date();
  const todayShort = today.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const todayISO = today.toISOString().split('T')[0];

  const [template, setTemplate] = useState(null);
  const [templatesList, setTemplatesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharing, setSharing] = useState(false);

  const [rates, setRates] = useState({
    gold22k: '',
    gold24k: '',
    gold18k: '',
    silverRate: '',
  });

  const [shopOverrides, setShopOverrides] = useState({
    shopName: '',
    shopAddress: '',
    shopPhone: '',
    logoUrl: '',
  });

  // Load template and template lists
  useEffect(() => {
    const fetchTemplateDetails = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        
        // Fetch all templates for the selector
        const allRes = await api.get('/templates');
        setTemplatesList(allRes.data.templates);

        // Fetch selected template
        let activeId = templateId;
        if (!activeId) {
          const todayRes = await api.get('/templates/today');
          activeId = todayRes.data.template._id;
        }

        const { data } = await api.get(`/templates/${activeId}`);
        const t = data.template;
        setTemplate(t);
        setRates({
          gold22k: t.defaultGoldRate22k || '',
          gold24k: t.defaultGoldRate24k || '',
          gold18k: t.defaultGoldRate18k || '',
          silverRate: t.defaultSilverRate || '',
        });
      } catch (err) {
        console.error('Editor loading error:', err);
        setErrorMsg(err.response?.data?.message || 'Failed to load template.');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplateDetails();
  }, [templateId]);

  // Populate shop from user profile
  useEffect(() => {
    if (user) {
      setShopOverrides({
        shopName: user.shopName || '',
        shopAddress: user.shopAddress || '',
        shopPhone: user.shopPhone || '',
        logoUrl: user.logoUrl || '',
      });
    }
  }, [user]);

  const handleRateChange = (e) => {
    const { name, value } = e.target;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setRates((p) => ({ ...p, [name]: value }));
    }
  };

  const handleShopChange = (e) => {
    const { name, value } = e.target;
    setShopOverrides((p) => ({ ...p, [name]: value }));
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
        setShopOverrides((p) => ({ ...p, logoUrl: reader.result }));
        setSuccessMsg('Logo uploaded successfully!');
      };
      reader.onerror = () => {
        setErrorMsg('Failed to read logo file');
      };
      reader.readAsDataURL(file);
    }
  };

  const clearMessages = () => {
    setSuccessMsg('');
    setErrorMsg('');
  };

  // Download poster and save to history
  const handleDownloadAndSave = useCallback(async () => {
    if (!posterRef.current) return;
    clearMessages();
    setDownloading(true);
    try {
      const fileName = `gold-rate-poster-${todayISO}.png`;
      // Trigger browser download and capture base64 PNG data
      const base64Data = await downloadPoster(posterRef.current, fileName);

      // Save poster to history
      await api.post('/posters/save', {
        templateId: template?._id,
        imageUrlOrData: base64Data,
        goldRate22k: Number(rates.gold22k) || 0,
        goldRate24k: Number(rates.gold24k) || 0,
        goldRate18k: Number(rates.gold18k) || 0,
        silverRate: Number(rates.silverRate) || 0,
        date: todayISO,
      });

      setSuccessMsg('✅ Poster downloaded and saved to history!');
    } catch (err) {
      console.error('Download and Save error:', err);
      setErrorMsg('Failed to download and save poster. Please try again.');
    } finally {
      setDownloading(false);
    }
  }, [rates, template, todayISO]);

  // WhatsApp share
  const handleWhatsApp = async () => {
    if (!posterRef.current) return;
    clearMessages();
    setSharing(true);
    try {
      const result = await sharePoster({
        element: posterRef.current,
        shopName: shopOverrides.shopName,
        whatsappNumber: user?.whatsappNumber,
        gold22k: rates.gold22k,
        gold24k: rates.gold24k,
        gold18k: rates.gold18k,
        silverRate: rates.silverRate,
        date: todayShort,
      });

      if (result.success) {
        // Save poster to history to mark it as used
        try {
          await api.post('/posters/save', {
            templateId: template?._id,
            imageUrlOrData: result.base64Image,
            goldRate22k: Number(rates.gold22k) || 0,
            goldRate24k: Number(rates.gold24k) || 0,
            goldRate18k: Number(rates.gold18k) || 0,
            silverRate: Number(rates.silverRate) || 0,
            date: todayISO,
          });
        } catch (saveErr) {
          console.error('Error saving shared poster to history:', saveErr);
        }

        // Log share activity in database
        await api.post('/posters/activity', {
          templateId: template?._id,
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
          setErrorMsg('Failed to share poster. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error sharing to WhatsApp:', err);
      setErrorMsg('Failed to share poster. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const posterData = template
    ? {
        shopName: shopOverrides.shopName || 'Your Jewelry Shop',
        shopAddress: shopOverrides.shopAddress,
        shopPhone: shopOverrides.shopPhone,
        logoUrl: shopOverrides.logoUrl,
        gold22k: rates.gold22k || 0,
        gold24k: rates.gold24k || 0,
        gold18k: rates.gold18k || 0,
        silverRate: rates.silverRate || 0,
        layoutType: template.layoutType,
        colors: template.colors,
        backgroundImageUrl: template.backgroundImageUrl,
        templateName: template.name,
        category: template.category,
        date: todayShort,
      }
    : null;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="main-content page-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px', boxSizing: 'border-box' }}>
      {/* Header */}
      <div className="page-header animate-fadeInUp" style={{ marginBottom: '24px' }}>
        <div className="page-header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.8rem', color: 'var(--white)', margin: 0 }}>✏️ Poster Editor</h1>
            <p className="page-subtitle" style={{ fontSize: '0.9rem', color: 'var(--white-50)', marginTop: '4px' }}>Configure today's gold rates and branding overlay</p>
          </div>
          <span className="badge badge-gold" style={{ fontSize: '0.85rem', padding: '6px 16px' }}>📅 {todayShort}</span>
        </div>
        <div className="gold-divider" style={{ height: '2px', background: 'var(--gold-gradient)', width: '60px', marginTop: '16px' }} />
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="alert alert-success animate-fadeIn" style={{ marginBottom: '20px' }}>
          <span>✅</span><span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="alert alert-error animate-fadeIn" style={{ marginBottom: '20px' }}>
          <span>⚠️</span><span>{errorMsg}</span>
        </div>
      )}

      {/* Side-by-Side Flex Layout */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: '32px',
        alignItems: 'start',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Left Column: Form Settings */}
        <div className="animate-fadeInUp" style={{
          flex: '1 1 550px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxSizing: 'border-box',
          minWidth: '320px'
        }}>
          
          {/* Rate Inputs Card */}
          <div className="card" style={{ padding: '24px', background: 'var(--navy-800)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--white-10)', boxSizing: 'border-box' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--gold-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', borderBottom: '1px solid var(--white-10)', paddingBottom: '8px' }}>
              💰 Today's Rates (₹ per gram)
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: 'var(--white-70)', fontSize: '0.82rem', display: 'block', marginBottom: '6px' }} htmlFor="editor-gold24k">24K Gold</label>
                <input
                  id="editor-gold24k"
                  type="text"
                  name="gold24k"
                  inputMode="decimal"
                  className="form-control rate-input"
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--navy-950)', border: '1.5px solid var(--white-20)', borderRadius: 'var(--radius-sm)', color: 'var(--gold-400)', fontWeight: 'bold', fontSize: '1.1rem', textAlign: 'center' }}
                  placeholder="7100"
                  value={rates.gold24k}
                  onChange={handleRateChange}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: 'var(--white-70)', fontSize: '0.82rem', display: 'block', marginBottom: '6px' }} htmlFor="editor-gold22k">22K Gold</label>
                <input
                  id="editor-gold22k"
                  type="text"
                  name="gold22k"
                  inputMode="decimal"
                  className="form-control rate-input"
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--navy-950)', border: '1.5px solid var(--white-20)', borderRadius: 'var(--radius-sm)', color: 'var(--gold-400)', fontWeight: 'bold', fontSize: '1.1rem', textAlign: 'center' }}
                  placeholder="6500"
                  value={rates.gold22k}
                  onChange={handleRateChange}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: 'var(--white-70)', fontSize: '0.82rem', display: 'block', marginBottom: '6px' }} htmlFor="editor-gold18k">18K Gold</label>
                <input
                  id="editor-gold18k"
                  type="text"
                  name="gold18k"
                  inputMode="decimal"
                  className="form-control rate-input"
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--navy-950)', border: '1.5px solid var(--white-20)', borderRadius: 'var(--radius-sm)', color: 'var(--gold-400)', fontWeight: 'bold', fontSize: '1.1rem', textAlign: 'center' }}
                  placeholder="5300"
                  value={rates.gold18k}
                  onChange={handleRateChange}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: 'var(--white-70)', fontSize: '0.82rem', display: 'block', marginBottom: '6px' }} htmlFor="editor-silver">Silver</label>
                <input
                  id="editor-silver"
                  type="text"
                  name="silverRate"
                  inputMode="decimal"
                  className="form-control rate-input"
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--navy-950)', border: '1.5px solid var(--white-20)', borderRadius: 'var(--radius-sm)', color: 'var(--silver-400)', fontWeight: 'bold', fontSize: '1.1rem', textAlign: 'center' }}
                  placeholder="85"
                  value={rates.silverRate}
                  onChange={handleRateChange}
                />
              </div>
            </div>
          </div>

          {/* Quick Template Selector Card */}
          <div className="card" style={{ padding: '24px', background: 'var(--navy-800)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--white-10)', boxSizing: 'border-box' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--gold-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', borderBottom: '1px solid var(--white-10)', paddingBottom: '8px' }}>
              🖼️ Choose Poster Template ({templatesList.length})
            </h3>
            
            {/* Festival templates row */}
            {templatesList.filter(t => t.category === 'festival').length > 0 && (
              <>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--white-90)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🎉</span> Festival & Celebration Specials ({templatesList.filter(t => t.category === 'festival').length})
                </div>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  overflowX: 'auto',
                  paddingBottom: '12px',
                  marginBottom: '20px',
                  scrollbarWidth: 'thin',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  {templatesList.filter(t => t.category === 'festival').map((t) => (
                    <div
                      key={t._id}
                      onClick={() => {
                        if (t.isUsedThisMonth) return;
                        navigate(`/editor/${t._id}`);
                      }}
                      style={{
                        minWidth: '110px',
                        padding: '12px 8px',
                        flexShrink: 0,
                        cursor: t.isUsedThisMonth ? 'not-allowed' : 'pointer',
                        background: template?._id === t._id ? 'var(--gold-gradient)' : 'var(--navy-900)',
                        color: template?._id === t._id ? 'var(--navy-900)' : 'var(--white-70)',
                        border: template?._id === t._id ? '2px solid var(--gold-500)' : '1px solid var(--white-10)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                        boxSizing: 'border-box',
                        opacity: t.isUsedThisMonth ? 0.5 : 1
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: 'var(--radius-sm)',
                          background: t.backgroundImageUrl 
                            ? `url(${t.backgroundImageUrl}) center/cover no-repeat` 
                            : (t.colors?.background || '#1a1a2e'),
                          border: t.isUsedThisMonth 
                            ? '1.5px solid rgba(239, 68, 68, 0.4)' 
                            : `1.5px solid ${t.colors?.primary || '#d4a017'}`,
                        }}
                      />
                      <div style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%',
                        color: t.isUsedThisMonth ? '#ef4444' : undefined
                      }}>
                        {t.isUsedThisMonth ? '🔒 Used' : t.name}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Premium templates row */}
            {templatesList.filter(t => t.category !== 'festival').length > 0 && (
              <>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--white-90)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>💎</span> Daily Premium Rate Cards ({templatesList.filter(t => t.category !== 'festival').length})
                </div>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  overflowX: 'auto',
                  paddingBottom: '12px',
                  scrollbarWidth: 'thin',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  {templatesList.filter(t => t.category !== 'festival').map((t) => (
                    <div
                      key={t._id}
                      onClick={() => {
                        if (t.isUsedThisMonth) return;
                        navigate(`/editor/${t._id}`);
                      }}
                      style={{
                        minWidth: '110px',
                        padding: '12px 8px',
                        flexShrink: 0,
                        cursor: t.isUsedThisMonth ? 'not-allowed' : 'pointer',
                        background: template?._id === t._id ? 'var(--gold-gradient)' : 'var(--navy-900)',
                        color: template?._id === t._id ? 'var(--navy-900)' : 'var(--white-70)',
                        border: template?._id === t._id ? '2px solid var(--gold-500)' : '1px solid var(--white-10)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                        boxSizing: 'border-box',
                        opacity: t.isUsedThisMonth ? 0.5 : 1
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: 'var(--radius-sm)',
                          background: t.backgroundImageUrl 
                            ? `url(${t.backgroundImageUrl}) center/cover no-repeat` 
                            : (t.colors?.background || '#1a1a2e'),
                          border: t.isUsedThisMonth 
                            ? '1.5px solid rgba(239, 68, 68, 0.4)' 
                            : `1.5px solid ${t.colors?.primary || '#d4a017'}`,
                        }}
                      />
                      <div style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%',
                        color: t.isUsedThisMonth ? '#ef4444' : undefined
                      }}>
                        {t.isUsedThisMonth ? '🔒 Used' : t.name}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Shop branding Overlay Card */}
          <div className="card" style={{ padding: '24px', background: 'var(--navy-800)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--white-10)', boxSizing: 'border-box' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--gold-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', borderBottom: '1px solid var(--white-10)', paddingBottom: '8px' }}>
              🏪 Shop Branding Overlay
            </h3>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ color: 'var(--white-70)', fontSize: '0.82rem', display: 'block', marginBottom: '6px' }} htmlFor="editor-shopname">Shop Name</label>
              <input
                id="editor-shopname"
                type="text"
                name="shopName"
                className="form-control"
                style={{ width: '100%', padding: '10px 12px', background: 'var(--navy-950)', border: '1.5px solid var(--white-20)', borderRadius: 'var(--radius-sm)', color: 'var(--white)' }}
                placeholder="Shop Name"
                value={shopOverrides.shopName}
                onChange={handleShopChange}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ color: 'var(--white-70)', fontSize: '0.82rem', display: 'block', marginBottom: '6px' }} htmlFor="editor-phone">Phone Number</label>
              <input
                id="editor-phone"
                type="tel"
                name="shopPhone"
                className="form-control"
                style={{ width: '100%', padding: '10px 12px', background: 'var(--navy-950)', border: '1.5px solid var(--white-20)', borderRadius: 'var(--radius-sm)', color: 'var(--white)' }}
                placeholder="Phone Number"
                value={shopOverrides.shopPhone}
                onChange={handleShopChange}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ color: 'var(--white-70)', fontSize: '0.82rem', display: 'block', marginBottom: '6px' }} htmlFor="editor-address">Address</label>
              <input
                id="editor-address"
                type="text"
                name="shopAddress"
                className="form-control"
                style={{ width: '100%', padding: '10px 12px', background: 'var(--navy-950)', border: '1.5px solid var(--white-20)', borderRadius: 'var(--radius-sm)', color: 'var(--white)' }}
                placeholder="Address"
                value={shopOverrides.shopAddress}
                onChange={handleShopChange}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ color: 'var(--white-70)', fontSize: '0.82rem', display: 'block', marginBottom: '6px' }} htmlFor="editor-logo-upload">Shop Logo (PNG/JPG)</label>
              <input
                id="editor-logo-upload"
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="form-control"
                style={{ width: '100%', padding: '8px 12px', background: 'var(--navy-950)', border: '1.5px solid var(--white-20)', borderRadius: 'var(--radius-sm)', color: 'var(--white)' }}
                onChange={handleLogoUpload}
              />
              {shopOverrides.logoUrl && (
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={shopOverrides.logoUrl} alt="Logo preview" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--gold-500)' }} />
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setShopOverrides(p => ({ ...p, logoUrl: '' }))}>Remove Logo</button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%', boxSizing: 'border-box' }}>
            <button
              id="editor-download-btn"
              className="btn btn-primary btn-lg"
              onClick={handleDownloadAndSave}
              disabled={downloading}
              style={{ flex: 1, minWidth: '200px' }}
            >
              {downloading ? (
                <><div className="spinner spinner-sm" /> Capturing...</>
              ) : (
                '⬇️ Download & Save to History'
              )}
            </button>

            <button
              id="editor-whatsapp-btn"
              className="btn btn-whatsapp btn-lg"
              onClick={handleWhatsApp}
              disabled={sharing}
              style={{ flex: 1, minWidth: '200px' }}
            >
              {sharing ? (
                <><div className="spinner spinner-sm" style={{ marginRight: '8px' }} /> Copying Image...</>
              ) : (
                '📱 Share on WhatsApp'
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Sticky Live Preview Panel */}
        <div style={{
          flex: '0 0 420px',
          position: 'sticky',
          top: '88px',
          zIndex: 10,
          background: 'var(--navy-800)',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--white-10)',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '100%'
        }}>
          <div style={{ marginBottom: '16px', width: '100%' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--gold-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              👁️ Live Poster Preview
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--white-50)', marginTop: '4px' }}>
              Reflects template layouts and colors dynamically
            </p>
          </div>
          {posterData && <PosterPreview posterRef={posterRef} data={posterData} />}
        </div>
      </div>

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

export default Editor;
