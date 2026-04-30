import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API, { getImageUrl } from '../api/axios';
import RecipeForm from '../components/RecipeForm';
import ProfileForm from '../components/ProfileForm';

const diffBadge = (d) => ({
  Easy:   { bg: '#e8f5e9', color: '#2e7d32' },
  Medium: { bg: '#fff8e1', color: '#f57f17' },
  Hard:   { bg: '#fce4ec', color: '#c2185b' },
}[d] || { bg: '#f5f5f5', color: '#616161' });

const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // My recipes
  const [recipes, setRecipes]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [editingRecipe, setEditingRecipe] = useState(null); // null = not editing
  const [deletingId, setDeletingId]       = useState(null);
  const [deleteError, setDeleteError]     = useState('');
  const [search, setSearch]               = useState('');

  // Explore tab
  const [allRecipes, setAllRecipes]       = useState([]);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [exploreSearch, setExploreSearch] = useState('');

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [unreadCount,   setUnreadCount]   = useState(0);

  // Tab lives in URL
  const urlParams = new URLSearchParams(location.search);
  const activeTab = urlParams.get('tab') || 'recipes';
  const setActiveTab = (tab) => {
    navigate(`?tab=${tab}`, { replace: true });
    setSearch('');
    setExploreSearch('');
    setDeleteError('');
  };

  // ── Fetch my recipes ──────────────────────────────────
  const fetchRecipes = () => {
    setLoading(true);
    API.get('/recipes/chef/my')
      .then(({ data }) => setRecipes(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // ── Fetch all recipes for Explore tab ─────────────────
  const fetchAllRecipes = () => {
    setExploreLoading(true);
    API.get('/recipes?sort=newest')
      .then(({ data }) => {
        // Exclude this chef's own recipes
        setAllRecipes(data.filter(r => r.chef?._id !== user._id));
      })
      .catch(() => {})
      .finally(() => setExploreLoading(false));
  };

  // ── Notifications ─────────────────────────────────────
  const fetchUnreadCount = () => {
    API.get('/notifications/unread-count')
      .then(({ data }) => setUnreadCount(data.count))
      .catch(() => {});
  };

  const fetchNotifications = () => {
    setNotifsLoading(true);
    API.get('/notifications')
      .then(({ data }) => setNotifications(data))
      .catch(() => {})
      .finally(() => setNotifsLoading(false));
  };

  useEffect(() => {
    fetchRecipes();
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchNotifications();
      if (unreadCount > 0) {
        API.put('/notifications/read-all').then(() => setUnreadCount(0)).catch(() => {});
      }
    }
    if (activeTab === 'explore') {
      fetchAllRecipes();
    }
  }, [activeTab]);

  const openNotifications = () => {
    setActiveTab('notifications');
    fetchNotifications();
    if (unreadCount > 0) {
      API.put('/notifications/read-all').then(() => setUnreadCount(0)).catch(() => {});
    }
  };

  const handleDeleteNotif = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (_) {}
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    setDeleteError('');
    try {
      await API.delete(`/recipes/${id}`);
      setRecipes(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Delete failed. Try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Edit opens inline — stays on recipes tab
  const openEdit    = (r) => { setEditingRecipe(r); };
  const cancelEdit  = ()  => { setEditingRecipe(null); };
  const onSuccess   = ()  => { setEditingRecipe(null); fetchRecipes(); };

  const filtered = useMemo(() =>
    recipes.filter(r =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.category?.toLowerCase().includes(search.toLowerCase())
    ), [recipes, search]);

  const filteredExplore = useMemo(() =>
    allRecipes.filter(r =>
      r.title.toLowerCase().includes(exploreSearch.toLowerCase()) ||
      r.category?.toLowerCase().includes(exploreSearch.toLowerCase()) ||
      r.chef?.name?.toLowerCase().includes(exploreSearch.toLowerCase())
    ), [allRecipes, exploreSearch]);

  // ── Tab button helper ─────────────────────────────────
  const tabBtn = (key, label, count, countRed) => (
    <button
      key={key}
      className={`flex items-center gap-1.5 bg-transparent border-0 border-b-2 -mb-[1.5px] px-5 py-2.5 text-sm font-medium cursor-pointer transition-colors duration-150 font-[inherit] ${
        activeTab === key ? 'font-semibold' : 'hover:text-[var(--text)]'
      }`}
      style={{
        color: activeTab === key ? 'var(--primary)' : 'var(--text-muted)',
        borderBottomColor: activeTab === key ? 'var(--primary)' : 'transparent',
      }}
      onClick={() => {
        if (key === 'notifications') openNotifications();
        else { setEditingRecipe(null); setActiveTab(key); }
      }}
    >
      {label}
      {count > 0 && (
        <span
          className="text-[0.68rem] font-bold px-1.5 py-0.5 rounded-full text-white"
          style={{ background: countRed ? '#e53935' : 'var(--primary)' }}
        >
          {count}
        </span>
      )}
    </button>
  );

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
              <p className="text-sm mb-0.5" style={{ color: 'var(--text-muted)' }}>Good to see you back,</p>
              <h1 className="text-[1.6rem] font-bold" style={{ color: 'var(--text)' }}>{user.name}</h1>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b mb-7" style={{ borderColor: 'var(--border)' }}>
          {tabBtn('add',           '+ Add Recipe',   0,              false)}
          {tabBtn('recipes',       'My Recipes',     recipes.length, false)}
          {tabBtn('explore',       'Explore',        0,              false)}
          {tabBtn('notifications', 'Notifications',  unreadCount,    true)}
          {tabBtn('profile',       'Edit Profile',   0,              false)}
        </div>

        {/* ── Add Recipe ── */}
        {activeTab === 'add' && (
          <RecipeForm
            recipe={null}
            onSuccess={() => { setActiveTab('recipes'); fetchRecipes(); }}
            onCancel={() => setActiveTab('recipes')}
            hideCancel
          />
        )}

        {/* ── My Recipes ── */}
        {activeTab === 'recipes' && (
          <>
            {/* Inline edit form with back button */}
            {editingRecipe ? (
              <div>
                <button className="back-btn mb-4" onClick={cancelEdit}>← Back to My Recipes</button>
                <RecipeForm
                  recipe={editingRecipe}
                  onSuccess={onSuccess}
                  onCancel={cancelEdit}
                  hideCancel
                />
              </div>
            ) : (
              <>
                {deleteError && (
                  <p className="text-xs px-3.5 py-2 rounded-lg mb-4"
                    style={{ color: '#c62828', background: '#ffebee', border: '1px solid #ef9a9a' }}>
                    {deleteError}
                  </p>
                )}

                {/* Search bar */}
                <div className="relative max-w-[380px] mb-5">
                  <input
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-[inherit] transition-all duration-200 focus:outline-none"
                    style={{ border: '1.5px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text)' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(242,140,0,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                    type="text"
                    placeholder="Search my recipes..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  {search && (
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 text-sm cursor-pointer"
                      style={{ color: 'var(--text-muted)' }} onClick={() => setSearch('')}>✕</button>
                  )}
                </div>

                {loading ? (
                  <div className="spinner-wrap"><div className="spinner" /></div>
                ) : filtered.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🍽</div>
                    <h3>{search ? 'No results found' : 'No recipes yet'}</h3>
                    <p>{search ? 'Try a different search term' : 'Click + Add Recipe to get started!'}</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {filtered.map(r => {
                      const diff = diffBadge(r.difficulty);
                      return (
                        <div
                          key={r._id}
                          className="flex items-center gap-4 px-5 py-3.5 rounded-xl flex-wrap transition-shadow duration-200 hover:shadow-md"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                        >
                          <div className="w-[60px] h-[60px] rounded-lg overflow-hidden flex-shrink-0">
                            {r.image
                              ? <img src={getImageUrl(r.image)} alt={r.title} className="w-full h-full object-cover" />
                              : <div className="w-full h-full" style={{ background: '#f5f0eb' }} />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[0.95rem] font-semibold mb-1.5 truncate" style={{ color: 'var(--text)' }}>{r.title}</h3>
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="text-[0.72rem] font-semibold px-2 py-0.5 rounded"
                                style={{ background: diff.bg, color: diff.color }}>{r.difficulty}</span>
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.category}</span>
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.cookingTime} min</span>
                              {r.likes?.length > 0    && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Likes: {r.likes.length}</span>}
                              {r.comments?.length > 0 && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Comments: {r.comments.length}</span>}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              className="rounded-lg px-3.5 py-1.5 text-xs cursor-pointer transition-all duration-150 border"
                              style={{ background: '#e3f2fd', borderColor: '#bbdefb', color: '#1565c0' }}
                              onMouseEnter={e => (e.target.style.background = '#bbdefb')}
                              onMouseLeave={e => (e.target.style.background = '#e3f2fd')}
                              onClick={() => openEdit(r)}
                            >
                              Edit
                            </button>
                            <button
                              className="rounded-lg px-3.5 py-1.5 text-xs cursor-pointer transition-all duration-150 border disabled:opacity-45 disabled:cursor-not-allowed"
                              style={{ background: 'none', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                              onMouseEnter={e => { if (!e.target.disabled) { e.target.style.borderColor = '#ef5350'; e.target.style.color = '#ef5350'; e.target.style.background = '#ffebee'; } }}
                              onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-muted)'; e.target.style.background = 'none'; }}
                              onClick={() => handleDelete(r._id)}
                              disabled={deletingId === r._id}
                            >
                              {deletingId === r._id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Explore (other chefs' recipes) ── */}
        {activeTab === 'explore' && (
          <>
            <div className="flex items-center gap-2 mb-5">
              <div className="relative flex-1 max-w-[380px]">
                <input
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-[inherit] transition-all duration-200 focus:outline-none"
                  style={{ border: '1.5px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text)' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(242,140,0,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                  type="text"
                  placeholder="Search by title, category or chef..."
                  value={exploreSearch}
                  onChange={e => setExploreSearch(e.target.value)}
                />
                {exploreSearch && (
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 text-sm cursor-pointer"
                    style={{ color: 'var(--text-muted)' }} onClick={() => setExploreSearch('')}>✕</button>
                )}
              </div>
              <button
                className="flex items-center justify-center w-9 h-9 rounded-xl text-base cursor-pointer transition-all duration-150"
                style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', color: 'var(--text-muted)' }}
                onMouseEnter={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.color = 'var(--primary)'; }}
                onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-muted)'; }}
                onClick={fetchAllRecipes}
                title="Refresh"
              >
                ⟳
              </button>
            </div>

            {!exploreLoading && (
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                {filteredExplore.length} recipe{filteredExplore.length !== 1 ? 's' : ''} from other chefs
              </p>
            )}

            {exploreLoading ? (
              <div className="spinner-wrap"><div className="spinner" /></div>
            ) : filteredExplore.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🍽</div>
                <h3>{exploreSearch ? 'No results found' : 'No recipes yet'}</h3>
                <p>{exploreSearch ? 'Try a different search term' : 'Other chefs haven\'t published any recipes yet.'}</p>
              </div>
            ) : (
              <div className="grid-3">
                {filteredExplore.map(r => {
                  const diff = diffBadge(r.difficulty);
                  return (
                    <Link
                      key={r._id}
                      to={`/recipes/${r._id}`}
                      state={{ from: '/dashboard?tab=explore' }}
                      className="overflow-hidden flex flex-col rounded-2xl transition-all duration-300"
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(242,140,0,0.15)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                    >
                      {/* Image */}
                      <div className="relative h-[200px] overflow-hidden flex-shrink-0">
                        {r.image
                          ? <img src={getImageUrl(r.image)} alt={r.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #fdebd0, #f8d7b0)' }} />
                        }
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)' }} />
                        <span className="absolute top-3 left-3 badge text-[0.72rem] font-semibold px-2 py-0.5 rounded"
                          style={{ background: diff.bg, color: diff.color }}>{r.difficulty}</span>
                        <span className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(0,0,0,0.45)', color: '#fff' }}>
                          ⏱ {r.cookingTime} min
                        </span>
                        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
                          <h3 className="text-white font-semibold text-base leading-snug">{r.title}</h3>
                        </div>
                      </div>
                      {/* Body */}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="badge badge-accent text-xs">{r.category}</span>
                          {r.likes?.length > 0 && (
                            <span className="text-xs ml-auto flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                              <span style={{ color: '#e53935' }}>❤</span> {r.likes.length}
                            </span>
                          )}
                        </div>
                        {r.chef && (
                          <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                            <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-white text-[0.6rem] font-bold flex-shrink-0"
                              style={{ background: 'var(--primary)' }}>
                              {r.chef.avatar
                                ? <img src={getImageUrl(r.chef.avatar)} alt={r.chef.name} className="w-full h-full object-cover" />
                                : r.chef.name.charAt(0)
                              }
                            </div>
                            {r.chef.name}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Notifications ── */}
        {activeTab === 'notifications' && (
          <div className="pt-2">
            {notifsLoading ? (
              <div className="spinner-wrap"><div className="spinner" /></div>
            ) : notifications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔔</div>
                <h3>No notifications yet</h3>
                <p>You'll be notified when someone likes or comments on your recipes.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {notifications.map(n => (
                  <div
                    key={n._id}
                    className="flex items-start gap-3.5 px-4 py-3.5 rounded-xl relative transition-shadow duration-150 hover:shadow-md"
                    style={{
                      background: n.read ? 'var(--bg-card)' : 'rgba(242,140,0,0.04)',
                      border: `1px solid ${n.read ? 'var(--border)' : 'var(--primary)'}`,
                      borderLeft: n.read ? undefined : '3px solid var(--primary)',
                    }}
                  >
                    <div className="w-[38px] h-[38px] rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ background: 'var(--primary)' }}>
                      {n.sender?.avatar
                        ? <img src={getImageUrl(n.sender.avatar)} alt={n.sender.name} className="w-full h-full object-cover" />
                        : <span>{n.sender?.name?.charAt(0).toUpperCase() || '?'}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed mb-0.5" style={{ color: 'var(--text)' }}>
                        <strong>{n.sender?.name}</strong>
                        {n.type === 'like' ? ' liked your recipe ' : ' commented on your recipe '}
                        <Link to={`/recipes/${n.recipe}`} className="font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
                          {n.recipeTitle}
                        </Link>
                      </p>
                      {n.type === 'comment' && n.commentText && (
                        <p className="text-xs italic truncate mb-0.5" style={{ color: 'var(--text-muted)' }}>"{n.commentText}"</p>
                      )}
                      <time className="block text-xs mt-1" style={{ color: 'var(--text-light)' }}>
                        {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                    <span className="text-[0.7rem] font-bold uppercase tracking-wide px-2 py-1 rounded-full flex-shrink-0 self-center"
                      style={{
                        background: n.type === 'like' ? 'rgba(242,140,0,0.12)' : 'rgba(42,157,143,0.12)',
                        color:      n.type === 'like' ? 'var(--primary)' : 'var(--success)',
                      }}>
                      {n.type}
                    </span>
                    <button
                      className="bg-transparent border-0 text-xs cursor-pointer px-1.5 py-1 rounded transition-all duration-150 flex-shrink-0 self-start hover:text-red-500 hover:bg-red-50"
                      style={{ color: 'var(--text-light)' }}
                      onClick={() => handleDeleteNotif(n._id)}
                      aria-label="Dismiss"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Edit Profile ── */}
        {activeTab === 'profile' && <ProfileForm />}

      </div>
    </div>
  );
};

export default Dashboard;
