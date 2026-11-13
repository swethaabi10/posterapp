import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const themes = [
    {
      id: 'ivory',
      name: 'Classic Ivory',
      bg: '#faf8f2',
      primary: '#c5a059',
      isLight: true
    },
    {
      id: 'pink',
      name: 'Rose Quartz',
      bg: '#fdf8f7',
      primary: '#b56c60',
      isLight: true
    },
    {
      id: 'emerald',
      name: 'Mint Emerald',
      bg: '#f3f7f5',
      primary: '#0f764c',
      isLight: true
    },
    {
      id: 'sapphire',
      name: 'Sapphire Blue',
      bg: '#f1f4f8',
      primary: '#1d4ed8',
      isLight: true
    },
    {
      id: 'navy',
      name: 'Midnight Navy',
      bg: '#0a1628',
      primary: '#e8b923',
      isLight: false
    }
  ];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeThemeObj = themes.find(t => t.id === theme) || themes[0];

  return (
    <div className="theme-switcher-container" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="theme-switcher-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--white-10)',
          background: 'var(--white-05)',
          color: 'var(--white-90)',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        aria-label="Change style theme"
      >
        <span style={{ fontSize: '1rem' }}>🎨</span>
        <span className="theme-btn-text">Style: {activeThemeObj.name}</span>
      </button>

      {isOpen && (
        <div
          className="theme-dropdown animate-fadeIn"
          style={{
            position: 'absolute',
            top: '40px',
            right: 0,
            background: 'var(--navy-800)',
            border: '1px solid var(--white-10)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            padding: '12px',
            width: '210px',
            zIndex: 1100,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'var(--white-50)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: '1px solid var(--white-10)',
            paddingBottom: '6px',
            marginBottom: '2px'
          }}>
            Select Color Styling
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {themes.map((t) => {
              const isActive = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: isActive ? '1px solid var(--gold-500)' : '1px solid transparent',
                    background: isActive ? 'var(--gold-gradient-soft)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                    color: isActive ? 'var(--gold-500)' : 'var(--white-90)'
                  }}
                  className="theme-option-item"
                >
                  {/* Theme swatch circle with split colors */}
                  <div style={{
                    position: 'relative',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: '1.5px solid var(--white-20)',
                    overflow: 'hidden',
                    background: t.bg,
                    flexShrink: 0
                  }}>
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: '0',
                      height: '0',
                      borderStyle: 'solid',
                      borderWidth: '0 0 20px 20px',
                      borderColor: `transparent transparent ${t.primary} transparent`
                    }} />
                  </div>

                  <span style={{ fontSize: '0.8rem', fontWeight: isActive ? 'bold' : 'normal' }}>
                    {t.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;
