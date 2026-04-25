import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API, { getImageUrl } from '../api/axios';
import RecipeForm from '../components/RecipeForm';
import ProfileForm from '../components/ProfileForm';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [recipes, setRecipes]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [deletingId, setDeletingId]       = useState(null);
  const [deleteError, setDeleteError]     = useState('');
  const [search, setSearch]               = useState('');

  // Tab lives in URL
  const urlParams = new URLSearchParams(location.search);
  const activeTab = urlParams.get('tab') || 'recipes';
  const setActiveTab = (tab) => navigate(`?tab=${tab}`, { replace: true });

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [unreadCount,   setUnreadCount]   = useState(0);

  const fetchRecipes = () => {
    setLoading(true);
    API.get('/recipes/chef/my')
      .then(({ data }) => setRecipes(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

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
        API.put('/notifications/read-all')
          .then(() => setUnreadCount(0))
          .catch(() => {});
      }
    }
  }, [activeTab]);

  // When switching to notifications tab, load and mark all read
  const openNotifications = () => {
    setActiveTab('notifications');
    fetchNotifications();
    if (unreadCount > 0) {
      API.put('/notifications/read-all')
        .then(() => setUnreadCount(0))
        .catch(() => {});
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

  const openEdit = (r) => { setEditingRecipe(r); setActiveTab('add'); };
  const onSuccess = () => { setEditingRecipe(null); setActiveTab('recipes'); fetchRecipes(); };
  const onCancel  = () => { setEditingRecipe(null); setActiveTab('recipes'); };

  const filtered = useMemo(() =>
    recipes.filter(r =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.category?.toLowerCase().includes(search.toLowerCase())
    ), [recipes, search]);

  return (
    <div className="dash page">
      <div className="container">

        {/* Header */}
        <div className="dash-head">
          <div className="dash-head__left">
            <div className="dash-head__avatar">
              {user.avatar
                ? <img src={getImageUrl(user.avatar)} alt={user.name} />
                : user.name.charAt(0).toUpperCase()
              }
            </div>
            <div>
              <p className="dash-head__greeting">Good to see you back,</p>
              <h1 className="dash-head__name">{user.name}</h1>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="dash-tabs">
          <button
            className={activeTab === 'add' ? 'active' : ''}
            onClick={() => { setEditingRecipe(null); setActiveTab('add'); }}
          >+ Add Recipe</button>
          <button
            className={activeTab === 'recipes' ? 'active' : ''}
            onClick={() => { setActiveTab('recipes'); setSearch(''); setDeleteError(''); }}
          >
            My Recipes
            {recipes.length > 0 && <span className="dash-tab-count">{recipes.length}</span>}
          </button>
          <button
            className={activeTab === 'notifications' ? 'active' : ''}
            onClick={openNotifications}
          >
            🔔 Notifications
            {unreadCount > 0 && <span className="dash-tab-count dash-tab-count--red">{unreadCount}</span>}
          </button>
          <button
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => { setActiveTab('profile'); setDeleteError(''); }}
          >Edit Profile</button>
        </div>

        {/* Add Recipe */}
        {activeTab === 'add' && (
          <RecipeForm recipe={editingRecipe} onSuccess={onSuccess} onCancel={onCancel} hideCancel />
        )}

        {/* My Recipes */}
        {activeTab === 'recipes' && (
          <>
            {deleteError && <p className="dash-err">{deleteError}</p>}
            {loading ? (
              <div className="spinner-wrap"><div className="spinner" /></div>
            ) : filtered.length === 0 ? (
              <div className="dash-empty">
                <div className="dash-empty__icon">🍽️</div>
                <h3>{search ? 'No results found' : 'No recipes yet'}</h3>
                <p>{search ? 'Try a different search term' : 'Click + Add Recipe to get started!'}</p>
              </div>
            ) : (
              <div className="dash-list">
                {filtered.map(r => (
                  <div key={r._id} className="dash-row">
                    <div className="dash-row__img">
                      {r.image
                        ? <img src={getImageUrl(r.image)} alt={r.title} />
                        : <div className="dash-row__placeholder">🍽️</div>
                      }
                    </div>
                    <div className="dash-row__info">
                      <h3>{r.title}</h3>
                      <div className="dash-row__meta">
                        <span className={`dash-badge dash-badge--${r.difficulty?.toLowerCase()}`}>{r.difficulty}</span>
                        <span className="dash-row__cat">{r.category}</span>
                        <span className="dash-row__time">{r.cookingTime} min</span>
                        {r.likes?.length > 0 && (
                          <span className="dash-row__stat">❤️ {r.likes.length}</span>
                        )}
                        {r.comments?.length > 0 && (
                          <span className="dash-row__stat">💬 {r.comments.length}</span>
                        )}
                      </div>
                    </div>
                    <div className="dash-row__actions">
                      <button className="dash-btn dash-btn--edit" onClick={() => openEdit(r)}>Edit</button>
                      <button
                        className="dash-btn dash-btn--delete"
                        onClick={() => handleDelete(r._id)}
                        disabled={deletingId === r._id}
                      >
                        {deletingId === r._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div className="dash-notifs">
            {notifsLoading ? (
              <div className="spinner-wrap"><div className="spinner" /></div>
            ) : notifications.length === 0 ? (
              <div className="dash-empty">
                <div className="dash-empty__icon">🔔</div>
                <h3>No notifications yet</h3>
                <p>You'll be notified when someone likes or comments on your recipes.</p>
              </div>
            ) : (
              <div className="dash-notif-list">
                {notifications.map(n => (
                  <div key={n._id} className={`dash-notif${n.read ? '' : ' dash-notif--unread'}`}>
                    <div className="dash-notif__avatar">
                      {n.sender?.avatar
                        ? <img src={getImageUrl(n.sender.avatar)} alt={n.sender.name} />
                        : <span>{n.sender?.name?.charAt(0).toUpperCase() || '?'}</span>
                      }
                    </div>
                    <div className="dash-notif__body">
                      <p>
                        <strong>{n.sender?.name}</strong>
                        {n.type === 'like'
                          ? ' liked your recipe '
                          : ' commented on your recipe '
                        }
                        <Link to={`/recipes/${n.recipe}`} className="dash-notif__recipe-link">
                          {n.recipeTitle}
                        </Link>
                      </p>
                      {n.type === 'comment' && n.commentText && (
                        <p className="dash-notif__comment">"{n.commentText}"</p>
                      )}
                      <time>{new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
                    </div>
                    <span className="dash-notif__icon">{n.type === 'like' ? '❤️' : '💬'}</span>
                    <button
                      className="dash-notif__delete"
                      onClick={() => handleDeleteNotif(n._id)}
                      aria-label="Dismiss"
                      title="Dismiss"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit Profile */}
        {activeTab === 'profile' && <ProfileForm />}

      </div>
    </div>
  );
};

export default Dashboard;
