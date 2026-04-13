import React, { useEffect, useState } from 'react';
import API, { getImageUrl } from '../api/axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats]     = useState(null);
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch]   = useState('');

  useEffect(() => {
    Promise.all([API.get('/admin/stats'), API.get('/admin/users')])
      .then(([s, u]) => { setStats(s.data); setUsers(u.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user and all their recipes?')) return;
    try {
      await API.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  const handleRoleChange = async (id, role) => {
    try {
      const { data } = await API.put(`/admin/users/${id}/role`, { role });
      setUsers((prev) => prev.map((u) => (u._id === id ? data : u)));
    } catch (err) { alert(err.response?.data?.message || 'Role update failed'); }
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  return (
    <div className="admin page">
      <div className="container">

        <div className="admin__header">
          <div>
            <p className="section-subtitle">Platform management</p>
            <h1 className="section-title">Admin Dashboard</h1>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="admin__stats">
            {[
              { icon: '👥', label: 'Food Lovers', value: stats.totalUsers,   color: '#3b82f6' },
              { icon: '👨‍🍳', label: 'Chefs',       value: stats.totalChefs,   color: 'var(--primary)' },
              { icon: '📖', label: 'Recipes',     value: stats.totalRecipes, color: 'var(--success)' },
              { icon: '👤', label: 'Total Users',  value: stats.totalUsers + stats.totalChefs, color: 'var(--accent)' },
            ].map((s) => (
              <div key={s.label} className="admin__stat card">
                <div className="admin__stat-icon" style={{ background: s.color + '18', color: s.color }}>{s.icon}</div>
                <div>
                  <strong>{s.value}</strong>
                  <small>{s.label}</small>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="admin__tabs">
          {['overview', 'users'].map((t) => (
            <button key={t} className={`dash__tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
              {t === 'overview' ? '📊 Overview' : `👥 Users (${users.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="admin__overview card">
            <h3>Platform Summary</h3>
            <p>Use the Users tab to manage accounts, assign roles, or remove users.</p>
            <div className="admin__overview-grid">
              <div><span>Chefs</span><strong>{stats?.totalChefs}</strong></div>
              <div><span>Food Lovers</span><strong>{stats?.totalUsers}</strong></div>
              <div><span>Recipes</span><strong>{stats?.totalRecipes}</strong></div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <>
            <input
              type="text"
              className="admin__search"
              placeholder="🔍  Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="admin__user-list">
              {filtered.map((u) => (
                <div key={u._id} className="admin__user-row card">
                  <div className="admin__user-avatar">
                    {u.avatar
                      ? <img src={getImageUrl(u.avatar)} alt={u.name} />
                      : <div className="admin__user-initials">{u.name.charAt(0)}</div>
                    }
                  </div>
                  <div className="admin__user-info">
                    <h4>{u.name}</h4>
                    <p>{u.email}</p>
                  </div>
                  <div className="admin__user-role">
                    <select value={u.role} onChange={(e) => handleRoleChange(u._id, e.target.value)}>
                      <option value="user">User</option>
                      <option value="chef">Chef</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <span className={`badge ${u.role === 'chef' ? 'badge-primary' : u.role === 'admin' ? 'badge-success' : 'badge-accent'}`}>
                    {u.role}
                  </span>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u._id)}>🗑️ Delete</button>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
