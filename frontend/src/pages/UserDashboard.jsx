import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API, { getImageUrl } from '../api/axios';
import ProfileForm from '../components/ProfileForm';

const diffBadge = (d) => ({
  Easy:   'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Hard:   'bg-red-100 text-red-600',
}[d] || 'bg-gray-100 text-gray-600');

const UserDashboard = () => {
  const { user }                    = useAuth();
  const location                    = useLocation();
  const navigate                    = useNavigate();
  const [recipes, setRecipes]       = useState([]);
  const [chefs, setChefs]           = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [sort, setSort]             = useState('newest');
  const [difficulty, setDifficulty] = useState('');
  const [showFavOnly, setShowFavOnly] = useState(false);

  // Set of liked recipe IDs — drives heart state across the whole page
  const [likedIds, setLikedIds] = useState(new Set());

  const searchParams = new URLSearchParams(location.search);
  const activeTab    = searchParams.get('tab') || 'discover';

  const setActiveTab = (tab) => {
    navigate(`?tab=${tab}`, { replace: true });
    setSearch('');
    setShowFavOnly(false);
  };

  const fetchData = useCallback(() => {
    const qp = new URLSearchParams();
    if (sort)       qp.append('sort', sort);
    if (difficulty) qp.append('difficulty', difficulty);
    setLoading(true);
    Promise.all([
      API.get(`/recipes?${qp}`),
      API.get('/chefs'),
      API.get('/recipes/liked'),
    ])
      .then(([r, c, liked]) => {
        setRecipes(r.data);
        setChefs(c.data);
        setFavourites(liked.data);
        setLikedIds(new Set(liked.data.map(rec => rec._id)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sort, difficulty]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Optimistic like toggle
  const handleToggleLike = useCallback(async (recipe) => {
    const wasLiked = likedIds.has(recipe._id);
    setLikedIds(prev => {
      const next = new Set(prev);
      wasLiked ? next.delete(recipe._id) : next.add(recipe._id);
      return next;
    });
    if (wasLiked) {
      setFavourites(prev => prev.filter(r => r._id !== recipe._id));
    } else {
      setFavourites(prev => [recipe, ...prev]);
    }
    try {
      await API.post(`/recipes/${recipe._id}/like`);
    } catch {
      // Revert on error
      setLikedIds(prev => {
        const next = new Set(prev);
        wasLiked ? next.add(recipe._id) : next.delete(recipe._id);
        return next;
      });
      if (wasLiked) {
        setFavourites(prev => [recipe, ...prev]);
      } else {
        setFavourites(prev => prev.filter(r => r._id !== recipe._id));
      }
    }
  }, [likedIds]);

  const handleShare = (e, recipe) => {
    e.preventDefault();
    const url = `${window.location.origin}/recipes/${recipe._id}`;
    if (navigator.share) navigator.share({ title: recipe.title, url });
    else { navigator.clipboard.writeText(url); alert('Link copied!'); }
  };

  // The pool to display: all recipes or only favourites
  const pool = showFavOnly ? favourites : recipes;

  const displayedRecipes = useMemo(() =>
    pool.filter(r =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.category?.toLowerCase().includes(search.toLowerCase())
    ), [pool, search]);

  const filteredChefs = useMemo(() =>
    chefs.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.specialty?.toLowerCase().includes(search.toLowerCase())
    ), [chefs, search]);

  const tabBtn = (key, label) => (
    <button
      key={key}
      className={`bg-transparent border-0 border-b-2 -mb-[1.5px] px-5 py-2.5 text-sm font-medium cursor-pointer transition-colors duration-150 font-[inherit] ${
        activeTab === key ? 'font-semibold' : 'hover:text-[var(--text)]'
      }`}
      style={{
        color: activeTab === key ? 'var(--primary)' : 'var(--text-muted)',
        borderBottomColor: activeTab === key ? 'var(--primary)' : 'transparent',
      }}
      onClick={() => setActiveTab(key)}
    >
      {label}
    </button>
  );

  const selectStyle = {
    padding: '0.55rem 0.9rem',
    border: '1.5px solid var(--border)',
    borderRadius: '10px',
    fontFamily: 'inherit',
    fontSize: '0.875rem',
    background: 'var(--bg-input)',
    color: 'var(--text)',
    cursor: 'pointer',
  };

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
        <div className="flex border-b mb-7" style={{ borderColor: 'var(--border)' }}>
          {tabBtn('discover', 'Discover Recipes')}
          {tabBtn('chefs',    'Browse Chefs')}
          {tabBtn('profile',  'Edit Profile')}
        </div>

        {/* ── Discover Recipes ── */}
        {activeTab === 'discover' && (
          <>
            <div className="flex items-center gap-4 mb-5 flex-wrap">
              {/* Search + refresh */}
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-[380px]">
                  <input
                    className="w-full px-9 py-2.5 rounded-xl text-sm font-[inherit] transition-all duration-200 focus:outline-none"
                    style={{ border: '1.5px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(242,140,0,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
                    type="text"
                    placeholder="Search recipes or categories..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    maxLength={50}
                  />
                  {search && (
                    <button className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-0 text-sm cursor-pointer" style={{ color: 'var(--text-muted)' }} onClick={() => setSearch('')} type="button">✕</button>
                  )}
                </div>
                <button
                  className="flex items-center justify-center w-9 h-9 rounded-xl text-base cursor-pointer transition-all duration-150"
                  style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', color: 'var(--text-muted)' }}
                  onMouseEnter={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.color = 'var(--primary)'; }}
                  onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-muted)'; }}
                  onClick={fetchData}
                  title="Refresh"
                  type="button"
                >
                  ⟳
                </button>
              </div>

              {/* Right side: favourites toggle + sort + difficulty */}
              <div className="flex items-center gap-3 flex-wrap">

                {/* Favourites toggle — same style as the dropdowns */}
                <button
                  type="button"
                  onClick={() => setShowFavOnly(v => !v)}
                  className="flex items-center gap-1.5 cursor-pointer transition-all duration-200 font-[inherit]"
                  style={{
                    padding: '0.55rem 0.9rem',
                    border: `1.5px solid ${showFavOnly ? '#e53935' : 'var(--border)'}`,
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    background: showFavOnly ? '#fff0f0' : 'var(--bg-input)',
                    color: showFavOnly ? '#e53935' : 'var(--text)',
                  }}
                  title={showFavOnly ? 'Show all recipes' : 'Show favourites only'}
                >
                  <span>{showFavOnly ? '❤' : '♡'}</span>
                  Favourites
                  {likedIds.size > 0 && (
                    <span
                      className="text-[0.65rem] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: showFavOnly ? '#e53935' : 'var(--border)',
                        color: showFavOnly ? '#fff' : 'var(--text-muted)',
                      }}
                    >
                      {likedIds.size}
                    </span>
                  )}
                </button>

                <select value={sort} onChange={e => setSort(e.target.value)} style={selectStyle}>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">A → Z</option>
                  <option value="difficulty">By Difficulty</option>
                </select>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={selectStyle}>
                  <option value="">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            {!loading && (
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                {showFavOnly
                  ? `${displayedRecipes.length} saved recipe${displayedRecipes.length !== 1 ? 's' : ''}`
                  : `${displayedRecipes.length} recipe${displayedRecipes.length !== 1 ? 's' : ''}`
                }
              </p>
            )}

            {loading ? (
              <div className="spinner-wrap"><div className="spinner" /></div>
            ) : displayedRecipes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">{showFavOnly ? '❤️' : '🍽'}</div>
                <h3>{showFavOnly ? (search ? 'No results found' : 'No favourites yet') : 'No results found'}</h3>
                <p>{showFavOnly ? (search ? 'Try a different search term' : 'Like recipes to save them here') : 'Try adjusting your search or filters'}</p>
              </div>
            ) : (
              <div className="grid-3">
                {displayedRecipes.map(recipe => (
                  <URecipeCard
                    key={recipe._id}
                    recipe={recipe}
                    liked={likedIds.has(recipe._id)}
                    onToggleLike={handleToggleLike}
                    onShare={handleShare}
                    tab="discover"
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Browse Chefs ── */}
        {activeTab === 'chefs' && (
          <>
            <div className="flex items-center gap-2 mb-6">
              <div className="relative flex-1 max-w-[380px]">
                <input
                  className="w-full px-9 py-2.5 rounded-xl text-sm font-[inherit] transition-all duration-200 focus:outline-none"
                  style={{ border: '1.5px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text)' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(242,140,0,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                  type="text"
                  placeholder="Search chefs by name or specialty..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  maxLength={50}
                />
                {search && (
                  <button className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-0 text-sm cursor-pointer" style={{ color: 'var(--text-muted)' }} onClick={() => setSearch('')} type="button">✕</button>
                )}
              </div>
              <button
                className="flex items-center justify-center w-9 h-9 rounded-xl text-base cursor-pointer transition-all duration-150"
                style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', color: 'var(--text-muted)' }}
                onClick={fetchData}
                title="Refresh"
                type="button"
              >
                ⟳
              </button>
            </div>

            {loading ? (
              <div className="spinner-wrap"><div className="spinner" /></div>
            ) : filteredChefs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👨‍🍳</div>
                <h3>No results found</h3>
                <p>Try a different search term</p>
              </div>
            ) : (
              <div className="grid-3">
                {filteredChefs.map(chef => (
                  <Link
                    to={`/chefs/${chef._id}`}
                    state={{ from: '/my?tab=chefs' }}
                    key={chef._id}
                    className="card overflow-hidden flex flex-col rounded-xl transition-transform duration-200 hover:-translate-y-1"
                  >
                    <div className="h-[60px]" style={{ background: 'linear-gradient(135deg, var(--accent), var(--primary))' }} />
                    <div className="px-5 pb-5 flex flex-col items-center text-center gap-1.5">
                      <div
                        className="w-[68px] h-[68px] rounded-full overflow-hidden flex-shrink-0 -mt-[34px]"
                        style={{ border: '4px solid var(--bg-card)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                      >
                        {chef.avatar
                          ? <img src={getImageUrl(chef.avatar)} alt={chef.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: 'var(--primary)' }}>{chef.name.charAt(0)}</div>
                        }
                      </div>
                      <h3 className="text-base mt-0.5">{chef.name}</h3>
                      {chef.specialty && <span className="badge badge-accent">{chef.specialty}</span>}
                      {chef.location  && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{chef.location}</p>}
                      <p className="text-[0.82rem] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        {chef.bio ? chef.bio.substring(0, 80) + '...' : 'Passionate chef sharing amazing recipes.'}
                      </p>
                      <span className="btn btn-outline btn-sm mt-2">View Profile →</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Edit Profile ── */}
        {activeTab === 'profile' && (
          <ProfileForm showSpecialty={false} showSocialLinks={false} />
        )}

      </div>
    </div>
  );
};

/* ── Recipe card ── */
const URecipeCard = ({ recipe, liked, onToggleLike, onShare, tab = 'discover' }) => {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered]   = useState(false);
  const from = `/my?tab=${tab}`;

  return (
    <div
      className="overflow-hidden flex flex-col rounded-2xl transition-all duration-300"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: hovered ? '0 12px 40px rgba(242,140,0,0.15)' : '0 2px 8px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative h-[220px] overflow-hidden flex-shrink-0">
        <Link to={`/recipes/${recipe._id}`} state={{ from }} className="block w-full h-full">
          {recipe.image
            ? <img
                src={getImageUrl(recipe.image)}
                alt={recipe.title}
                className="w-full h-full object-cover transition-transform duration-500"
                style={{ transform: hovered ? 'scale(1.07)' : 'scale(1)' }}
              />
            : <div className="w-full h-full" style={{ background: '#f5f0eb' }} />
          }
        </Link>
        {/* Gradient overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)' }} />
        {/* Difficulty badge */}
        <span className={`badge ${diffBadge(recipe.difficulty)} absolute top-3 left-3 shadow-sm`}>
          {recipe.difficulty}
        </span>
        {/* Cook time */}
        <span
          className="absolute top-3 right-10 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(0,0,0,0.45)', color: '#fff', backdropFilter: 'blur(4px)' }}
        >
          ⏱ {recipe.cookingTime} min
        </span>
        {/* Heart button */}
        <button
          className="absolute top-2.5 right-2.5 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 border-0 cursor-pointer"
          style={{
            background: liked ? '#e53935' : 'rgba(255,255,255,0.85)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          }}
          onClick={() => onToggleLike(recipe)}
          aria-label={liked ? 'Remove from favourites' : 'Add to favourites'}
        >
          <span className="text-sm leading-none" style={{ color: liked ? '#fff' : '#e53935' }}>
            {liked ? '❤' : '♡'}
          </span>
        </button>
        {/* Title over image */}
        <Link to={`/recipes/${recipe._id}`} state={{ from }} className="absolute bottom-0 left-0 right-0 px-4 pb-3">
          <h3 className="text-white font-semibold text-base leading-snug drop-shadow">
            {recipe.title}
          </h3>
        </Link>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <span className="badge badge-accent">{recipe.category}</span>
          {recipe.likes?.length > 0 && (
            <span className="text-xs flex items-center gap-1 ml-auto" style={{ color: 'var(--text-muted)' }}>
              <span style={{ color: '#e53935' }}>❤</span> {recipe.likes.length}
            </span>
          )}
        </div>
        <p className="text-sm leading-relaxed mb-1 flex-1" style={{ color: 'var(--text-muted)' }}>
          {expanded ? recipe.description : `${recipe.description.substring(0, 85)}...`}
        </p>
        <button
          className="text-left bg-transparent border-0 text-xs font-semibold mb-3 cursor-pointer hover:underline font-[inherit]"
          style={{ color: 'var(--primary)' }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less ▲' : 'Read more ▼'}
        </button>
        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          {recipe.chef && (
            <Link
              to={`/chefs/${recipe.chef._id}`}
              state={{ from }}
              className="flex items-center gap-2 text-xs font-medium transition-colors duration-200 hover:text-[var(--primary)] min-w-0"
              style={{ color: 'var(--text-muted)' }}
            >
              <div
                className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-white text-[0.7rem] font-bold flex-shrink-0"
                style={{ background: 'var(--primary)' }}
              >
                {recipe.chef.avatar
                  ? <img src={getImageUrl(recipe.chef.avatar)} alt={recipe.chef.name} className="w-full h-full object-cover" />
                  : <span>{recipe.chef.name.charAt(0)}</span>
                }
              </div>
              <span className="truncate">{recipe.chef.name}</span>
            </Link>
          )}
          <button
            className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-150 font-[inherit] cursor-pointer"
            style={{ border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.color = 'var(--primary)'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-muted)'; }}
            onClick={e => onShare(e, recipe)}
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
