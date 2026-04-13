import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API, { getImageUrl } from '../api/axios';
import './Recipes.css';

const Recipes = () => {
  const [recipes, setRecipes]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [sort, setSort]           = useState('newest');
  const [difficulty, setDifficulty] = useState('');
  const [category, setCategory]   = useState('');
  const [search, setSearch]       = useState('');

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

  return (
    <div className="recipes-page page">
      <div className="container">

        {/* Page header */}
        <div className="recipes-page__header">
          <div>
            <p className="section-subtitle">Explore our collection</p>
            <h1 className="section-title">All Recipes</h1>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="recipes-filters card">
          <input
            className="recipes-search"
            type="text"
            placeholder="🔍  Search recipes or categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="recipes-filters__selects">
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">A → Z</option>
              <option value="difficulty">By Difficulty</option>
            </select>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {['General','Italian','Asian','Mexican','Dessert','Vegan','Breakfast','Seafood'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <p className="recipes-count">{filtered.length} recipe{filtered.length !== 1 ? 's' : ''} found</p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🍽️</div>
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

/* ── Recipe Card with Read More ── */
const RecipeCard = ({ recipe, onShare }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rcard card">
      <Link to={`/recipes/${recipe._id}`}>
        <div className="rcard__img">
          {recipe.image
            ? <img src={getImageUrl(recipe.image)} alt={recipe.title} />
            : <div className="rcard__placeholder">🍽️</div>
          }
          <span className={`badge badge-${recipe.difficulty.toLowerCase()} rcard__badge`}>
            {recipe.difficulty}
          </span>
        </div>
      </Link>
      <div className="rcard__body">
        <div className="rcard__meta">
          <span className="badge badge-accent">{recipe.category}</span>
          <span className="rcard__time">⏱ {recipe.cookingTime} min</span>
        </div>
        <Link to={`/recipes/${recipe._id}`}><h3 className="rcard__title">{recipe.title}</h3></Link>
        <p className="rcard__desc">
          {expanded ? recipe.description : `${recipe.description.substring(0, 90)}...`}
        </p>
        <button className="rcard__readmore" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less ▲' : 'Read more ▼'}
        </button>
        <div className="rcard__footer">
          {recipe.chef && (
            <Link to={`/chefs/${recipe.chef._id}`} className="rcard__chef">
              <div className="rcard__chef-avatar">
                {recipe.chef.avatar
                  ? <img src={getImageUrl(recipe.chef.avatar)} alt={recipe.chef.name} />
                  : <span>{recipe.chef.name.charAt(0)}</span>
                }
              </div>
              {recipe.chef.name}
            </Link>
          )}
          <button className="btn btn-ghost btn-sm rcard__share" onClick={(e) => onShare(e, recipe)}>
            🔗 Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default Recipes;
