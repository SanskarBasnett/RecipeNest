import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API, { getImageUrl } from '../api/axios';
import './RecipeDetail.css';

const RecipeDetail = () => {
  const { id } = useParams();
  const [recipe, setRecipe]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    API.get(`/recipes/${id}`)
      .then(({ data }) => setRecipe(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load recipe'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title: recipe.title, url });
    else { navigator.clipboard.writeText(url); alert('Link copied!'); }
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (error)   return <div className="container page"><div className="alert alert-error">{error}</div></div>;
  if (!recipe) return <div className="container page"><p>Recipe not found.</p></div>;

  return (
    <div className="rdetail page">
      <div className="container">

        {/* Hero */}
        <div className="rdetail__hero">
          {recipe.image
            ? <img src={getImageUrl(recipe.image)} alt={recipe.title} />
            : <div className="rdetail__hero-placeholder">🍽️</div>
          }
          <div className="rdetail__hero-overlay">
            <div className="rdetail__hero-tags">
              <span className={`badge badge-${recipe.difficulty.toLowerCase()}`}>{recipe.difficulty}</span>
              <span className="badge badge-success">{recipe.category}</span>
            </div>
            <h1 className="rdetail__title">{recipe.title}</h1>
            <div className="rdetail__hero-meta">
              <span>⏱ {recipe.cookingTime} min</span>
              <span>🥄 {recipe.ingredients.length} ingredients</span>
              {recipe.chef && <span>👨‍🍳 {recipe.chef.name}</span>}
            </div>
          </div>
        </div>

        <div className="rdetail__layout">
          {/* Main content */}
          <div className="rdetail__main">
            <p className="rdetail__desc">{recipe.description}</p>

            {/* Ingredients */}
            <div className="rdetail__section card">
              <h2>🥗 Ingredients</h2>
              <ul className="rdetail__ingredients">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i}>
                    <span className="rdetail__ing-check">✓</span>
                    {ing}
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div className="rdetail__section card">
              <h2>📋 Instructions</h2>
              <div className="rdetail__instructions">
                {recipe.instructions.split('\n').filter(Boolean).map((step, i) => (
                  <div key={i} className="rdetail__step">
                    <div className="rdetail__step-num">{i + 1}</div>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Share */}
            <div className="rdetail__share card">
              <span>Share this recipe:</span>
              <button className="btn btn-ghost btn-sm" onClick={handleShare}>🔗 Copy Link</button>
              <a
                href={`https://twitter.com/intent/tweet?text=Check out: ${recipe.title}&url=${window.location.href}`}
                target="_blank" rel="noreferrer"
                className="btn btn-ghost btn-sm"
              >🐦 Twitter</a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`}
                target="_blank" rel="noreferrer"
                className="btn btn-ghost btn-sm"
              >📘 Facebook</a>
            </div>
          </div>

          {/* Sidebar */}
          {recipe.chef && (
            <aside className="rdetail__sidebar">
              <div className="chef-sidebar card">
                <p className="chef-sidebar__label">Recipe by</p>
                <div className="chef-sidebar__avatar">
                  {recipe.chef.avatar
                    ? <img src={getImageUrl(recipe.chef.avatar)} alt={recipe.chef.name} />
                    : <div className="chef-sidebar__placeholder">{recipe.chef.name.charAt(0)}</div>
                  }
                </div>
                <h3>{recipe.chef.name}</h3>
                {recipe.chef.specialty && <span className="badge badge-accent">{recipe.chef.specialty}</span>}
                {recipe.chef.location  && <p className="chef-sidebar__loc">📍 {recipe.chef.location}</p>}
                <Link to={`/chefs/${recipe.chef._id}`} className="btn btn-primary btn-full" style={{marginTop:'1rem'}}>
                  View Profile
                </Link>
              </div>

              {/* Stats card */}
              <div className="rdetail__stats card">
                <div className="rdetail__stat">
                  <span>⏱</span>
                  <div><strong>{recipe.cookingTime}</strong><small>minutes</small></div>
                </div>
                <div className="rdetail__stat">
                  <span>🥄</span>
                  <div><strong>{recipe.ingredients.length}</strong><small>ingredients</small></div>
                </div>
                <div className="rdetail__stat">
                  <span>📊</span>
                  <div><strong>{recipe.difficulty}</strong><small>difficulty</small></div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;
