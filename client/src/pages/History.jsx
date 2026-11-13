import { useEffect, useState } from 'react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { getWhatsAppShareUrl, sharePoster } from '../utils/whatsappShare';

const History = () => {
  const [posters, setPosters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPoster, setSelectedPoster] = useState(null); // For light-box view
  const [successMsg, setSuccessMsg] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharing, setSharing] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/posters/history');
      setPosters(data.posters);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load poster history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch (err) {
      return dateStr;
    }
  };

  const handleWhatsAppShare = async (poster) => {
    setSuccessMsg('');
    setError('');
    setSharing(true);
    try {
      const result = await sharePoster({
        base64Image: poster.imageUrlOrData,
        shopName: poster.templateId?.name || 'Our Shop',
        gold22k: poster.goldRate22k,
        gold24k: poster.goldRate24k,
        gold18k: poster.goldRate18k,
        silverRate: poster.silverRate,
        date: formatDate(poster.date),
      });

      if (result.success) {
        // Log share activity in database
        if (poster.templateId?._id) {
          await api.post('/posters/activity', {
            templateId: poster.templateId._id,
            action: 'share',
          });
        }

        if (result.method === 'clipboard') {
          setShowShareModal(true);
        } else if (result.method === 'share') {
          setSuccessMsg('✅ Rates and poster shared successfully!');
        } else if (result.method === 'text-only') {
          setSuccessMsg('✅ WhatsApp opened.');
        }
      } else {
        if (result.reason !== 'canceled') {
          setError('Failed to share poster. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error sharing poster:', err);
      setError('Failed to share poster.');
    } finally {
      setSharing(false);
    }
  };

  const triggerDownload = (base64Data, filename) => {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="main-content page-container">
      {/* Header */}
      <div className="page-header animate-fadeInUp">
        <h1 className="page-title">📋 Poster History</h1>
        <p className="page-subtitle">Your previously generated jewelry posters (latest 30)</p>
        <div className="gold-divider" />
      </div>

      {successMsg && (
        <div className="alert alert-success animate-fadeIn" style={{ marginBottom: '20px' }}>
          <span>✅</span>
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error animate-fadeIn" style={{ marginBottom: '20px' }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {posters.length === 0 ? (
        <div className="empty-state animate-fadeInUp">
          <div className="empty-state-icon">📄</div>
          <div className="empty-state-title">No Posters Saved Yet</div>
          <p className="empty-state-desc">
            Create and download a poster from the editor to see it in your history list.
          </p>
          <a href="/editor" className="btn btn-primary" style={{ marginTop: '20px' }}>
            ✏️ Go to Editor
          </a>
        </div>
      ) : (
        <div className="history-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {posters.map((poster, idx) => (
            <div
              key={poster._id}
              className="history-card animate-fadeInUp"
              style={{
                animationDelay: `${idx * 0.05}s`,
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--navy-800)',
                border: '1px solid var(--white-10)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}
            >
              {/* Poster Thumbnail Image */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '240px',
                  backgroundColor: 'var(--navy-950)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--white-10)',
                }}
                onClick={() => setSelectedPoster(poster)}
              >
                {poster.imageUrlOrData ? (
                  <img
                    src={poster.imageUrlOrData}
                    alt="Generated Poster"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      transition: 'transform 0.3s ease',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  />
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white-50)' }}>
                    No Thumbnail Available
                  </div>
                )}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.72rem',
                    color: 'var(--gold-400)',
                    fontWeight: 700,
                  }}
                >
                  📅 {formatDate(poster.date)}
                </div>
              </div>

              {/* Poster Meta Details */}
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--white)' }}>
                    {poster.templateId?.name || 'Custom Poster'}
                  </div>
                  <span className="badge badge-gold" style={{ fontSize: '0.62rem' }}>
                    {poster.templateId?.category || 'daily'}
                  </span>
                </div>

                <div className="history-rates" style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <span className="history-rate-tag gold" style={{ fontSize: '0.7rem', background: 'rgba(232, 185, 35, 0.1)', color: 'var(--gold-400)', border: '1px solid rgba(232, 185, 35, 0.25)', padding: '2px 8px', borderRadius: '4px' }}>
                    24K: ₹{poster.goldRate24k}
                  </span>
                  <span className="history-rate-tag gold" style={{ fontSize: '0.7rem', background: 'rgba(232, 185, 35, 0.1)', color: 'var(--gold-400)', border: '1px solid rgba(232, 185, 35, 0.25)', padding: '2px 8px', borderRadius: '4px' }}>
                    22K: ₹{poster.goldRate22k}
                  </span>
                  <span className="history-rate-tag gold" style={{ fontSize: '0.7rem', background: 'rgba(232, 185, 35, 0.1)', color: 'var(--gold-400)', border: '1px solid rgba(232, 185, 35, 0.25)', padding: '2px 8px', borderRadius: '4px' }}>
                    18K: ₹{poster.goldRate18k || 0}
                  </span>
                  <span className="history-rate-tag silver" style={{ fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--silver-400)', border: '1px solid var(--white-10)', padding: '2px 8px', borderRadius: '4px' }}>
                    Ag: ₹{poster.silverRate}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button
                    onClick={() => triggerDownload(poster.imageUrlOrData, `gold-rate-poster-${poster.date}.png`)}
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1 }}
                  >
                    💾 Redownload
                  </button>
                  <button
                    onClick={() => handleWhatsAppShare(poster)}
                    className="btn btn-whatsapp btn-sm"
                    disabled={sharing}
                    style={{ padding: '8px', width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Share rates on WhatsApp"
                  >
                    {sharing ? <div className="spinner spinner-sm" /> : '📱'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Modal for full-view */}
      {selectedPoster && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(5, 13, 26, 0.9)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            animation: 'fadeIn 0.25s ease',
          }}
          onClick={() => setSelectedPoster(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '450px',
              width: '100%',
              backgroundColor: 'var(--navy-800)',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px solid var(--gold-500)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--white-10)' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--gold-400)' }}>
                📅 Poster - {formatDate(selectedPoster.date)}
              </span>
              <button
                onClick={() => setSelectedPoster(null)}
                style={{ background: 'none', border: 'none', color: 'var(--white-70)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Image */}
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', backgroundColor: 'var(--navy-950)' }}>
              <img
                src={selectedPoster.imageUrlOrData}
                alt="Full Poster Preview"
                style={{ width: '100%', maxHeight: '450px', objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
              />
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px', borderTop: '1px solid var(--white-10)', display: 'flex', gap: '12px' }}>
              <button
                onClick={() => triggerDownload(selectedPoster.imageUrlOrData, `gold-rate-poster-${selectedPoster.date}.png`)}
                className="btn btn-primary btn-full"
              >
                ⬇️ Download Image PNG
              </button>
              <button
                onClick={() => handleWhatsAppShare(selectedPoster)}
                className="btn btn-whatsapp"
                disabled={sharing}
                style={{ width: '60px' }}
              >
                {sharing ? <div className="spinner spinner-sm" /> : '📱'}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default History;
