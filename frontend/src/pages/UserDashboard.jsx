import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API, { getImageUrl } from '../api/axios';
import ProfileForm from '../components/ProfileForm';
import './UserDashboard.css';

const UserDashboard = () => {
  const { user }                    = useAuth();
  const location                    = useLocation();
  const navigate                    = useNavigate();
  const [recipes, setRecipes]       = useState([]);
  const [chefs, setChefs]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [sort, setSort]             = useState('newest');
  const [difficulty, setDifficulty] = useState('');

  // Active tab lives in the URL: /my?tab=discover|chefs|profile
  const searchParams = new URLSearchParams(location.search);
  const activeTab    = searchParams.get('tab') || 'discover';

  const setActiveTab = (tab) => {
    navigate(`?tab=${tab}`, { replace: true });
    setSearch('');
  };

  const fetchData = () => {
    const qp = new URLSearchParams();
    if (sort)       qp.append('sort', sort);
    if (difficulty) qp.append('difficulty', difficulty);
    setLoading(true);
    Promise.all([
      API.get(`/recipes?${qp}`),
      API.get('/chefs'),
    ])
      .then(([r, c]) => { setRecipes(r.data); setChefs(c.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [sort, difficulty]);

  const handleShare = (e, recipe) => {
    e.preventDefault();
    const url = `${window.location.origin}/recipes/${recipe._id}`;
    if (navigator.share) navigator.share({ title: recipe.title, url });
    else { navigator.clipboard.writeText(url); alert('Link copied!'); }
  };

  const filteredRecipes = useMemo(() =>
    recipes.filter(r =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.category?.toLowerCase().includes(search.toLowerCase())
    ), [recipes, search]);

  const filteredChefs = useMemo(() =>
    chefs.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.specialty?.toLowerCase().includes(search.toLowerCase())
    ), [chefs, search]);

  return (
    <div className="udash page">
      <div className="container">

        {/* Header */}
        <div className="udash-head">
          <div className="udash-head__left">
            <div className="udash-head__avatar">
              {user.avatar
                ? <img src={getImageUrl(user.avatar)} alt={user.name} />
                : user.name.charAt(0).toUpperCase()
              }
            </div>
            <div>
              <p className="udash-head__greeting">Good to see you back,</p>
              <h1 className="udash-head__name">{user.name}</h1>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="udash-tabs">
          <button
            className={activeTab === 'discover' ? 'active' : ''}
            onClick={() => setActiveTab('discover')}
          >🍽️ Discover Recipes</button>
          <button
            className={activeTab === 'chefs' ? 'active' : ''}
            onClick={() => setActiveTab('chefs')}
          >👨‍🍳 Browse Chefs</button>
          <button
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
          >✏️ Edit Profile</button>
        </div>

        {/* Discover Recipes */}
        {activeTab === 'discover' && (
          <>
            <div className="udash-toolbar">
              <div className="udash-searchbar">
                <div className="udash-searchbar__wrap">
                  <input
                    className="udash-search"
                    type="text"
                    placeholder="Search recipes or categories..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    maxLength={50}
                  />
                  {search && (
                    <button className="udash-searchbar__clear" onClick={() => setSearch('')} type="button">✕</button>
                  )}
                </div>
                <button className="udash-searchbar__refresh" onClick={fetchData} title="Refresh" type="button">⟳</button>
              </div>
              <div className="udash-selects">
                <select value={sort} onChange={e => setSort(e.target.value)}>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">A → Z</option>
                  <option value="difficulty">By Difficulty</option>
                </select>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                  <option value="">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            {!loading && (
              <p className="udash-count">{filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''}</p>
            )}

            {loading ? (
              <div className="spinner-wrap"><div className="spinner" /></div>
            ) : filteredRecipes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🍽️</div>
                <h3>No results found 😕</h3>
                <p>Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid-3">
                {filteredRecipes.map(recipe => (
                  <URecipeCard key={recipe._id} recipe={recipe} onShare={handleShare} tab="discover" />
                ))}
              </div>
            )}
          </>
        )}

        {/* Browse Chefs */}
        {activeTab === 'chefs' && (
          <>
            <div className="udash-searchbar" style={{ marginBottom: '1.5rem' }}>
              <div className="udash-searchbar__wrap">
                <input
                  className="udash-search"
                  type="text"
                  placeholder="Search chefs by name or specialty..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  maxLength={50}
                />
                {search && (
                  <button className="udash-searchbar__clear" onClick={() => setSearch('')} type="button">✕</button>
                )}
              </div>
              <button className="udash-searchbar__refresh" onClick={fetchData} title="Refresh" type="button">⟳</button>
            </div>

            {loading ? (
              <div className="spinner-wrap"><div className="spinner" /></div>
            ) : filteredChefs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👨‍🍳</div>
                <h3>No results found 😕</h3>
                <p>Try a different search term</p>
              </div>
            ) : (
              <div className="grid-3">
                {filteredChefs.map(chef => (
                  <Link
                    to={`/chefs/${chef._id}`}
                    state={{ from: '/my?tab=chefs' }}
                    key={chef._id}
                    className="udash-chef card"
                  >
                    <div className="udash-chef__cover" />
                    <div className="udash-chef__body">
                      <div className="udash-chef__avatar">
                        {chef.avatar
                          ? <img src={getImageUrl(chef.avatar)} alt={chef.name} />
                          : <div className="udash-chef__initials">{chef.name.charAt(0)}</div>
                        }
                      </div>
                      <h3>{chef.name}</h3>
                      {chef.specialty && <span className="badge badge-accent">{chef.specialty}</span>}
                      {chef.location  && <p className="udash-chef__loc">📍 {chef.location}</p>}
                      <p className="udash-chef__bio">
                        {chef.bio ? chef.bio.substring(0, 80) + '...' : 'Passionate chef sharing amazing recipes.'}
                      </p>
                      <span className="btn btn-outline btn-sm" style={{ marginTop: '0.5rem' }}>View Profile →</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Edit Profile */}
        {activeTab === 'profile' && (
          <ProfileForm showSpecialty={false} showSocialLinks={false} />
        )}

      </div>
    </div>
  );
};

/* ── Recipe card with Read More + Share ── */
const URecipeCard = ({ recipe, onShare, tab = 'discover' }) => {
  const [expanded, setExpanded] = useState(false);
  const from = `/my?tab=${tab}`;

  return (
    <div className="udash-rcard card">
      <Link to={`/recipes/${recipe._id}`} state={{ from }}>
        <div className="udash-rcard__img">
          {recipe.image
            ? <img src={getImageUrl(recipe.image)} alt={recipe.title} />
            : <div className="udash-rcard__placeholder">🍽️</div>
          }
          <span className={`badge badge-${recipe.difficulty.toLowerCase()} udash-rcard__badge`}>
            {recipe.difficulty}
          </span>
        </div>
      </Link>
      <div className="udash-rcard__body">
        <div className="udash-rcard__meta">
          <span className="badge badge-accent">{recipe.category}</span>
          <span className="udash-rcard__time">⏱ {recipe.cookingTime} min</span>
        </div>
        <Link to={`/recipes/${recipe._id}`} state={{ from }}>
          <h3 className="udash-rcard__title">{recipe.title}</h3>
        </Link>
        <p className="udash-rcard__desc">
          {expanded ? recipe.description : `${recipe.description.substring(0, 90)}...`}
        </p>
        <button className="udash-rcard__readmore" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less ▲' : 'Read more ▼'}
        </button>
        <div className="udash-rcard__footer">
          {recipe.chef && (
            <Link to={`/chefs/${recipe.chef._id}`} state={{ from }} className="udash-rcard__chef">
              <div className="udash-rcard__chef-avatar">
                {recipe.chef.avatar
                  ? <img src={getImageUrl(recipe.chef.avatar)} alt={recipe.chef.name} />
                  : <span>{recipe.chef.name.charAt(0)}</span>
                }
              </div>
              {recipe.chef.name}
            </Link>
          )}
          <button className="udash-rcard__share" onClick={e => onShare(e, recipe)}>
            🔗 Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
