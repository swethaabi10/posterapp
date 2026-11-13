import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const TemplateCard = ({ template, onUnlock }) => {
  const navigate = useNavigate();
  const { _id, name, category, colors, layoutType, backgroundImageUrl, isUsedThisMonth, defaultGoldRate22k, defaultGoldRate24k } = template;
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  const handleCardClick = () => {
    if (isUsedThisMonth) {
      setShowLockedModal(true);
      return;
    }
    navigate(`/editor/${_id}`);
  };

  const handleUnlockAndEdit = async (e) => {
    e.stopPropagation();
    try {
      setUnlocking(true);
      await api.post(`/templates/${_id}/unlock`);
      setShowLockedModal(false);
      if (onUnlock) onUnlock(_id);
      navigate(`/editor/${_id}`);
    } catch (err) {
      console.error('Failed to unlock template:', err);
      // Still navigate so user is never locked out
      navigate(`/editor/${_id}`);
    } finally {
      setUnlocking(false);
    }
  };

  const rate22k = Number(defaultGoldRate22k) || 6890;
  const rate24k = Number(defaultGoldRate24k) || 7450;

  return (
    <>
      <div
        className="template-thumbnail-card animate-fadeInUp"
        onClick={handleCardClick}
        style={{
          cursor: 'pointer',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'var(--navy-800)',
          border: isUsedThisMonth ? '2px solid rgba(239, 68, 68, 0.45)' : '1px solid var(--white-10)',
          borderRadius: '16px',
          transition: 'all 0.25s ease',
          height: '100%',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: isUsedThisMonth ? '0 4px 20px rgba(239, 68, 68, 0.15)' : '0 4px 16px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* High-Resolution Poster Card Preview */}
        <div
          style={{
            width: '100%',
            height: '140px',
            borderRadius: '12px',
            background: colors?.background || '#0f172a',
            backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : 'none',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            border: isUsedThisMonth 
              ? '2px solid rgba(239, 68, 68, 0.6)' 
              : `2px solid ${colors?.primary || '#e8b923'}`,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Top Header Badge */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '6px 8px',
            background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 0%, transparent 100%)',
            zIndex: 2
          }}>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(232, 185, 35, 0.25)',
              color: '#fde047',
              border: '1px solid rgba(232, 185, 35, 0.4)'
            }}>
              {category === 'festival' ? '✨ Festival' : '👑 Luxury Gold'}
            </span>

            {isUsedThisMonth && (
              <span style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                color: '#fee2e2',
                background: '#ef4444',
                padding: '2px 8px',
                borderRadius: '9999px',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
              }}>
                🔒 LOCKED
              </span>
            )}
          </div>

          {/* Bottom Live Rate Pill */}
          <div style={{
            padding: '8px',
            background: 'linear-gradient(to top, rgba(5, 13, 26, 0.95) 0%, rgba(5, 13, 26, 0.7) 60%, transparent 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            zIndex: 2
          }}>
            <div>
              <div style={{ fontSize: '0.62rem', color: '#cbd5e1', fontWeight: 500 }}>Daily Rates</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fef08a', fontFamily: 'var(--font-display)' }}>
                22K: ₹{rate22k.toLocaleString('en-IN')}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-display)' }}>
                24K: ₹{rate24k.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Already Used Centered Lock Overlay */}
          {isUsedThisMonth && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.82)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              zIndex: 10,
              padding: '10px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.4rem', marginBottom: '2px' }}>🔒</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fca5a5' }}>Used & Locked</div>
              <div style={{ fontSize: '0.62rem', color: '#e2e8f0', marginTop: '3px', lineHeight: 1.2 }}>
                Click to unlock or choose another
              </div>
            </div>
          )}
        </div>

        {/* Card Details Footer */}
        <div style={{ width: '100%', marginTop: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              fontSize: '0.85rem',
              color: isUsedThisMonth ? '#94a3b8' : 'var(--white)',
              fontWeight: '600',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
            }}
            title={name}
          >
            {name}
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {isUsedThisMonth ? (
              <span
                style={{
                  fontSize: '0.62rem',
                  color: '#ef4444',
                  background: 'rgba(239, 68, 68, 0.12)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}
              >
                🔒 Downloaded
              </span>
            ) : (
              <span className="badge badge-gold" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                {category}
              </span>
            )}
            <span
              style={{
                fontSize: '0.62rem',
                color: 'var(--white-50)',
                background: 'rgba(255,255,255,0.05)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--white-10)',
                textTransform: 'uppercase',
              }}
            >
              {layoutType}
            </span>
          </div>
        </div>
      </div>

      {/* Locked Template Modal Dialog */}
      {showLockedModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--navy-900)',
            border: '1px solid rgba(232, 185, 35, 0.4)',
            borderRadius: '20px',
            padding: '28px 24px',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            textAlign: 'center',
            animation: 'fadeInUp 0.3s ease'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔒</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: '#ffffff', marginBottom: '8px' }}>
              Design Already Published
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--white-70)', lineHeight: '1.5', marginBottom: '20px' }}>
              You downloaded <strong>{name}</strong> today. To keep your jewelry shop’s social media feed unique and exciting for your customers, we lock used designs so you can explore fresh layouts.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={() => setShowLockedModal(false)}
              >
                ✨ Choose Another Fresh Template
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-full btn-sm"
                disabled={unlocking}
                onClick={handleUnlockAndEdit}
                style={{ fontSize: '0.82rem', borderColor: 'rgba(232, 185, 35, 0.5)', color: 'var(--gold-400)' }}
              >
                {unlocking ? 'Unlocking...' : '🔓 Unlock & Re-edit This Design Anyway'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TemplateCard;
