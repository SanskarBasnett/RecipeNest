import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

        <h2 className="text-[1.7rem] text-center mb-1">Join RecipeNest</h2>
        <p className="text-center text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          Create your free account today
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Role selector */}
          <div className="form-group">
            <label>I want to join as...</label>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { role: 'user', icon: '🍽', label: 'Food Lover', desc: 'Browse & discover recipes' },
                { role: 'chef', icon: '👨‍🍳', label: 'Chef',       desc: 'Share your recipes' },
              ].map(({ role, icon, label, desc }) => (
                <div
                  key={role}
                  className="rounded-xl p-4 text-center cursor-pointer transition-all duration-200"
                  style={{
                    border: `2px solid ${form.role === role ? 'var(--primary)' : 'var(--border)'}`,
                    background: form.role === role ? 'rgba(242,140,0,0.08)' : 'var(--bg-input)',
                  }}
                  onClick={() => selectRole(role)}
                >
                  <div
                    className="inline-block text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded mb-1.5"
                    style={{ color: 'var(--primary)', background: 'rgba(242,140,0,0.1)' }}
                  >
                    {icon}
                  </div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</div>
                </div>
              ))}
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

          <button type="submit" className="btn btn-primary btn-full mt-2" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
