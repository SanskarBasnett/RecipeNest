import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API, { getImageUrl } from '../api/axios';
import ProfileForm from '../components/ProfileForm';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user }                      = useAuth();
  const location                      = useLocation();
  const navigate                      = useNavigate();
  const [stats, setStats]             = useState({ totalUsers: 0, totalChefs: 0, totalRecipes: 0 });
  const [users, setUsers]             = useState([]);
  const [recipes, setRecipes]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [deletingId, setDeletingId]   = useState(null);
  const [deleteError, setDeleteError] = useState('');

  // Active tab lives in the URL: /admin?tab=overview|chefs|foodlovers|recipes|profile
  const searchParams = new URLSearchParams(location.search);
  const activeTab    = searchParams.get('tab') || 'overview';

  const setActiveTab = (tab) => {
    navigate(`?tab=${tab}`, { replace: true });
    setSearch('');
    setDeleteError('');
  };

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      API.get('/admin/stats'),
      API.get('/admin/users'),
      API.get('/admin/recipes'),
    ])
      .then(([s, u, r]) => {
        setStats(s.data);
        setUsers(u.data);
        setRecipes(r.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const refreshUsers = () => {
    Promise.all([API.get('/admin/users'), API.get('/admin/stats')])
      .then(([u, s]) => { setUsers(u.data); setStats(s.data); })
      .catch(() => {});
  };

  const refreshRecipes = () => {
    Promise.all([API.get('/admin/recipes'), API.get('/admin/stats')])
      .then(([r, s]) => { setRecipes(r.data); setStats(s.data); })
      .catch(() => {});
  };

  const refreshStats = () =>
    API.get('/admin/stats').then(({ data }) => setStats(data)).catch(() => {});

  useEffect(() => { fetchAll(); }, []);

  const handleDeleteUser = async (id) => {
    setDeletingId(id);
    setDeleteError('');
    try {
      await API.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
      refreshStats();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Delete failed. Try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteRecipe = async (id) => {
    setDeletingId(id);
    setDeleteError('');
    try {
      await API.delete(`/admin/recipes/${id}`);
      setRecipes(prev => prev.filter(r => r._id !== id));
      refreshStats();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Delete failed. Try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const chefs      = useMemo(() => users.filter(u => u.role === 'chef'), [users]);
  const foodLovers = useMemo(() => users.filter(u => u.role === 'user'), [users]);

  const filterList = (list) =>
    list.filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );

  const filteredRecipes = useMemo(() =>
    recipes.filter(r =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.chef?.name?.toLowerCase().includes(search.toLowerCase())
    ), [recipes, search]);

  const totalAllUsers = stats.totalUsers + stats.totalChefs;

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  const tabs = [
    { key: 'overview',   label: 'Overview' },
    { key: 'chefs',      label: 'Chefs' },
    { key: 'foodlovers', label: 'Food Lovers' },
    { key: 'recipes',    label: 'Recipes' },
    { key: 'profile',    label: 'Edit Profile' },
  ];

  return (
    <div className="adm page">
      <div className="container">

        {/* Header */}
        <div className="adm-head">
          <div className="adm-head__left">
            <div className="adm-head__avatar" aria-hidden="true">
              {user.avatar
                ? <img src={getImageUrl(user.avatar)} alt={user.name} />
                : user.name.charAt(0).toUpperCase()
              }
            </div>
            <div>
              <h1 className="adm-head__name">{user.name}</h1>
              <p className="adm-head__sub">Logged in as <strong>{user.name}</strong></p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="adm-tabs">
          {tabs.map(t => (
            <button
              key={t.key}
              className={activeTab === t.key ? 'active' : ''}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="adm-overview card">
            <h2>Platform Summary</h2>
            <table className="adm-table">
              <thead><tr><th>Metric</th><th>Count</th></tr></thead>
              <tbody>
                <tr><td>Chefs</td><td>{stats.totalChefs}</td></tr>
                <tr><td>Food Lovers</td><td>{stats.totalUsers}</td></tr>
                <tr><td>Recipes</td><td>{stats.totalRecipes}</td></tr>
                <tr><td>Total Users</td><td>{totalAllUsers}</td></tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Chefs */}
        {activeTab === 'chefs' && (
          <div className="adm-section">
            <SearchBar
              value={search}
              onChange={setSearch}
              onClear={() => setSearch('')}
              onRefresh={refreshUsers}
              placeholder="Search chefs..."
            />
            {deleteError && <p className="adm-inline-err">{deleteError}</p>}
            {filterList(chefs).length === 0
              ? <p className="adm-empty">No results found</p>
              : <div className="adm-user-list">
                  {filterList(chefs).map(u => (
                    <UserRow
                      key={u._id} u={u}
                      deletingId={deletingId}
                      onDelete={handleDeleteUser}
                      from="/admin?tab=chefs"
                    />
                  ))}
                </div>
            }
          </div>
        )}

        {/* Food Lovers */}
        {activeTab === 'foodlovers' && (
          <div className="adm-section">
            <SearchBar
              value={search}
              onChange={setSearch}
              onClear={() => setSearch('')}
              onRefresh={refreshUsers}
              placeholder="Search food lovers..."
            />
            {deleteError && <p className="adm-inline-err">{deleteError}</p>}
            {filterList(foodLovers).length === 0
              ? <p className="adm-empty">No results found</p>
              : <div className="adm-user-list">
                  {filterList(foodLovers).map(u => (
                    <UserRow
                      key={u._id} u={u}
                      deletingId={deletingId}
                      onDelete={handleDeleteUser}
                      from="/admin?tab=foodlovers"
                    />
                  ))}
                </div>
            }
          </div>
        )}

        {/* Recipes */}
        {activeTab === 'recipes' && (
          <div className="adm-section">
            <SearchBar
              value={search}
              onChange={setSearch}
              onClear={() => setSearch('')}
              onRefresh={refreshRecipes}
              placeholder="Search recipes or chef name..."
            />
            {deleteError && <p className="adm-inline-err">{deleteError}</p>}
            {filteredRecipes.length === 0
              ? <p className="adm-empty">No results found</p>
              : <div className="adm-recipe-list">
                  {filteredRecipes.map(r => (
                    <div key={r._id} className="adm-recipe card">
                      <Link
                        to={`/recipes/${r._id}`}
                        state={{ from: '/admin?tab=recipes' }}
                        className="adm-recipe__link"
                        title="View recipe"
                      >
                        <div className="adm-recipe__img">
                          {r.image
                            ? <img src={getImageUrl(r.image)} alt={r.title} />
                            : <div className="adm-recipe__placeholder">🍽️</div>
                          }
                        </div>
                        <div className="adm-recipe__info">
                          <strong>{r.title}</strong>
                          <small>
                            by {r.chef?.name || 'Unknown'} &nbsp;·&nbsp;
                            <span className={`adm-role-badge adm-role-badge--${r.difficulty?.toLowerCase()}`}>
                              {r.difficulty}
                            </span>
                            &nbsp;·&nbsp; {r.category}
                          </small>
                        </div>
                      </Link>
                      <button
                        className="adm-delete"
                        onClick={() => handleDeleteRecipe(r._id)}
                        disabled={deletingId === r._id}
                        aria-label={`Delete recipe ${r.title}`}
                      >
                        {deletingId === r._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {/* Edit Profile */}
        {activeTab === 'profile' && (
          <ProfileForm showSpecialty={false} showSocialLinks={false} showBio={false} showLocation={false} />
        )}

      </div>
    </div>
  );
};

/* ── Search bar ── */
const SearchBar = ({ value, onChange, onClear, onRefresh, placeholder }) => (
  <div className="adm-searchbar">
    <div className="adm-searchbar__input-wrap">
      <input
        className="adm-search"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        maxLength={50}
        aria-label={placeholder}
      />
      {value && (
        <button className="adm-searchbar__clear" onClick={onClear} aria-label="Clear search" type="button">✕</button>
      )}
    </div>
    <button className="adm-searchbar__refresh" onClick={onRefresh} aria-label="Refresh data" type="button" title="Refresh">⟳</button>
  </div>
);

/* ── User row ── */
const UserRow = ({ u, deletingId, onDelete, from }) => (
  <div className="adm-user card" role="row">
    <div className="adm-user__avatar" aria-hidden="true">
      {u.avatar
        ? <img src={getImageUrl(u.avatar)} alt={u.name} />
        : <span>{u.name.charAt(0)}</span>
      }
    </div>
    <div className="adm-user__info">
      {u.role === 'chef'
        ? <Link to={`/chefs/${u._id}`} state={{ from }} className="adm-user__name-link"><strong>{u.name}</strong></Link>
        : <Link to={`/admin/users/${u._id}`} state={{ from }} className="adm-user__name-link"><strong>{u.name}</strong></Link>
      }
      <small>{u.email}</small>
    </div>
    <span className={`adm-role-badge adm-role-badge--${u.role}`}>{u.role}</span>
    <button
      className="adm-delete"
      onClick={() => onDelete(u._id)}
      disabled={deletingId === u._id}
      aria-label={`Delete ${u.name}`}
    >
      {deletingId === u._id ? 'Deleting...' : 'Delete'}
    </button>
  </div>
);

export default AdminDashboard;
