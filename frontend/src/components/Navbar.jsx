import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import API from '../api/axios';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen]     = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [unread, setUnread]         = useState(0);

  // Poll unread notification count for chefs
  useEffect(() => {
    if (user?.role !== 'chef') return;
    const fetch = () => {
      API.get('/notifications/unread-count')
        .then(({ data }) => setUnread(data.count))
        .catch(() => {});
    };
    fetch();
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location]);

  const handleLogout = () => {
    logout();
    setShowPrompt(false);
    navigate('/');
  };

  // Clicking the logo when logged in shows a prompt instead of navigating
  const handleLogoClick = (e) => {
    if (user) {
      e.preventDefault();
      setShowPrompt(true);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
        <div className="navbar__inner container">

          {/* Logo */}
          <Link to="/" className="navbar__logo" onClick={handleLogoClick}>
            <span className="navbar__logo-icon">🍳</span>
            <span className="navbar__logo-text">Recipe<span>Nest</span></span>
          </Link>

          {/* Desktop Links — hidden when logged in */}
          {!user && (
            <ul className="navbar__links">
              <li><Link to="/chefs"   className={isActive('/chefs')   ? 'active' : ''}>Chefs</Link></li>
              <li><Link to="/recipes" className={isActive('/recipes') ? 'active' : ''}>Recipes</Link></li>
            </ul>
          )}

          {/* Right side */}
          <div className="navbar__actions">
            <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
              {dark ? '☀️' : '🌙'}
            </button>

            {!user ? (
              <>
                <Link to="/login"    className="btn btn-ghost btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Join Free</Link>
              </>
            ) : (
              <>
                {user.role === 'chef'  && (
                  <Link to="/dashboard" className={`btn btn-ghost btn-sm ${isActive('/dashboard') ? 'active-btn' : ''}`}>
                    Dashboard
                  </Link>
                )}
                {user.role === 'chef' && (
                  <Link to="/dashboard?tab=notifications" className="navbar__bell" aria-label="Notifications" onClick={() => setUnread(0)}>
                    🔔
                    {unread > 0 && <span className="navbar__bell-badge">{unread > 9 ? '9+' : unread}</span>}
                  </Link>
                )}
                {user.role === 'user'  && (
                  <Link to="/my" className={`btn btn-ghost btn-sm ${isActive('/my') ? 'active-btn' : ''}`}>
                    My Feed
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" className={`btn btn-ghost btn-sm ${isActive('/admin') ? 'active-btn' : ''}`}>
                    Admin
                  </Link>
                )}
                <div className="navbar__user">
                  <div className="navbar__avatar">{user.name.charAt(0).toUpperCase()}</div>
                  <span className="navbar__username">{user.name.split(' ')[0]}</span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
              </>
            )}

            <button className={`hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`navbar__mobile ${menuOpen ? 'open' : ''}`}>
          {!user && (
            <>
              <Link to="/chefs">Chefs</Link>
              <Link to="/recipes">Recipes</Link>
            </>
          )}
          {!user ? (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm" style={{ width: 'fit-content' }}>Join Free</Link>
            </>
          ) : (
            <>
              {user.role === 'chef'  && <Link to="/dashboard">Dashboard</Link>}
              {user.role === 'user'  && <Link to="/my">My Feed</Link>}
              {user.role === 'admin' && <Link to="/admin">Admin Panel</Link>}
              <button onClick={handleLogout} style={{ textAlign: 'left', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '1rem', padding: 0 }}>
                Logout
              </button>
            </>
          )}
          <button className="theme-toggle" onClick={toggle}>{dark ? '☀️ Light Mode' : '🌙 Dark Mode'}</button>
        </div>
      </nav>

      {/* Logout prompt overlay */}
      {showPrompt && (
        <div className="navbar__overlay" onClick={() => setShowPrompt(false)}>
          <div className="navbar__prompt" onClick={e => e.stopPropagation()}>
            <p>You need to log out to return to the home page.</p>
            <div className="navbar__prompt-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPrompt(false)}>Stay</button>
              <button className="btn btn-primary btn-sm" onClick={handleLogout}>Logout & Go Home</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
