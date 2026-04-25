import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__logo"><span>🍳</span></div>
        <h2>Welcome Back</h2>
        <p className="auth-card__sub">Sign in to your RecipeNest account</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="you@example.com" required autoComplete="email" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange}
              placeholder="••••••••" required autoComplete="current-password" />
          </div>
          <button type="submit" className="btn btn-primary btn-full" style={{marginTop:'0.5rem'}} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-card__footer">
          Don't have an account? <Link to="/register">Create one free</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
