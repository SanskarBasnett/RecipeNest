import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API, { getImageUrl } from '../api/axios';
import RecipeForm from '../components/RecipeForm';
import ProfileForm from '../components/ProfileForm';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [recipes, setRecipes]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('recipes');
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [showForm, setShowForm]       = useState(false);

  const fetchRecipes = () => {
    setLoading(true);
    API.get('/recipes/chef/my')
      .then(({ data }) => setRecipes(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRecipes(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recipe? This cannot be undone.')) return;
    try {
      await API.delete(`/recipes/${id}`);
      setRecipes((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const openAdd  = () => { setEditingRecipe(null); setShowForm(true); };
  const openEdit = (r) => { setEditingRecipe(r);   setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingRecipe(null); };
  const onSuccess = () => { closeForm(); fetchRecipes(); };

  const tabs = [
    { key: 'recipes', label: '📖 My Recipes', count: recipes.length },
    { key: 'profile', label: '👤 Edit Profile' },
  ];

  return (
    <div className="dash page">
      <div className="container">

        {/* Header */}
        <div className="dash__header">
          <div className="dash__welcome">
            <div className="dash__avatar">{user.name.charAt(0).toUpperCase()}</div>
            <div>
              <p className="dash__greeting">Good to see you back,</p>
              <h1 className="dash__name">{user.name}</h1>
            </div>
          </div>
          {activeTab === 'recipes' && (
            <button className="btn btn-primary" onClick={openAdd}>+ Add Recipe</button>
          )}
        </div>

        {/* Stats row */}
        <div className="dash__stats">
          <div className="dash__stat card">
            <span>📖</span>
            <div><strong>{recipes.length}</strong><small>Recipes</small></div>
          </div>
          <div className="dash__stat card">
            <span>✅</span>
            <div><strong>{recipes.filter(r => r.difficulty === 'Easy').length}</strong><small>Easy</small></div>
          </div>
          <div className="dash__stat card">
            <span>🔥</span>
            <div><strong>{recipes.filter(r => r.difficulty === 'Hard').length}</strong><small>Hard</small></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="dash__tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`dash__tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
              {t.count !== undefined && <span className="dash__tab-count">{t.count}</span>}
            </button>
          ))}
        </div>

        {/* Recipe Form */}
        {activeTab === 'recipes' && showForm && (
          <RecipeForm recipe={editingRecipe} onSuccess={onSuccess} onCancel={closeForm} />
        )}

        {/* Recipes Tab */}
        {activeTab === 'recipes' && (
          loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : recipes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🍽️</div>
              <h3>No recipes yet</h3>
              <p>Add your first recipe to get started!</p>
              <button className="btn btn-primary" style={{marginTop:'1rem'}} onClick={openAdd}>+ Add Recipe</button>
            </div>
          ) : (
            <div className="dash__recipe-list">
              {recipes.map((r) => (
                <div key={r._id} className="dash__recipe-row card">
                  <div className="dash__recipe-img">
                    {r.image
                      ? <img src={getImageUrl(r.image)} alt={r.title} />
                      : <div className="dash__recipe-placeholder">🍽️</div>
                    }
                  </div>
                  <div className="dash__recipe-info">
                    <h3>{r.title}</h3>
                    <div className="dash__recipe-meta">
                      <span className={`badge badge-${r.difficulty.toLowerCase()}`}>{r.difficulty}</span>
                      <span className="badge badge-accent">{r.category}</span>
                      <span className="dash__recipe-time">⏱ {r.cookingTime} min</span>
                    </div>
                  </div>
                  <div className="dash__recipe-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>✏️ Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r._id)}>🗑️ Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && <ProfileForm />}

      </div>
    </div>
  );
};

export default Dashboard;
