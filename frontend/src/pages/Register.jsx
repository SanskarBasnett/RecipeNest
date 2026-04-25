import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const selectRole   = (role) => setForm({ ...form, role });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.role);
      if (user.role === 'chef') navigate('/dashboard');
      else navigate('/my');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__logo"><span>🍳</span></div>
        <h2>Join RecipeNest</h2>
        <p className="auth-card__sub">Create your free account today</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Role selector */}
          <div className="form-group">
            <label>I want to join as...</label>
            <div className="role-selector">
              <div className={`role-option ${form.role === 'user' ? 'selected' : ''}`} onClick={() => selectRole('user')}>
                <div className="role-option__icon">🍴</div>
                <div className="role-option__label">Food Lover</div>
                <div className="role-option__desc">Browse & discover recipes</div>
              </div>
              <div className={`role-option ${form.role === 'chef' ? 'selected' : ''}`} onClick={() => selectRole('chef')}>
                <div className="role-option__icon">👨‍🍳</div>
                <div className="role-option__label">Chef</div>
                <div className="role-option__desc">Share your recipes</div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange}
              placeholder="Gordon Ramsay" required />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="you@example.com" required autoComplete="email" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange}
              placeholder="Min. 6 characters" required minLength={6} autoComplete="new-password" />
          </div>

          <button type="submit" className="btn btn-primary btn-full" style={{marginTop:'0.5rem'}} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-card__footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
