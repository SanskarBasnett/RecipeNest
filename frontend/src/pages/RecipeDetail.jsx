import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import API, { getImageUrl } from '../api/axios';
import { useAuth } from '../context/AuthContext';

const diffBadge = (d) => ({
  Easy:   'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Hard:   'bg-red-100 text-red-600',
}[d] || 'bg-gray-100 text-gray-600');

const RecipeDetail = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user }   = useAuth();
  const backTo     = location.state?.from || -1;

  const [recipe,  setRecipe]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const [likeCount, setLikeCount] = useState(0);
  const [liked,     setLiked]     = useState(false);
  const [liking,    setLiking]    = useState(false);

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
    <div className="page">
      <div className="container">

        <button className="back-btn" onClick={() => navigate(backTo)}>← Back</button>

        {/* Hero */}
        <div className="relative h-[420px] rounded-2xl overflow-hidden mb-10 max-md:h-[260px]">
          {recipe.image
            ? <img src={getImageUrl(recipe.image)} alt={recipe.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #fdebd0, #f8c89a)' }} />
          }
          <div
            className="absolute bottom-0 left-0 right-0 p-8"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)' }}
          >
            <div className="flex gap-2 mb-3">
              <span className={`badge ${diffBadge(recipe.difficulty)}`}>{recipe.difficulty}</span>
              <span className="badge badge-success">{recipe.category}</span>
            </div>
            <h1
              className="text-white mb-3 font-display"
              style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)' }}
            >
              {recipe.title}
            </h1>
            <div className="flex gap-6 text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
              <span>{recipe.cookingTime} min</span>
              <span>{recipe.ingredients.length} ingredients</span>
              {recipe.chef && <span>{recipe.chef.name}</span>}
            </div>
          </div>
        </div>

        {/* Like bar */}
        <div className="flex items-center gap-4 mb-6">
          <button
            className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 font-[inherit] cursor-pointer ${
              liked
                ? 'border-red-500 text-red-500 bg-red-50'
                : 'hover:border-red-500 hover:text-red-500 hover:bg-red-50'
            }`}
            style={{
              border: `1.5px solid ${liked ? '#e53935' : 'var(--border)'}`,
              background: liked ? '#fff5f5' : 'var(--bg-card)',
              color: liked ? '#e53935' : 'var(--text-muted)',
            }}
            onClick={handleLike}
            disabled={liking}
            aria-label={liked ? 'Unlike recipe' : 'Like recipe'}
          >
            {liked ? '❤️' : '🤍'} {liked ? 'Liked' : 'Like'} · {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
          </button>
          {!user && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Log in to like or comment</span>
          )}
        </div>

        {/* Layout */}
        <div className="grid grid-cols-[1fr_300px] gap-8 items-start max-md:grid-cols-1">

          {/* Main */}
          <div>
            <p className="text-base leading-[1.8] mb-6" style={{ color: 'var(--text-muted)' }}>
              {recipe.description}
            </p>

            {/* Ingredients + Instructions + Share */}
            <div className="card p-7 mb-6">
              <h2 className="text-xl mb-5">Ingredients</h2>
              <ul className="grid grid-cols-2 gap-2.5 max-md:grid-cols-1">
                {recipe.ingredients.map((ing, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                    style={{ background: 'var(--bg)' }}
                  >
                    <span className="font-bold flex-shrink-0" style={{ color: 'var(--success)' }}>✓</span>
                    {ing}
                  </li>
                ))}
              </ul>

              <div className="h-px my-7" style={{ background: 'var(--border)' }} />

              <h2 className="text-xl mb-5">Instructions</h2>
              <div className="flex flex-col gap-5">
                {recipe.instructions.split('\n').filter(Boolean).map((step, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: 'var(--primary)' }}
                    >
                      {i + 1}
                    </div>
                    <p className="text-sm leading-[1.7] pt-1" style={{ color: 'var(--text)' }}>{step}</p>
                  </div>
                ))}
              </div>

              <div className="h-px my-7" style={{ background: 'var(--border)' }} />

              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Share this recipe:</span>
                <div className="flex gap-2 flex-wrap">
                  <button className="btn btn-ghost btn-sm" onClick={handleShare}>Copy Link</button>
                  <a
                    href={`https://twitter.com/intent/tweet?text=Check out: ${recipe.title}&url=${window.location.href}`}
                    target="_blank" rel="noreferrer"
                    className="btn btn-ghost btn-sm"
                  >Twitter</a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`}
                    target="_blank" rel="noreferrer"
                    className="btn btn-ghost btn-sm"
                  >Facebook</a>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="card p-7">
              <h2 className="text-xl mb-5 flex items-center gap-2">
                Comments
                {comments.length > 0 && (
                  <span
                    className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full text-white text-[0.72rem] font-bold px-1.5"
                    style={{ background: 'var(--primary)' }}
                  >
                    {comments.length}
                  </span>
                )}
              </h2>

              {user ? (
                <form className="mb-6" onSubmit={handleComment}>
                  <div className="flex gap-3 items-start">
                    <div
                      className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ background: 'var(--primary)' }}
                    >
                      {user.avatar
                        ? <img src={getImageUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
                        : <span>{user.name.charAt(0).toUpperCase()}</span>
                      }
                    </div>
                    <textarea
                      className="flex-1 px-3.5 py-2.5 rounded-lg text-sm font-[inherit] resize-y transition-all duration-200 focus:outline-none"
                      style={{
                        border: '1.5px solid var(--border)',
                        background: 'var(--bg-input)',
                        color: 'var(--text)',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(242,140,0,0.12)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder="Share your thoughts on this recipe..."
                      rows={2}
                      maxLength={1000}
                    />
                  </div>
                  {commentError && <p className="text-xs text-red-600 mt-1.5">{commentError}</p>}
                  <div className="flex justify-end items-center gap-3 mt-2">
                    <span className="text-xs" style={{ color: 'var(--text-light)' }}>{commentText.length}/1000</span>
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
                <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                  <Link to="/login" state={{ from: location.pathname }} className="font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
                    Log in
                  </Link>{' '}
                  to leave a comment.
                </p>
              )}

              {comments.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
                  No comments yet. Be the first!
                </p>
              ) : (
                <div className="flex flex-col gap-4 mt-4">
                  {comments.map(c => (
                    <div
                      key={c._id}
                      className="flex gap-3 items-start p-3.5 rounded-lg relative"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                    >
                      <div
                        className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ background: 'var(--primary)' }}
                      >
                        {c.avatar
                          ? <img src={getImageUrl(c.avatar)} alt={c.name} className="w-full h-full object-cover" />
                          : <span>{c.name.charAt(0).toUpperCase()}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                          <strong className="text-sm" style={{ color: 'var(--text)' }}>{c.name}</strong>
                          <time className="text-xs" style={{ color: 'var(--text-light)' }}>
                            {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </time>
                        </div>
                        <p className="text-sm leading-relaxed break-words" style={{ color: 'var(--text-muted)' }}>{c.text}</p>
                      </div>
                      {user && (user._id === c.user || user.role === 'admin') && (
                        <button
                          className="bg-transparent border-0 text-xs cursor-pointer px-1.5 py-1 rounded transition-all duration-150 flex-shrink-0 self-start hover:text-red-500 hover:bg-red-50"
                          style={{ color: 'var(--text-light)' }}
                          onClick={() => handleDeleteComment(c._id)}
                          aria-label="Delete comment"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          {recipe.chef && (
            <aside className="sticky top-[88px] flex flex-col gap-4 max-md:static">
              {/* Chef card */}
              <div className="card p-6 text-center">
                <p
                  className="text-xs uppercase tracking-widest mb-4"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Recipe by
                </p>
                <div
                  className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3"
                  style={{ border: '3px solid var(--primary)' }}
                >
                  {recipe.chef.avatar
                    ? <img src={getImageUrl(recipe.chef.avatar)} alt={recipe.chef.name} className="w-full h-full object-cover" />
                    : (
                      <div
                        className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
                      >
                        {recipe.chef.name.charAt(0)}
                      </div>
                    )
                  }
                </div>
                <h3 className="text-lg mb-1.5">{recipe.chef.name}</h3>
                {recipe.chef.specialty && <span className="badge badge-accent">{recipe.chef.specialty}</span>}
                {recipe.chef.location  && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{recipe.chef.location}</p>}
                <Link
                  to={`/chefs/${recipe.chef._id}`}
                  state={{ from: location.state?.from || '/my?tab=discover' }}
                  className="btn btn-primary btn-full mt-4"
                >
                  View Profile
                </Link>
              </div>

              {/* Stats card */}
              <div className="card p-5 flex flex-col gap-4">
                {[
                  { label: 'Time',   value: recipe.cookingTime,          unit: 'minutes' },
                  { label: 'Ingr.',  value: recipe.ingredients.length,   unit: 'ingredients' },
                  { label: 'Level',  value: recipe.difficulty,           unit: 'difficulty' },
                  { label: 'Likes',  value: likeCount,                   unit: 'likes' },
                  { label: 'Cmts',   value: comments.length,             unit: 'comments' },
                ].map(({ label, value, unit }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-sm w-10 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <div>
                      <strong className="block text-base font-bold" style={{ color: 'var(--text)' }}>{value}</strong>
                      <small className="text-xs" style={{ color: 'var(--text-muted)' }}>{unit}</small>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;
