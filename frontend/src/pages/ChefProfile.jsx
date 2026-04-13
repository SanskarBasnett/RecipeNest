import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API, { getImageUrl } from '../api/axios';
import './ChefProfile.css';

const ChefProfile = () => {
  const { id } = useParams();
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

  return (
    <div className="chef-profile page">
      <div className="container">

        {/* Profile header */}
        <div className="cp-header card">
          <div className="cp-header__cover" />
          <div className="cp-header__body">
            <div className="cp-header__avatar">
              {chef.avatar
                ? <img src={getImageUrl(chef.avatar)} alt={chef.name} />
                : <div className="cp-header__initials">{chef.name.charAt(0)}</div>
              }
            </div>
            <div className="cp-header__info">
              <h1>{chef.name}</h1>
              <div className="cp-header__tags">
                {chef.specialty && <span className="badge badge-accent">{chef.specialty}</span>}
                {chef.location  && <span className="cp-header__loc">📍 {chef.location}</span>}
              </div>
              <p className="cp-header__bio">{chef.bio || 'Passionate chef sharing amazing recipes with the world.'}</p>
              {/* Social links */}
              <div className="cp-header__social">
                {chef.socialLinks?.instagram && (
                  <a href={chef.socialLinks.instagram} target="_blank" rel="noreferrer" className="social-pill instagram">📸 Instagram</a>
                )}
                {chef.socialLinks?.twitter && (
                  <a href={chef.socialLinks.twitter} target="_blank" rel="noreferrer" className="social-pill twitter">🐦 Twitter</a>
                )}
                {chef.socialLinks?.youtube && (
                  <a href={chef.socialLinks.youtube} target="_blank" rel="noreferrer" className="social-pill youtube">▶️ YouTube</a>
                )}
              </div>
            </div>
            <div className="cp-header__stat-box">
              <div className="cp-header__stat">
                <strong>{recipes.length}</strong>
                <span>Recipes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recipes */}
        <div className="cp-recipes">
          <h2 className="section-title">{chef.name.split(' ')[0]}'s Recipes</h2>
          {recipes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🍽️</div>
              <h3>No recipes yet</h3>
              <p>This chef hasn't published any recipes yet.</p>
            </div>
          ) : (
            <div className="grid-3">
              {recipes.map((r) => (
                <Link to={`/recipes/${r._id}`} key={r._id} className="rcard card">
                  <div className="rcard__img">
                    {r.image
                      ? <img src={getImageUrl(r.image)} alt={r.title} />
                      : <div className="rcard__placeholder">🍽️</div>
                    }
                    <span className={`badge badge-${r.difficulty.toLowerCase()} rcard__badge`}>{r.difficulty}</span>
                  </div>
                  <div className="rcard__body">
                    <div className="rcard__meta">
                      <span className="badge badge-accent">{r.category}</span>
                      <span className="rcard__time">⏱ {r.cookingTime} min</span>
                    </div>
                    <h3 className="rcard__title">{r.title}</h3>
                    <p className="rcard__desc">{r.description.substring(0, 80)}...</p>
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

export default ChefProfile;
