import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Add shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => setMenuOpen(false), [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">

        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-icon">🍳</span>
          <span className="navbar__logo-text">Recipe<span>Nest</span></span>
        </Link>

        {/* Desktop Links */}
        <ul className="navbar__links">
          <li><Link to="/chefs"   className={isActive('/chefs')   ? 'active' : ''}>Chefs</Link></li>
          <li><Link to="/recipes" className={isActive('/recipes') ? 'active' : ''}>Recipes</Link></li>
        </ul>

        {/* Right side */}
        <div className="navbar__actions">
          {/* Dark mode toggle */}
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
              {user.role === 'chef'  && <Link to="/dashboard" className={`btn btn-ghost btn-sm ${isActive('/dashboard') ? 'active-btn' : ''}`}>Dashboard</Link>}
              {user.role === 'admin' && <Link to="/admin"     className={`btn btn-ghost btn-sm ${isActive('/admin')     ? 'active-btn' : ''}`}>Admin</Link>}
              <div className="navbar__user">
                <div className="navbar__avatar">{user.name.charAt(0).toUpperCase()}</div>
                <span className="navbar__username">{user.name.split(' ')[0]}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
            </>
          )}

          {/* Hamburger */}
          <button className={`hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`navbar__mobile ${menuOpen ? 'open' : ''}`}>
        <Link to="/chefs">Chefs</Link>
        <Link to="/recipes">Recipes</Link>
        {!user ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm" style={{width:'fit-content'}}>Join Free</Link>
          </>
        ) : (
          <>
            {user.role === 'chef'  && <Link to="/dashboard">Dashboard</Link>}
            {user.role === 'admin' && <Link to="/admin">Admin Panel</Link>}
            <button onClick={handleLogout} style={{textAlign:'left',background:'none',border:'none',color:'var(--primary)',fontWeight:600,fontSize:'1rem',padding:0}}>Logout</button>
          </>
        )}
        <button className="theme-toggle" onClick={toggle}>{dark ? '☀️ Light Mode' : '🌙 Dark Mode'}</button>
      </div>
    </nav>
  );
};

export default Navbar;
