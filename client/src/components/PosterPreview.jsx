/**
 * PosterPreview Component
 * Renders the visual poster that will be exported via html2canvas
 * Dynamically applies colors and layout styles from the active template
 */
import React from 'react';

const PosterPreview = ({ posterRef, data }) => {
  const {
    shopName = 'Your Jewelry Shop',
    shopAddress = '',
    shopPhone = '',
    logoUrl = '',
    gold22k = 0,
    gold24k = 0,
    gold18k = 0,
    silverRate = 0,
    date = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    colors = { background: '#ffffff', primary: '#d4a017', secondary: '#111827' },
    backgroundImageUrl = '',
    templateName = '',
    category = 'daily',
  } = data || {};

  const lowerName = (templateName || '').toLowerCase();
  const isFestival = category === 'festival' || 
    /pongal|sankranti|shivratri|ugadi|holi|akshaya|bridal|wedding|raksha|varalakshmi|ganesh|onam|dussehra|navratri|diwali|dhanteras|christmas|new year|festival/i.test(templateName);

  const isDiamond = lowerName.includes('diamond');
  const isSilver = lowerName.includes('silver');
  const isGold = lowerName.includes('gold') || (!isDiamond && !isSilver);
  const isCollaborate = lowerName.includes('collaborate') || (lowerName.includes('gold') && lowerName.includes('diamond') && lowerName.includes('silver')) || lowerName.includes('&') || lowerName.includes('special');

  // Premium high-resolution curated jewelry photography for poster highlights
  const FESTIVAL_JEWELRY_IMAGES = {
    gold: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85', // Royal Gold Necklace
      'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&w=800&q=85', // Intricate Gold Bangles
      'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=800&q=85', // Temple Polki Gold
      'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=800&q=85', // Pure 24K Gold Coin & Chains
      '/images/gold_bg_2.png'
    ],
    diamond: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=85', // Diamond Solitaire Ring
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=85', // Brilliant Diamond Band
      'https://images.unsplash.com/photo-1611591475871-344426543b35?auto=format&fit=crop&w=800&q=85', // Diamond & Emerald Pendant
      '/images/diamond_bg_1.png',
      '/images/diamond_bg_3.png'
    ],
    silver: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=85', // Fine Sterling Silver & Pearl
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=85', // Pure Silver Jewels
      '/images/silver_bg_1.png',
      '/images/silver_bg_2.png',
      '/images/silver_bg_3.png'
    ],
    collaborate: [
      'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=800&q=85', // Ruby & Gold Wedding Set
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85',
      '/images/diwali_bg_2.png',
      '/images/pongal_bg_1.png',
      'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=85'
    ]
  };

  // Consistent jewelry selection for templates
  const getFestivalJewelryImage = () => {
    let type = 'gold';
    if (isDiamond) type = 'diamond';
    else if (isSilver) type = 'silver';
    else if (isCollaborate) type = 'collaborate';

    const list = FESTIVAL_JEWELRY_IMAGES[type];
    let hash = 0;
    const nameStr = templateName || '';
    for (let i = 0; i < nameStr.length; i++) {
      hash += nameStr.charCodeAt(i);
    }
    const index = hash % list.length;
    return list[index];
  };

  // Always force light bg colors for a clean white premium appearance
  const isLightBg = true;
  let festivalTitle = '';
  let greetingText = '';
  let isDiwali = false;
  let isPongal = false;

  if (isFestival) {
    if (lowerName.includes('diwali') || lowerName.includes('dhanteras')) {
      festivalTitle = 'Happy Diwali';
      greetingText = 'May this festival of lights bring you joy, peace, and prosperity.';
      isDiwali = true;
    } else if (lowerName.includes('pongal') || lowerName.includes('sankranti')) {
      festivalTitle = 'Happy Pongal';
      greetingText = 'Wishing you a harvest of happiness and prosperity.';
      isPongal = true;
    } else if (lowerName.includes('akshaya') || lowerName.includes('tritiya')) {
      festivalTitle = 'Akshaya Tritiya';
      greetingText = 'May this auspicious day bring you endless wealth and gold.';
    } else if (lowerName.includes('navratri') || lowerName.includes('dussehra')) {
      festivalTitle = 'Happy Navratri';
      greetingText = 'Wishing you nine nights of devotion, strength, and joy.';
    } else if (lowerName.includes('christmas') || lowerName.includes('new year')) {
      festivalTitle = 'Merry Christmas';
      greetingText = 'Wishing you a season of peace, love, and joy.';
    } else if (lowerName.includes('wedding') || lowerName.includes('bridal')) {
      festivalTitle = 'Bridal Showcase';
      greetingText = 'Timeless jewelry for your special and auspicious day.';
    } else if (lowerName.includes('raksha') || lowerName.includes('bandhan')) {
      festivalTitle = 'Raksha Bandhan';
      greetingText = 'Celebrating the golden bond of love and protection.';
    } else if (lowerName.includes('ganesh') || lowerName.includes('chaturthi')) {
      festivalTitle = 'Ganesh Chaturthi';
      greetingText = 'May Lord Ganesha bless you with health, wealth, and wisdom.';
    } else if (lowerName.includes('onam')) {
      festivalTitle = 'Happy Onam';
      greetingText = 'Wishing you a prosperous, healthy, and colorful Onam.';
    } else {
      festivalTitle = 'Festival Greetings';
      greetingText = 'Celebrating life’s golden moments with you.';
    }
  }

  // Solid Background Color from active template database
  const activeBgColor = colors?.background || '#ffffff';

  // Determine if background is dark or light to guarantee ultra-crisp readable typography
  const isDarkBg = (() => {
    if (!activeBgColor) return false;
    const hex = activeBgColor.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return (r * 299 + g * 587 + b * 114) / 1000 < 140;
    }
    return false;
  })();

  // Dynamic high-contrast colors:
  const textPrimary = isDarkBg ? '#fde047' : '#92400e'; // Bright warm gold on dark, rich golden bronze on light
  const textSecondary = isDarkBg ? '#ffffff' : '#0f172a'; // Crisp white on dark, deep slate-black on light
  const textMuted = isDarkBg ? '#cbd5e1' : '#64748b';
  const shopNameColor = isDarkBg ? '#fef08a' : '#111827';

  const styleBlock = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;800;900&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Inter:wght@400;500;600;700;800;900&display=swap');
      @keyframes flameFlicker {
        0%, 100% { transform: scale(1) rotate(-1deg); opacity: 0.95; }
        50% { transform: scale(1.06) rotate(1deg); opacity: 1; }
      }
      .diya-flame {
        animation: flameFlicker 0.4s infinite ease-in-out;
      }
      @keyframes sparkGrow {
        0%, 100% { transform: scale(0.9); opacity: 0.4; }
        50% { transform: scale(1.1); opacity: 0.7; }
      }
      .firework-sparkle {
        animation: sparkGrow 2s infinite ease-in-out;
        transform-origin: 50px 50px;
      }
    `}</style>
  );

  const displayDate =
    date instanceof Date
      ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : date;

  // Solid Background with Double Gold Border
  const containerStyle = {
    background: activeBgColor,
    color: textSecondary,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 16px',
    width: '380px',
    height: '480px',
    borderRadius: '16px',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: isDarkBg ? '0 16px 48px rgba(0, 0, 0, 0.4)' : '0 12px 40px rgba(0, 0, 0, 0.12)',
    border: '3px double #d4a017',
    boxSizing: 'border-box',
  };

  const formattedGold22k = Number(gold22k || 0).toLocaleString('en-IN');
  const formattedGold24k = Number(gold24k || 0).toLocaleString('en-IN');
  const formattedGold18k = Number(gold18k || 0).toLocaleString('en-IN');
  const formattedSilver = Number(silverRate || 0).toLocaleString('en-IN');

  const festivalJewelryImgUrl = getFestivalJewelryImage();

  const rateBoxStyle = {
    background: 'transparent',
    border: 'none',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    boxShadow: 'none',
    padding: '0px',
    width: 'fit-content',
    boxSizing: 'border-box'
  };

  return (
    <div className="poster-preview-wrapper" style={{ padding: '16px', background: 'var(--navy-950)', borderRadius: '12px', display: 'flex', justifyContent: 'center' }}>
      {styleBlock}
      <div style={containerStyle} ref={posterRef} id="poster-capture">
        
        {/* Double Concentric Gold Border Lines */}
        <div style={{
          position: 'absolute',
          top: '6px',
          left: '6px',
          right: '6px',
          bottom: '6px',
          border: '1.2px solid rgba(212, 160, 23, 0.35)',
          pointerEvents: 'none',
          zIndex: 10,
          borderRadius: '12px',
        }} />
        <div style={{
          position: 'absolute',
          top: '9px',
          left: '9px',
          right: '9px',
          bottom: '9px',
          border: '0.6px dashed rgba(212, 160, 23, 0.2)',
          pointerEvents: 'none',
          zIndex: 10,
          borderRadius: '8px',
        }} />

        {/* Traditional Hanging Bells for Festival templates (Non-Pongal) */}
        {isFestival && !isPongal && (
          <>
            <svg viewBox="0 0 40 100" style={{ position: 'absolute', top: '10px', left: '16px', width: '14px', height: '36px', opacity: 0.7, pointerEvents: 'none', zIndex: 11 }}>
              <line x1="20" y1="0" x2="20" y2="60" stroke="#d4a017" strokeWidth="1" />
              <path d="M12,60 Q20,55 28,60 L30,75 Q20,78 10,75 Z" fill="#d4a017" />
              <circle cx="20" cy="78" r="3" fill="#d4a017" />
            </svg>
            <svg viewBox="0 0 40 100" style={{ position: 'absolute', top: '10px', right: '16px', width: '14px', height: '36px', opacity: 0.7, pointerEvents: 'none', zIndex: 11 }}>
              <line x1="20" y1="0" x2="20" y2="60" stroke="#d4a017" strokeWidth="1" />
              <path d="M12,60 Q20,55 28,60 L30,75 Q20,78 10,75 Z" fill="#d4a017" />
              <circle cx="20" cy="78" r="3" fill="#d4a017" />
            </svg>
          </>
        )}

        {/* Content Wrapper */}
        <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', width: '100%', height: '100%', position: 'relative', justifyContent: 'space-between' }}>
          
          {/* 1. Header (Logo + Shop Name + Date Capsule) - Compact design */}
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '2px 0 4px',
            boxSizing: 'border-box',
            zIndex: 10
          }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ width: '42px', height: '42px', borderRadius: '50%', border: `1.5px solid #d4a017`, objectFit: 'cover', marginBottom: '3px' }} />
            ) : (
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #d4a017, #fff9e6)', border: '1.5px solid #d4a017', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', marginBottom: '3px' }}>💍</div>
            )}

            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '1.2rem',
              fontWeight: '800',
              color: shopNameColor,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              textAlign: 'center',
              lineHeight: '1.1'
            }}>
              {shopName}
            </div>

            {/* Subtle Divider Line */}
            <div style={{
              height: '1.5px',
              background: 'linear-gradient(to right, transparent, #d4a017, transparent)',
              width: '55%',
              margin: '3px 0 5px'
            }} />

            {/* Date Capsule */}
            <div style={{
              fontSize: '0.65rem',
              color: isDarkBg ? '#0f172a' : '#ffffff',
              background: isDarkBg ? '#fde047' : '#92400e',
              borderRadius: '10px',
              padding: '2px 14px',
              fontWeight: '800',
              display: 'inline-flex',
              alignItems: 'center',
              letterSpacing: '0.03em',
              boxShadow: isDarkBg ? '0 2px 8px rgba(253, 224, 71, 0.4)' : '0 2px 6px rgba(146, 64, 14, 0.25)'
            }}>
              📅 {displayDate}
            </div>
          </div>

          {/* 2. Body: Rates Column (Left 33%) & Product Image (Right 67%) */}
          <div style={{
            display: 'flex',
            width: '100%',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            minHeight: 0,
            padding: '4px 0',
            boxSizing: 'border-box',
            zIndex: 10
          }}>
            {/* Left Column: Rates Stack */}
            <div style={{
              width: '35%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              paddingLeft: '12px',
              gap: '12px',
              boxSizing: 'border-box'
            }}>
              {/* Gold 24 Carat */}
              <div style={rateBoxStyle}>
                <div style={{ fontSize: '0.62rem', fontWeight: '800', color: textPrimary, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: "'Inter', sans-serif", marginBottom: '1px' }}>Gold 24 Carat</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '900', fontFamily: "'Inter', sans-serif", color: textSecondary, lineHeight: '1.1', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>₹{formattedGold24k} <span style={{ fontSize: '0.72rem', fontWeight: '500', color: textMuted }}>/g</span></div>
              </div>

              {/* Gold 22 Carat */}
              <div style={rateBoxStyle}>
                <div style={{ fontSize: '0.62rem', fontWeight: '800', color: textPrimary, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: "'Inter', sans-serif", marginBottom: '1px' }}>Gold 22 Carat</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '900', fontFamily: "'Inter', sans-serif", color: textSecondary, lineHeight: '1.1', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>₹{formattedGold22k} <span style={{ fontSize: '0.72rem', fontWeight: '500', color: textMuted }}>/g</span></div>
              </div>

              {/* Gold 18 Carat */}
              <div style={rateBoxStyle}>
                <div style={{ fontSize: '0.62rem', fontWeight: '800', color: textPrimary, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: "'Inter', sans-serif", marginBottom: '1px' }}>Gold 18 Carat</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '900', fontFamily: "'Inter', sans-serif", color: textSecondary, lineHeight: '1.1', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>₹{formattedGold18k} <span style={{ fontSize: '0.72rem', fontWeight: '500', color: textMuted }}>/g</span></div>
              </div>

              {/* Silver Rate */}
              <div style={rateBoxStyle}>
                <div style={{ fontSize: '0.62rem', fontWeight: '800', color: textPrimary, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: "'Inter', sans-serif", marginBottom: '1px' }}>Silver Rate</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '900', fontFamily: "'Inter', sans-serif", color: textSecondary, lineHeight: '1.1', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>₹{formattedSilver} <span style={{ fontSize: '0.72rem', fontWeight: '500', color: textMuted }}>/g</span></div>
              </div>
            </div>


            {/* Right Column: Clean, frameless product image slot (no blurry reflection, no circle) */}
            <div style={{
              width: '67%',
              height: '290px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0px',
              boxSizing: 'border-box',
              position: 'relative',
              background: 'transparent',
              overflow: 'hidden'
            }}>
              {/* Main product image container on top (contain-fit to prevent cropping, floating cleanly on white background) */}
              <img
                src={backgroundImageUrl || festivalJewelryImgUrl}
                alt="Product"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain', // contain to show full design
                  borderRadius: '12px', // rounded corners for clean card presentation
                  filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.12))'
                }}
              />
            </div>
          </div>

          {/* 3. Footer Bar (Edge-to-Edge Solid Bar) - Compact design */}
          <div style={{
            background: 'linear-gradient(180deg, #3e2723 0%, #27120a 100%)', // premium dark brown footer
            borderTop: '1.5px solid #d4a017',
            marginLeft: '-16px',
            marginRight: '-16px',
            marginBottom: '-16px',
            padding: '8px 10px 10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            boxSizing: 'border-box',
            zIndex: 10
          }}>
            {/* Phone & Address */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              fontSize: '0.65rem',
              color: '#ffffff',
              fontWeight: '500',
              textAlign: 'center',
              width: '100%'
            }}>
              {shopPhone && <span>📞 {shopPhone}</span>}
              {shopPhone && shopAddress && <span style={{ opacity: 0.5 }}>|</span>}
              {shopAddress && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>📍 {shopAddress}</span>}
            </div>

            {/* Disclaimer / Greeting */}
            <div style={{
              fontSize: '0.52rem',
              color: '#eedcb5',
              opacity: 0.9,
              textAlign: 'center',
              fontStyle: 'italic',
              marginTop: '1px'
            }}>
              {greetingText ? greetingText : '* Rates are indicative. Contact us for exact pricing.'}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PosterPreview;
