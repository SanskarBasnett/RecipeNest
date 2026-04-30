import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import API, { getImageUrl } from '../api/axios';

const diffBadge = (d) => ({
  Easy:   'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Hard:   'bg-red-100 text-red-600',
}[d] || 'bg-gray-100 text-gray-600');

const UserProfile = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const location   = useLocation();
  const backTo     = location.state?.from || -1;

  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    API.get(`/admin/users/${id}`)
      .then(({ data }) => setUser(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load user'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (error)   return <div className="container page"><div className="alert alert-error">{error}</div></div>;
  if (!user)   return <div className="container page"><p>User not found.</p></div>;

  const joined = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const roleBadgeStyle = {
    user:  { background: '#f5f5f5', color: '#616161' },
    chef:  { background: '#fff3e0', color: '#e65100' },
    admin: { background: '#fce4ec', color: '#c2185b' },
  };

  const liked = user.likedRecipes || [];

  return (
    <div className="page">
      <div className="container">

        <button className="back-btn" onClick={() => navigate(backTo)}>← Back</button>

        {/* Profile card */}
        <div className="card overflow-hidden mb-8">
          {/* Cover */}
          <div
            className="h-[140px]"
            style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)' }}
          />

          {/* Body */}
          <div className="flex items-start gap-8 px-8 pb-6 flex-wrap">
            <div
              className="w-[100px] h-[100px] rounded-full overflow-hidden flex-shrink-0 -mt-[50px]"
              style={{ border: '4px solid var(--bg-card)', boxShadow: 'var(--shadow-md)' }}
            >
              {user.avatar
                ? <img src={getImageUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
                : (
                  <div
                    className="w-full h-full flex items-center justify-center text-[2.2rem] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, var(--dark), #5a3e28)' }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )
              }
            </div>

            <div className="flex-1 pt-3 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-[1.7rem]">{user.name}</h1>
                <span
                  className="text-[0.72rem] font-bold px-3 py-1 rounded-full capitalize"
                  style={roleBadgeStyle[user.role] || roleBadgeStyle.user}
                >
                  {user.role}
                </span>
              </div>
              <p className="text-sm mb-1.5" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
              {user.location && <p className="text-sm mb-1.5" style={{ color: 'var(--text-muted)' }}>{user.location}</p>}
              {user.bio && (
                <p className="text-[0.95rem] leading-[1.7] my-2.5 max-w-[600px]" style={{ color: 'var(--text-muted)' }}>
                  {user.bio}
                </p>
              )}
              <p className="text-xs mt-2" style={{ color: 'var(--text-light)' }}>Member since {joined}</p>
            </div>
          </div>

          {/* Extras (specialty / social) */}
          {(user.specialty || user.socialLinks?.instagram || user.socialLinks?.twitter || user.socialLinks?.youtube) && (
            <div className="flex flex-col gap-3.5 px-8 py-5 border-t" style={{ borderColor: 'var(--border)' }}>
              {user.specialty && (
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider min-w-[70px]" style={{ color: 'var(--text-muted)' }}>Specialty</span>
                  <span className="badge badge-accent">{user.specialty}</span>
                </div>
              )}
              {(user.socialLinks?.instagram || user.socialLinks?.twitter || user.socialLinks?.youtube) && (
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider min-w-[70px]" style={{ color: 'var(--text-muted)' }}>Social</span>
                  <div className="flex gap-2 flex-wrap">
                    {user.socialLinks?.instagram && (
                      <a href={user.socialLinks.instagram} target="_blank" rel="noreferrer" className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80" style={{ background: '#fce4ec', color: '#c2185b' }}>Instagram</a>
                    )}
                    {user.socialLinks?.twitter && (
                      <a href={user.socialLinks.twitter} target="_blank" rel="noreferrer" className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80" style={{ background: '#e3f2fd', color: '#1565c0' }}>Twitter</a>
                    )}
                    {user.socialLinks?.youtube && (
                      <a href={user.socialLinks.youtube} target="_blank" rel="noreferrer" className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80" style={{ background: '#ffebee', color: '#c62828' }}>YouTube</a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Favourite Recipes */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-2xl">Favourite Recipes</h2>
            {liked.length > 0 && (
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                style={{ background: '#e53935' }}
              >
                {liked.length}
              </span>
            )}
          </div>

          {liked.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">❤️</div>
              <h3>No favourites yet</h3>
              <p>This user hasn't liked any recipes yet.</p>
            </div>
          ) : (
            <div className="grid-3">
              {liked.map(recipe => (
                <Link
                  key={recipe._id}
                  to={`/recipes/${recipe._id}`}
                  state={{ from: location.pathname }}
                  className="card overflow-hidden flex flex-col"
                >
                  <div className="relative h-[190px] overflow-hidden">
                    {recipe.image
                      ? <img src={getImageUrl(recipe.image)} alt={recipe.title} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                      : <div className="w-full h-full flex items-center justify-center text-5xl" style={{ background: 'linear-gradient(135deg, #fdebd0, #f8d7b0)' }} />
                    }
                    <span className={`badge ${diffBadge(recipe.difficulty)} absolute top-3 left-3`}>
                      {recipe.difficulty}
                    </span>
                    {/* Liked indicator */}
                    <span
                      className="absolute top-2.5 right-2.5 flex items-center justify-center w-8 h-8 rounded-full text-sm"
                      style={{ background: '#e53935', color: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
                    >
                      ❤
                    </span>
                  </div>
                  <div className="p-5 flex-1">
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="badge badge-accent">{recipe.category}</span>
                      <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{recipe.cookingTime} min</span>
                    </div>
                    <h3 className="text-base mb-1.5">{recipe.title}</h3>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>
                      {recipe.description.substring(0, 80)}...
                    </p>
                    {recipe.chef && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <div
                          className="w-[22px] h-[22px] rounded-full overflow-hidden flex items-center justify-center text-white text-[0.65rem] font-bold flex-shrink-0"
                          style={{ background: 'var(--primary)' }}
                        >
                          {recipe.chef.avatar
                            ? <img src={getImageUrl(recipe.chef.avatar)} alt={recipe.chef.name} className="w-full h-full object-cover" />
                            : <span>{recipe.chef.name.charAt(0)}</span>
                          }
                        </div>
                        {recipe.chef.name}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default UserProfile;
