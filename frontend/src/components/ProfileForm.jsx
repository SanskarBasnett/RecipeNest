import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API, { getImageUrl } from '../api/axios';
import './ProfileForm.css';

const ProfileForm = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name:      user.name || '',
    bio:       user.bio  || '',
    specialty: user.specialty || '',
    location:  user.location  || '',
    instagram: user.socialLinks?.instagram || '',
    twitter:   user.socialLinks?.twitter   || '',
    youtube:   user.socialLinks?.youtube   || '',
  });
  const [avatar, setAvatar]   = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const payload = {
        name: form.name, bio: form.bio,
        specialty: form.specialty, location: form.location,
        socialLinks: { instagram: form.instagram, twitter: form.twitter, youtube: form.youtube },
      };
      const { data } = await API.put('/chefs/profile', payload);
      updateUser(data);

      if (avatar) {
        const fd = new FormData();
        fd.append('avatar', avatar);
        const { data: ad } = await API.put('/chefs/avatar', fd);
        updateUser(ad);
      }
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const currentAvatar = preview || (user.avatar ? getImageUrl(user.avatar) : null);

  return (
    <div className="profile-form card">
      <div className="profile-form__header">
        <h2>👤 Edit Profile</h2>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error   && <div className="alert alert-error">{error}</div>}

      {/* Avatar row */}
      <div className="profile-form__avatar-row">
        <div className="profile-form__avatar">
          {currentAvatar
            ? <img src={currentAvatar} alt="avatar" />
            : <div className="profile-form__avatar-placeholder">{user.name.charAt(0)}</div>
          }
        </div>
        <div className="profile-form__avatar-info">
          <h4>Profile Picture</h4>
          <p>JPG, PNG or WebP. Max 5MB.</p>
          <input type="file" accept="image/*" onChange={handleAvatarChange} style={{marginTop:'0.5rem', fontSize:'0.82rem'}} />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Full Name</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Specialty</label>
            <input name="specialty" value={form.specialty} onChange={handleChange} placeholder="Italian Cuisine" />
          </div>
        </div>

        <div className="form-group">
          <label>Location</label>
          <input name="location" value={form.location} onChange={handleChange} placeholder="London, UK" />
        </div>

        <div className="form-group">
          <label>Bio</label>
          <textarea name="bio" value={form.bio} onChange={handleChange} rows={4}
            placeholder="Tell food lovers about yourself..." />
        </div>

        <p className="profile-form__section-title">Social Links</p>

        <div className="form-group">
          <label>📸 Instagram URL</label>
          <input name="instagram" value={form.instagram} onChange={handleChange} placeholder="https://instagram.com/yourhandle" />
        </div>
        <div className="form-group">
          <label>🐦 Twitter URL</label>
          <input name="twitter" value={form.twitter} onChange={handleChange} placeholder="https://twitter.com/yourhandle" />
        </div>
        <div className="form-group">
          <label>▶️ YouTube URL</label>
          <input name="youtube" value={form.youtube} onChange={handleChange} placeholder="https://youtube.com/yourchannel" />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};

export default ProfileForm;
