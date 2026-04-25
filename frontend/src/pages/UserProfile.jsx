import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import API, { getImageUrl } from '../api/axios';
import './UserProfile.css';

const UserProfile = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const location   = useLocation();
  const backTo     = location.state?.from || -1;

  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

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

  return (
    <div className="uprofile page">
      <div className="container">

        <button className="back-btn" onClick={() => navigate(backTo)}>← Back</button>

        <div className="uprofile__card card">
          {/* Cover */}
          <div className="uprofile__cover" />

          <div className="uprofile__body">
            {/* Avatar */}
            <div className="uprofile__avatar">
              {user.avatar
                ? <img src={getImageUrl(user.avatar)} alt={user.name} />
                : <div className="uprofile__initials">{user.name.charAt(0).toUpperCase()}</div>
              }
            </div>

            <div className="uprofile__info">
              <div className="uprofile__name-row">
                <h1>{user.name}</h1>
                <span className={`uprofile__role-badge uprofile__role-badge--${user.role}`}>
                  {user.role}
                </span>
              </div>

              <p className="uprofile__email">✉️ {user.email}</p>

              {user.location && (
                <p className="uprofile__meta">📍 {user.location}</p>
              )}

              {user.bio && (
                <p className="uprofile__bio">{user.bio}</p>
              )}

              <p className="uprofile__joined">Member since {joined}</p>
            </div>
          </div>

          {/* Extra chef fields if applicable */}
          {(user.specialty || user.socialLinks?.instagram || user.socialLinks?.twitter || user.socialLinks?.youtube) && (
            <div className="uprofile__extras">
              {user.specialty && (
                <div className="uprofile__extra-row">
                  <span className="uprofile__extra-label">Specialty</span>
                  <span className="badge badge-accent">{user.specialty}</span>
                </div>
              )}
              {(user.socialLinks?.instagram || user.socialLinks?.twitter || user.socialLinks?.youtube) && (
                <div className="uprofile__extra-row">
                  <span className="uprofile__extra-label">Social</span>
                  <div className="uprofile__social">
                    {user.socialLinks?.instagram && (
                      <a href={user.socialLinks.instagram} target="_blank" rel="noreferrer" className="social-pill instagram">📸 Instagram</a>
                    )}
                    {user.socialLinks?.twitter && (
                      <a href={user.socialLinks.twitter} target="_blank" rel="noreferrer" className="social-pill twitter">🐦 Twitter</a>
                    )}
                    {user.socialLinks?.youtube && (
                      <a href={user.socialLinks.youtube} target="_blank" rel="noreferrer" className="social-pill youtube">▶️ YouTube</a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default UserProfile;
