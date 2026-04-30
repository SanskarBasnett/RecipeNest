import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'chef') navigate('/dashboard');
      else navigate('/my');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-[calc(100vh-68px)] flex items-center justify-center p-8"
      style={{ background: 'linear-gradient(135deg, #fff8f0 0%, var(--bg) 100%)' }}
    >
      <div
        className="w-full max-w-[460px] rounded-2xl p-10"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <span
            className="inline-flex items-center justify-center w-[52px] h-[52px] rounded-[14px] text-white text-2xl font-extrabold"
            style={{ background: 'var(--primary)' }}
          >
            RN
          </span>
        </div>

        <h2 className="text-[1.7rem] text-center mb-1">Welcome</h2>
        <p className="text-center text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          Sign in to your RecipeNest account
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="you@example.com" required autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password" name="password" value={form.password} onChange={handleChange}
              placeholder="••••••••" required autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full mt-2" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
