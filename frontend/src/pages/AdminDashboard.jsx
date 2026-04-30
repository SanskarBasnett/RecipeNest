import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API, { getImageUrl } from '../api/axios';
import ProfileForm from '../components/ProfileForm';

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

  const searchParams = new URLSearchParams(location.search);
  const activeTab    = searchParams.get('tab') || 'overview';

  const setActiveTab = (tab) => {
    navigate(`?tab=${tab}`, { replace: true });
    setSearch('');
    setDeleteError('');
  };

  const fetchAll = () => {
    setLoading(true);
    Promise.all([API.get('/admin/stats'), API.get('/admin/users'), API.get('/admin/recipes')])
      .then(([s, u, r]) => { setStats(s.data); setUsers(u.data); setRecipes(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const refreshUsers   = () => Promise.all([API.get('/admin/users'), API.get('/admin/stats')]).then(([u, s]) => { setUsers(u.data); setStats(s.data); }).catch(() => {});
  const refreshRecipes = () => Promise.all([API.get('/admin/recipes'), API.get('/admin/stats')]).then(([r, s]) => { setRecipes(r.data); setStats(s.data); }).catch(() => {});
  const refreshStats   = () => API.get('/admin/stats').then(({ data }) => setStats(data)).catch(() => {});

  useEffect(() => { fetchAll(); }, []);

  const handleDeleteUser = async (id) => {
    setDeletingId(id); setDeleteError('');
    try {
      await API.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
      refreshStats();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Delete failed. Try again.');
    } finally { setDeletingId(null); }
  };

  const handleDeleteRecipe = async (id) => {
    setDeletingId(id); setDeleteError('');
    try {
      await API.delete(`/admin/recipes/${id}`);
      setRecipes(prev => prev.filter(r => r._id !== id));
      refreshStats();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Delete failed. Try again.');
    } finally { setDeletingId(null); }
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
    <div className="page">
      <div className="container">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden flex-shrink-0"
              style={{ background: 'var(--primary)' }}
            >
              {user.avatar
                ? <img src={getImageUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
                : user.name.charAt(0).toUpperCase()
              }
            </div>
            <div>
              <h1 className="text-[1.6rem] font-bold mb-0.5" style={{ color: 'var(--text)' }}>{user.name}</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Logged in as <strong style={{ color: 'var(--text)' }}>{user.name}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-7 flex-wrap" style={{ borderColor: 'var(--border)' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              className={`bg-transparent border-0 border-b-2 -mb-[1.5px] px-5 py-2.5 text-sm font-medium cursor-pointer whitespace-nowrap transition-colors duration-150 font-[inherit] ${
                activeTab === t.key ? 'font-semibold' : 'hover:text-[var(--text)]'
              }`}
              style={{
                color: activeTab === t.key ? 'var(--primary)' : 'var(--text-muted)',
                borderBottomColor: activeTab === t.key ? 'var(--primary)' : 'transparent',
              }}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="card p-7 max-w-[520px]">
            <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--text)' }}>Platform Summary</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-xs uppercase tracking-wider px-3 py-2 border-b" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>Metric</th>
                  <th className="text-left text-xs uppercase tracking-wider px-3 py-2 border-b" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>Count</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Chefs',       value: stats.totalChefs },
                  { label: 'Food Lovers', value: stats.totalUsers },
                  { label: 'Recipes',     value: stats.totalRecipes },
                  { label: 'Total Users', value: totalAllUsers },
                ].map(({ label, value }) => (
                  <tr key={label} className="hover:bg-black/[0.02]">
                    <td className="px-3 py-3.5 text-sm border-b" style={{ color: 'var(--text)', borderColor: 'var(--border)' }}>{label}</td>
                    <td className="px-3 py-3.5 text-sm font-bold border-b" style={{ color: 'var(--primary)', borderColor: 'var(--border)' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Chefs */}
        {activeTab === 'chefs' && (
          <div className="w-full">
            <SearchBar value={search} onChange={setSearch} onClear={() => setSearch('')} onRefresh={refreshUsers} placeholder="Search chefs..." />
            {deleteError && <InlineErr msg={deleteError} />}
            {filterList(chefs).length === 0
              ? <p className="text-sm text-center py-10" style={{ color: 'var(--text-muted)' }}>No results found</p>
              : <div className="flex flex-col gap-2">
                  {filterList(chefs).map(u => (
                    <UserRow key={u._id} u={u} deletingId={deletingId} onDelete={handleDeleteUser} from="/admin?tab=chefs" />
                  ))}
                </div>
            }
          </div>
        )}

        {/* Food Lovers */}
        {activeTab === 'foodlovers' && (
          <div className="w-full">
            <SearchBar value={search} onChange={setSearch} onClear={() => setSearch('')} onRefresh={refreshUsers} placeholder="Search food lovers..." />
            {deleteError && <InlineErr msg={deleteError} />}
            {filterList(foodLovers).length === 0
              ? <p className="text-sm text-center py-10" style={{ color: 'var(--text-muted)' }}>No results found</p>
              : <div className="flex flex-col gap-2">
                  {filterList(foodLovers).map(u => (
                    <UserRow key={u._id} u={u} deletingId={deletingId} onDelete={handleDeleteUser} from="/admin?tab=foodlovers" />
                  ))}
                </div>
            }
          </div>
        )}

        {/* Recipes */}
        {activeTab === 'recipes' && (
          <div className="w-full">
            <SearchBar value={search} onChange={setSearch} onClear={() => setSearch('')} onRefresh={refreshRecipes} placeholder="Search recipes or chef name..." />
            {deleteError && <InlineErr msg={deleteError} />}
            {filteredRecipes.length === 0
              ? <p className="text-sm text-center py-10" style={{ color: 'var(--text-muted)' }}>No results found</p>
              : <div className="flex flex-col gap-2">
                  {filteredRecipes.map(r => (
                    <div
                      key={r._id}
                      className="flex items-center gap-0 px-4 py-3.5 rounded-xl flex-wrap transition-shadow duration-150 hover:shadow-md"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                    >
                      <Link
                        to={`/recipes/${r._id}`}
                        state={{ from: '/admin?tab=recipes' }}
                        className="flex items-center gap-4 flex-1 min-w-0 pr-4 no-underline"
                        style={{ color: 'inherit' }}
                      >
                        <div className="w-[52px] h-[52px] rounded-lg overflow-hidden flex-shrink-0">
                          {r.image
                            ? <img src={getImageUrl(r.image)} alt={r.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-xl" style={{ background: '#f5f0eb' }} />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <strong className="block text-sm mb-0.5 truncate" style={{ color: 'var(--text)' }}>{r.title}</strong>
                          <small className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            by {r.chef?.name || 'Unknown'} &nbsp;·&nbsp;
                            <RoleBadge role={r.difficulty?.toLowerCase()} label={r.difficulty} />
                            &nbsp;·&nbsp; {r.category}
                          </small>
                        </div>
                      </Link>
                      <DeleteBtn onClick={() => handleDeleteRecipe(r._id)} loading={deletingId === r._id} />
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
  <div className="flex items-center gap-2 mb-5">
    <div className="relative flex-1 max-w-[400px]">
      <input
        className="w-full px-9 py-2.5 rounded-xl text-sm font-[inherit] transition-all duration-200 focus:outline-none"
        style={{
          border: '1.5px solid var(--border)',
          background: 'var(--bg-input)',
          color: 'var(--text)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(242,140,0,0.12)'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        maxLength={50}
        aria-label={placeholder}
      />
      {value && (
        <button
          className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-0 text-sm cursor-pointer transition-colors duration-150 hover:text-[var(--primary)]"
          style={{ color: 'var(--text-muted)' }}
          onClick={onClear}
          aria-label="Clear search"
          type="button"
        >
          ✕
        </button>
      )}
    </div>
    <button
      className="flex items-center justify-center w-9 h-9 rounded-xl text-base cursor-pointer transition-all duration-150"
      style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', color: 'var(--text-muted)' }}
      onMouseEnter={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.color = 'var(--primary)'; }}
      onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-muted)'; }}
      onClick={onRefresh}
      aria-label="Refresh data"
      type="button"
      title="Refresh"
    >
      ⟳
    </button>
  </div>
);

/* ── User row ── */
const UserRow = ({ u, deletingId, onDelete, from }) => (
  <div
    className="flex items-center gap-4 px-4 py-3.5 rounded-xl flex-wrap transition-shadow duration-150 hover:shadow-md"
    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    role="row"
  >
    <div
      className="w-[38px] h-[38px] rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-base flex-shrink-0"
      style={{ background: 'var(--primary)' }}
    >
      {u.avatar
        ? <img src={getImageUrl(u.avatar)} alt={u.name} className="w-full h-full object-cover" />
        : <span>{u.name.charAt(0)}</span>
      }
    </div>
    <div className="flex-1 min-w-0">
      {u.role === 'chef'
        ? <Link to={`/chefs/${u._id}`} state={{ from }} className="block text-sm font-semibold hover:text-[var(--primary)] hover:underline transition-colors" style={{ color: 'var(--text)' }}>{u.name}</Link>
        : <Link to={`/admin/users/${u._id}`} state={{ from }} className="block text-sm font-semibold hover:text-[var(--primary)] hover:underline transition-colors" style={{ color: 'var(--text)' }}>{u.name}</Link>
      }
      <small className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</small>
    </div>
    <RoleBadge role={u.role} label={u.role} />
    <DeleteBtn onClick={() => onDelete(u._id)} loading={deletingId === u._id} />
  </div>
);

/* ── Role badge ── */
const RoleBadge = ({ role, label }) => {
  const styles = {
    user:   { background: '#f5f5f5', color: '#616161' },
    chef:   { background: '#fff3e0', color: '#e65100' },
    admin:  { background: '#fce4ec', color: '#c2185b' },
    easy:   { background: '#e8f5e9', color: '#2e7d32' },
    medium: { background: '#fff8e1', color: '#f57f17' },
    hard:   { background: '#fce4ec', color: '#c2185b' },
  };
  const s = styles[role] || styles.user;
  return (
    <span
      className="text-[0.7rem] font-bold px-2.5 py-0.5 rounded capitalize"
      style={s}
    >
      {label}
    </span>
  );
};

/* ── Delete button ── */
const DeleteBtn = ({ onClick, loading }) => (
  <button
    className="bg-transparent rounded-lg px-3.5 py-1.5 text-xs cursor-pointer transition-all duration-150 font-[inherit] disabled:opacity-45 disabled:cursor-not-allowed"
    style={{ border: '1.5px solid var(--border)', color: 'var(--text-muted)' }}
    onMouseEnter={e => { if (!e.target.disabled) { e.target.style.borderColor = '#ef5350'; e.target.style.color = '#ef5350'; e.target.style.background = '#ffebee'; } }}
    onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-muted)'; e.target.style.background = 'transparent'; }}
    onClick={onClick}
    disabled={loading}
  >
    {loading ? 'Deleting...' : 'Delete'}
  </button>
);

/* ── Inline error ── */
const InlineErr = ({ msg }) => (
  <p
    className="text-xs px-3.5 py-2 rounded-lg mb-4"
    style={{ color: '#c62828', background: '#ffebee', border: '1px solid #ef9a9a' }}
  >
    {msg}
  </p>
);

export default AdminDashboard;
