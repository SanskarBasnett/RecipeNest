import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import API, { getImageUrl } from '../api/axios';

const diffBadge = (d) => ({
  Easy:   'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Hard:   'bg-red-100 text-red-600',
}[d] || 'bg-gray-100 text-gray-600');

const ChefProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = location.state?.from || -1;
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    API.get(`/chefs/${id}`)
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load chef'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (error)   return <div className="container page"><div className="alert alert-error">{error}</div></div>;
  if (!data)   return <div className="container page"><p>Chef not found.</p></div>;

  const { chef, recipes } = data;

  // Most liked recipe = best recipe
  const bestRecipe = recipes.length
    ? recipes.reduce((best, r) =>
        (r.likes?.length || 0) > (best.likes?.length || 0) ? r : best
      , recipes[0])
    : null;

  return (
    <div className="page">
      <div className="container">

        <button className="back-btn" onClick={() => navigate(backTo)}>← Back</button>

        {/* Profile header card */}
        <div className="card overflow-hidden mb-10">
          {/* Cover */}
          <div
            className="h-40"
            style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%)' }}
          />

          {/* Body */}
          <div className="flex items-start gap-8 px-8 pb-4 flex-wrap">
            {/* Avatar */}
            <div
              className="w-[110px] h-[110px] rounded-full overflow-hidden flex-shrink-0 -mt-[55px]"
              style={{ border: '5px solid var(--bg-card)', boxShadow: 'var(--shadow-md)' }}
            >
              {chef.avatar
                ? <img src={getImageUrl(chef.avatar)} alt={chef.name} className="w-full h-full object-cover" />
                : (
                  <div
                    className="w-full h-full flex items-center justify-center text-[2.5rem] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, var(--dark), #3d6070)' }}
                  >
                    {chef.name.charAt(0)}
                  </div>
                )
              }
            </div>

            {/* Info */}
            <div className="flex-1 pt-3">
              <h1 className="text-[1.8rem] mb-2">{chef.name}</h1>
              <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                {chef.specialty && <span className="badge badge-accent">{chef.specialty}</span>}
                {chef.location  && <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{chef.location}</span>}
              </div>
              <p className="text-[0.95rem] leading-[1.7] max-w-[600px] mb-4" style={{ color: 'var(--text-muted)' }}>
                {chef.bio || 'Passionate chef sharing amazing recipes with the world.'}
              </p>
              {/* Social links */}
              <div className="flex gap-2.5 flex-wrap">
                {chef.socialLinks?.instagram && (
                  <a href={chef.socialLinks.instagram} target="_blank" rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80"
                    style={{ background: '#fce4ec', color: '#c2185b' }}>
                    Instagram
                  </a>
                )}
                {chef.socialLinks?.twitter && (
                  <a href={chef.socialLinks.twitter} target="_blank" rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80"
                    style={{ background: '#e3f2fd', color: '#1565c0' }}>
                    Twitter
                  </a>
                )}
                {chef.socialLinks?.youtube && (
                  <a href={chef.socialLinks.youtube} target="_blank" rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80"
                    style={{ background: '#ffebee', color: '#c62828' }}>
                    YouTube
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Recipes section */}
          <div className="px-8 pb-8 mt-0">

            {/* ── Best Recipe spotlight ── */}
            {bestRecipe && (bestRecipe.likes?.length || 0) > 0 && (
              <div className="mb-8 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Best Recipe</h2>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(242,140,0,0.12)', color: 'var(--primary)' }}
                  >
                    Most liked
                  </span>
                </div>

                <Link
                  to={`/recipes/${bestRecipe._id}`}
                  className="flex gap-6 rounded-xl overflow-hidden transition-shadow duration-200 hover:shadow-md items-stretch flex-wrap"
                  style={{
                    background: 'var(--bg)',
                    border: '1.5px solid var(--border)',
                  }}
                >
                  {/* Image */}
                  <div className="w-[220px] min-h-[160px] flex-shrink-0 relative max-sm:w-full max-sm:h-[180px]">
                    {bestRecipe.image
                      ? <img src={getImageUrl(bestRecipe.image)} alt={bestRecipe.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #fdebd0, #f8d7b0)' }} />
                    }
                    {/* Like count badge */}
                    <span
                      className="absolute bottom-2.5 left-2.5 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full text-white"
                      style={{ background: '#e53935' }}
                    >
                      ❤ {bestRecipe.likes.length} {bestRecipe.likes.length === 1 ? 'like' : 'likes'}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-5 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`badge ${diffBadge(bestRecipe.difficulty)}`}>{bestRecipe.difficulty}</span>
                      <span className="badge badge-accent">{bestRecipe.category}</span>
                      <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{bestRecipe.cookingTime} min</span>
                    </div>
                    <h3 className="text-xl mb-2" style={{ color: 'var(--text)' }}>{bestRecipe.title}</h3>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
                      {bestRecipe.description.substring(0, 140)}...
                    </p>
                    <span
                      className="self-start text-xs font-semibold px-4 py-1.5 rounded-full transition-all duration-200"
                      style={{ background: 'var(--primary)', color: '#fff' }}
                    >
                      View Recipe →
                    </span>
                  </div>
                </Link>
              </div>
            )}

            {/* ── All Recipes grid ── */}
            <h2 className="section-title pt-2 mb-6">{chef.name.split(' ')[0]}'s Recipes</h2>
            {recipes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🍽</div>
                <h3>No recipes yet</h3>
                <p>This chef hasn't published any recipes yet.</p>
              </div>
            ) : (
              <div className="grid-3">
                {recipes.map((r) => (
                  <Link to={`/recipes/${r._id}`} key={r._id} className="card overflow-hidden flex flex-col">
                    <div className="relative h-[200px] overflow-hidden">
                      {r.image
                        ? <img src={getImageUrl(r.image)} alt={r.title} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                        : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #fdebd0, #f8d7b0)' }} />
                      }
                      <span className={`badge ${diffBadge(r.difficulty)} absolute top-3 left-3`}>{r.difficulty}</span>
                    </div>
                    <div className="p-5 flex-1">
                      <div className="flex items-center gap-2.5 mb-2">
                        <span className="badge badge-accent">{r.category}</span>
                        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{r.cookingTime} min</span>
                      </div>
                      <h3 className="text-base mb-1.5">{r.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        {r.description.substring(0, 80)}...
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChefProfile;
