import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API, { getImageUrl } from '../api/axios';

const diffBadge = (d) => ({
  Easy:   'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Hard:   'bg-red-100 text-red-600',
}[d] || 'bg-gray-100 text-gray-600');

const Recipes = () => {
  const [recipes, setRecipes]       = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [sort, setSort]             = useState('newest');
  const [difficulty, setDifficulty] = useState('');
  const [category, setCategory]     = useState('');
  const [search, setSearch]         = useState('');

  useEffect(() => {
    API.get('/categories').then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (sort)       params.append('sort', sort);
    if (difficulty) params.append('difficulty', difficulty);
    if (category)   params.append('category', category);
    API.get(`/recipes?${params}`)
      .then(({ data }) => setRecipes(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sort, difficulty, category]);

  const filtered = recipes.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleShare = (e, recipe) => {
    e.preventDefault();
    const url = `${window.location.origin}/recipes/${recipe._id}`;
    if (navigator.share) navigator.share({ title: recipe.title, url });
    else { navigator.clipboard.writeText(url); alert('Link copied!'); }
  };

  const selectStyle = {
    padding: '0.6rem 1rem',
    border: '1.5px solid var(--border)',
    borderRadius: '9999px',
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
        <div className="mb-6">
          <p className="section-subtitle !mb-1">Explore our collection</p>
          <h1 className="section-title">All Recipes</h1>
        </div>

        {/* Search + Filters */}
        <div className="card flex gap-4 px-6 py-5 mb-6 flex-wrap items-center">
          <input
            className="flex-1 min-w-[220px] px-4 py-2.5 rounded-full text-sm font-[inherit] transition-all duration-200 focus:outline-none"
            style={{ border: '1.5px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text)' }}
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            type="text"
            placeholder="Search recipes or categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-3 flex-wrap">
            <select value={sort}       onChange={(e) => setSort(e.target.value)}       style={selectStyle}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">A → Z</option>
              <option value="difficulty">By Difficulty</option>
            </select>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={selectStyle}>
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            <select value={category}   onChange={(e) => setCategory(e.target.value)}   style={selectStyle}>
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {!loading && (
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} recipe{filtered.length !== 1 ? 's' : ''} found
          </p>
        )}

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🍽</div>
            <h3>No recipes found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid-3">
            {filtered.map((recipe) => (
              <RecipeCard key={recipe._id} recipe={recipe} onShare={handleShare} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Upgraded Recipe Card ── */
const RecipeCard = ({ recipe, onShare }) => {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered]   = useState(false);

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
      {/* Image with overlay */}
      <Link to={`/recipes/${recipe._id}`} className="block relative h-[220px] overflow-hidden flex-shrink-0">
        {recipe.image
          ? <img
              src={getImageUrl(recipe.image)}
              alt={recipe.title}
              className="w-full h-full object-cover transition-transform duration-500"
              style={{ transform: hovered ? 'scale(1.07)' : 'scale(1)' }}
            />
          : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #fdebd0, #f8d7b0)' }} />
        }
        {/* Dark gradient overlay at bottom */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)' }}
        />
        {/* Difficulty badge top-left */}
        <span className={`badge ${diffBadge(recipe.difficulty)} absolute top-3 left-3 shadow-sm`}>
          {recipe.difficulty}
        </span>
        {/* Cook time top-right */}
        <span
          className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(0,0,0,0.45)', color: '#fff', backdropFilter: 'blur(4px)' }}
        >
          ⏱ {recipe.cookingTime} min
        </span>
        {/* Title over image */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
          <h3 className="text-white font-semibold text-base leading-snug drop-shadow">
            {recipe.title}
          </h3>
        </div>
      </Link>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Category + likes */}
        <div className="flex items-center gap-2 mb-3">
          <span className="badge badge-accent">{recipe.category}</span>
          {recipe.likes?.length > 0 && (
            <span className="text-xs flex items-center gap-1 ml-auto" style={{ color: 'var(--text-muted)' }}>
              <span style={{ color: '#e53935' }}>❤</span> {recipe.likes.length}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed flex-1 mb-1" style={{ color: 'var(--text-muted)' }}>
          {expanded ? recipe.description : `${recipe.description.substring(0, 85)}...`}
        </p>
        <button
          className="text-left bg-transparent border-0 text-xs font-semibold mb-3 cursor-pointer hover:underline font-[inherit]"
          style={{ color: 'var(--primary)' }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less ▲' : 'Read more ▼'}
        </button>

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-3 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          {recipe.chef && (
            <Link
              to={`/chefs/${recipe.chef._id}`}
              className="flex items-center gap-2 text-xs font-medium transition-colors duration-200 hover:text-[var(--primary)] min-w-0"
              style={{ color: 'var(--text-muted)' }}
            >
              <div
                className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-white text-[0.7rem] font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
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
            onClick={(e) => onShare(e, recipe)}
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default Recipes;
