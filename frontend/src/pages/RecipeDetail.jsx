import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import API, { getImageUrl } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './RecipeDetail.css';

const RecipeDetail = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user }   = useAuth();
  const backTo     = location.state?.from || -1;

  const [recipe,  setRecipe]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // Like state
  const [likeCount, setLikeCount] = useState(0);
  const [liked,     setLiked]     = useState(false);
  const [liking,    setLiking]    = useState(false);

  // Comment state
  const [comments,     setComments]     = useState([]);
  const [commentText,  setCommentText]  = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    API.get(`/recipes/${id}`)
      .then(({ data }) => {
        setRecipe(data);
        setLikeCount(data.likes?.length || 0);
        setLiked(user ? data.likes?.includes(user._id) : false);
        setComments(data.comments || []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load recipe'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title: recipe.title, url });
    else { navigator.clipboard.writeText(url); alert('Link copied!'); }
  };

  const handleLike = async () => {
    if (!user) { navigate('/login'); return; }
    setLiking(true);
    try {
      const { data } = await API.post(`/recipes/${id}/like`);
      setLikeCount(data.likes);
      setLiked(data.liked);
    } catch (_) {}
    finally { setLiking(false); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    setCommentError('');
    try {
      const { data } = await API.post(`/recipes/${id}/comments`, { text: commentText });
      setComments(prev => [...prev, data]);
      setCommentText('');
    } catch (err) {
      setCommentError(err.response?.data?.message || 'Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await API.delete(`/recipes/${id}/comments/${commentId}`);
      setComments(prev => prev.filter(c => c._id !== commentId));
    } catch (_) {}
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (error)   return <div className="container page"><div className="alert alert-error">{error}</div></div>;
  if (!recipe) return <div className="container page"><p>Recipe not found.</p></div>;

  return (
    <div className="rdetail page">
      <div className="container">

        <button className="back-btn" onClick={() => navigate(backTo)}>← Back</button>

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

        {/* Like bar */}
        <div className="rdetail__like-bar">
          <button
            className={`rdetail__like-btn${liked ? ' rdetail__like-btn--liked' : ''}`}
            onClick={handleLike}
            disabled={liking}
            aria-label={liked ? 'Unlike recipe' : 'Like recipe'}
          >
            {liked ? '❤️' : '🤍'} {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
          </button>
          {!user && <span className="rdetail__like-hint">Log in to like or comment</span>}
        </div>

        <div className="rdetail__layout">
          {/* Main content */}
          <div className="rdetail__main">
            <p className="rdetail__desc">{recipe.description}</p>

            {/* Ingredients + Instructions + Share */}
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

              <div className="rdetail__inner-divider" />

              <h2>📋 Instructions</h2>
              <div className="rdetail__instructions">
                {recipe.instructions.split('\n').filter(Boolean).map((step, i) => (
                  <div key={i} className="rdetail__step">
                    <div className="rdetail__step-num">{i + 1}</div>
                    <p>{step}</p>
                  </div>
                ))}
              </div>

              <div className="rdetail__inner-divider" />

              <div className="rdetail__share-row">
                <span>Share this recipe:</span>
                <div className="rdetail__share-btns">
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
            </div>

            {/* Comments */}
            <div className="rdetail__section card">
              <h2>💬 Comments {comments.length > 0 && <span className="rdetail__comment-count">{comments.length}</span>}</h2>

              {/* Comment form */}
              {user ? (
                <form className="rdetail__comment-form" onSubmit={handleComment}>
                  <div className="rdetail__comment-input-row">
                    <div className="rdetail__comment-avatar">
                      {user.avatar
                        ? <img src={getImageUrl(user.avatar)} alt={user.name} />
                        : <span>{user.name.charAt(0).toUpperCase()}</span>
                      }
                    </div>
                    <textarea
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder="Share your thoughts on this recipe..."
                      rows={2}
                      maxLength={1000}
                    />
                  </div>
                  {commentError && <p className="rdetail__comment-err">{commentError}</p>}
                  <div className="rdetail__comment-actions">
                    <span className="rdetail__comment-chars">{commentText.length}/1000</span>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={submitting || !commentText.trim()}
                    >
                      {submitting ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="rdetail__comment-login">
                  <Link to="/login" state={{ from: location.pathname }}>Log in</Link> to leave a comment.
                </p>
              )}

              {/* Comment list */}
              {comments.length === 0 ? (
                <p className="rdetail__no-comments">No comments yet. Be the first!</p>
              ) : (
                <div className="rdetail__comment-list">
                  {comments.map(c => (
                    <div key={c._id} className="rdetail__comment">
                      <div className="rdetail__comment-avatar">
                        {c.avatar
                          ? <img src={getImageUrl(c.avatar)} alt={c.name} />
                          : <span>{c.name.charAt(0).toUpperCase()}</span>
                        }
                      </div>
                      <div className="rdetail__comment-body">
                        <div className="rdetail__comment-header">
                          <strong>{c.name}</strong>
                          <time>{new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time>
                        </div>
                        <p>{c.text}</p>
                      </div>
                      {user && (user._id === c.user || user.role === 'admin') && (
                        <button
                          className="rdetail__comment-delete"
                          onClick={() => handleDeleteComment(c._id)}
                          aria-label="Delete comment"
                          title="Delete"
                        >✕</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
                <Link
                  to={`/chefs/${recipe.chef._id}`}
                  state={{ from: location.state?.from || '/my?tab=discover' }}
                  className="btn btn-primary btn-full"
                  style={{ marginTop: '1rem' }}
                >
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
                <div className="rdetail__stat">
                  <span>❤️</span>
                  <div><strong>{likeCount}</strong><small>likes</small></div>
                </div>
                <div className="rdetail__stat">
                  <span>💬</span>
                  <div><strong>{comments.length}</strong><small>comments</small></div>
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
