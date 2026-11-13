import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeSwitcher from './ThemeSwitcher';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="navbar-brand">
          <div className="navbar-logo-icon">💍</div>
          <span className="navbar-brand-text">Poster App</span>
        </Link>

        <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isAuthenticated && (
            <ul className={`navbar-nav ${menuOpen ? 'open' : ''}`}>
              {(user?.paymentStatus === 'approved' || user?.role === 'admin') && (
                <>
                  <li>
                    <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>
                      🏠 Dashboard
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/editor" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>
                      ✏️ Editor
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/history" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>
                      📋 History
                    </NavLink>
                  </li>
                </>
              )}
              {user?.role === 'admin' && (
                <li>
                  <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>
                    🛡️ Admin
                  </NavLink>
                </li>
              )}
              {(user?.paymentStatus === 'approved' || user?.role === 'admin') && (
                <li>
                  <NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>
                    👤 {user?.name?.split(' ')[0] || 'Profile'}
                  </NavLink>
                </li>
              )}
              <li>
                <button className="nav-logout" onClick={handleLogout}>
                  🚪 Logout
                </button>
              </li>
            </ul>
          )}

          <ThemeSwitcher />

          {isAuthenticated && (
            <button
              className="navbar-toggle"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle navigation"
              style={{ margin: 0 }}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
