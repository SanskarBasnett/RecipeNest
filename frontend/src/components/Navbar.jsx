import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import API from '../api/axios';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen]     = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [unread, setUnread]         = useState(0);

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

  const handleLogoClick = (e) => {
    if (user) { e.preventDefault(); setShowPrompt(true); }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav
        className={`sticky top-0 z-[200] transition-all duration-300 border-b`}
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border)',
          boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.08)' : 'none',
        }}
      >
        <div className="container flex items-center h-[68px] gap-8">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-[1.4rem] font-bold flex-shrink-0"
            style={{ color: 'var(--text)' }}
            onClick={handleLogoClick}
          >
            <span
              className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm font-extrabold flex-shrink-0"
              style={{ background: 'var(--primary)' }}
            >
              RN
            </span>
            <span>
              Recipe<span style={{ color: 'var(--primary)' }}>Nest</span>
            </span>
          </Link>

          {/* Desktop Links */}
          {!user && (
            <ul className="hidden md:flex gap-1 flex-1">
              {[{ to: '/chefs', label: 'Chefs' }, { to: '/recipes', label: 'Recipes' }].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      isActive(to)
                        ? 'text-[var(--primary)] bg-[rgba(242,140,0,0.10)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[rgba(242,140,0,0.08)]'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2.5 ml-auto">
            {/* Theme toggle */}
            <button
              className="flex items-center justify-center w-9 h-9 rounded-full text-sm transition-all duration-200 flex-shrink-0"
              style={{ background: 'var(--bg)', border: '1.5px solid var(--border)' }}
              onClick={toggle}
              aria-label="Toggle theme"
            >
              {dark ? '☀' : '🌙'}
            </button>

            {!user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login"    className="btn btn-ghost btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Join Free</Link>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                {user.role === 'chef' && (
                  <Link
                    to="/dashboard?tab=notifications"
                    className="relative flex items-center justify-center w-9 h-9 rounded-full text-lg transition-all duration-150 hover:bg-[rgba(242,140,0,0.1)]"
                    aria-label="Notifications"
                    onClick={() => setUnread(0)}
                  >
                    🔔
                    {unread > 0 && (
                      <span className="absolute top-0 right-0 flex items-center justify-center min-w-[16px] h-4 bg-red-600 text-white text-[0.6rem] font-bold rounded-full px-1 border-2"
                        style={{ borderColor: 'var(--bg-card)' }}>
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </Link>
                )}
                <div
                  className="flex items-center justify-center w-[34px] h-[34px] rounded-full text-white font-bold text-sm flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
              </div>
            )}

            {/* Hamburger */}
            <button
              className="flex md:hidden flex-col gap-[5px] bg-transparent border-0 p-1 flex-shrink-0"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              <span
                className="block w-[22px] h-0.5 rounded-sm transition-all duration-300"
                style={{
                  background: 'var(--text)',
                  transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none',
                }}
              />
              <span
                className="block w-[22px] h-0.5 rounded-sm transition-all duration-300"
                style={{ background: 'var(--text)', opacity: menuOpen ? 0 : 1 }}
              />
              <span
                className="block w-[22px] h-0.5 rounded-sm transition-all duration-300"
                style={{
                  background: 'var(--text)',
                  transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
                }}
              />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            className="flex md:hidden flex-col gap-1 px-6 pb-6 pt-2 border-t"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            {!user && (
              <>
                <Link to="/chefs"   className="px-2 py-2.5 text-base font-medium rounded-lg transition-all hover:text-[var(--primary)] hover:bg-[rgba(242,140,0,0.08)]" style={{ color: 'var(--text)' }}>Chefs</Link>
                <Link to="/recipes" className="px-2 py-2.5 text-base font-medium rounded-lg transition-all hover:text-[var(--primary)] hover:bg-[rgba(242,140,0,0.08)]" style={{ color: 'var(--text)' }}>Recipes</Link>
              </>
            )}
            {!user ? (
              <>
                <Link to="/login"    className="px-2 py-2.5 text-base font-medium" style={{ color: 'var(--text)' }}>Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm w-fit">Join Free</Link>
              </>
            ) : (
              <>
                {user.role === 'chef'  && <Link to="/dashboard" className="px-2 py-2.5 text-base font-medium" style={{ color: 'var(--text)' }}>Dashboard</Link>}
                {user.role === 'user'  && <Link to="/my"        className="px-2 py-2.5 text-base font-medium" style={{ color: 'var(--text)' }}>My Feed</Link>}
                {user.role === 'admin' && <Link to="/admin"     className="px-2 py-2.5 text-base font-medium" style={{ color: 'var(--text)' }}>Admin Panel</Link>}
                <button
                  onClick={handleLogout}
                  className="text-left bg-transparent border-0 font-semibold text-base p-0 px-2 py-2.5 cursor-pointer"
                  style={{ color: 'var(--primary)' }}
                >
                  Logout
                </button>
              </>
            )}
            <button
              className="flex items-center justify-center w-9 h-9 rounded-full text-sm mt-1 self-start"
              style={{ background: 'var(--bg)', border: '1.5px solid var(--border)' }}
              onClick={toggle}
            >
              {dark ? '☀ Light' : '🌙 Dark'}
            </button>
          </div>
        )}
      </nav>

      {/* Logout prompt overlay */}
      {showPrompt && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setShowPrompt(false)}
        >
          <div
            className="rounded-xl p-8 max-w-sm w-full text-center"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text)' }}>
              You need to log out to return to the home page.
            </p>
            <div className="flex gap-3 justify-center">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPrompt(false)}>Stay</button>
              <button className="btn btn-primary btn-sm" onClick={handleLogout}>Logout &amp; Go Home</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
