import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API, { getImageUrl } from '../api/axios';
import './ProfileForm.css';

const ProfileForm = ({
  showSpecialty   = true,
  showSocialLinks = true,
  showBio         = true,
  showLocation    = true,
}) => {
  const { user, updateUser } = useAuth();

  // Derive role context from visible fields
  const isChef  = showSpecialty;
  const isAdmin = !showBio && !showSpecialty;

  // Role-appropriate placeholders
  const ph = {
    name:     isChef  ? 'e.g. Marco Rossi'
            : isAdmin ? 'e.g. Admin Name'
            :           'e.g. John Smith',
    bio:      isChef  ? 'Tell food lovers about your cooking style and experience...'
            :           'Tell the community a little about yourself...',
    specialty:'e.g. Italian Cuisine, Pastry, BBQ...',
    location: isChef  ? 'e.g. Rome, Italy'
            :           'e.g. London, UK',
    current:  'Enter your current password',
    newPass:  'At least 6 characters',
    confirm:  'Repeat new password',
  };

  const [form, setForm] = useState({
    name:      user.name || '',
    bio:       user.bio  || '',
    specialty: user.specialty || '',
    location:  user.location  || '',
    instagram: user.socialLinks?.instagram || '',
    twitter:   user.socialLinks?.twitter   || '',
    youtube:   user.socialLinks?.youtube   || '',
    current:   '',
    newPass:   '',
    confirm:   '',
  });

  const [avatar,  setAvatar]  = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  // Password match indicator
  const matchStatus = () => {
    if (!form.confirm) return null;
    if (form.newPass === form.confirm)
      return <span className="pw-match pw-match--ok">✓ Passwords match</span>;
    return <span className="pw-match pw-match--err">✗ Passwords don't match</span>;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    // Validate password fields only if the user typed something
    if (form.newPass || form.confirm || form.current) {
      if (!form.current) { setError('Enter your current password to change it.'); return; }
      if (form.newPass.length < 6) { setError('New password must be at least 6 characters.'); return; }
      if (form.newPass !== form.confirm) { setError('Passwords do not match.'); return; }
    }

    setLoading(true);
    try {
      // 1. Update profile info
      const payload = {
        name: form.name,
        ...(showBio         && { bio: form.bio }),
        ...(showSpecialty   && { specialty: form.specialty }),
        ...(showLocation    && { location: form.location }),
        ...(showSocialLinks && {
          socialLinks: {
            instagram: form.instagram,
            twitter:   form.twitter,
            youtube:   form.youtube,
          },
        }),
      };
      const { data } = await API.put('/chefs/profile', payload);
      updateUser(data);

      // 2. Upload avatar if a new file was selected
      if (avatar) {
        const fd = new FormData();
        fd.append('avatar', avatar);
        const { data: ad } = await API.put('/chefs/avatar', fd);
        updateUser(ad);
        setAvatar(null);
      }

      // 3. Change password if fields were filled
      if (form.newPass) {
        await API.put('/auth/change-password', {
          currentPassword: form.current,
          newPassword:     form.newPass,
        });
      }

      setSuccess('Profile saved successfully!');
      setForm(prev => ({ ...prev, current: '', newPass: '', confirm: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentAvatar = preview || (user.avatar ? getImageUrl(user.avatar) : null);

  return (
    <div className="profile-form card">
      <div className="profile-form__header">
        <h2>Edit Profile</h2>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error   && <div className="alert alert-error">{error}</div>}

      {/* Avatar */}
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
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ marginTop: '0.5rem', fontSize: '0.82rem' }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ── Profile fields ── */}
        <div className={showSpecialty ? 'form-row' : ''}>
          <div className="form-group">
            <label>Full Name</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder={ph.name} required />
          </div>
          {showSpecialty && (
            <div className="form-group">
              <label>Specialty</label>
              <input name="specialty" value={form.specialty} onChange={handleChange} placeholder={ph.specialty} />
            </div>
          )}
        </div>

        {showLocation && (
          <div className="form-group">
            <label>Location</label>
            <input name="location" value={form.location} onChange={handleChange} placeholder={ph.location} />
          </div>
        )}

        {showBio && (
          <div className="form-group">
            <label>Bio</label>
            <textarea name="bio" value={form.bio} onChange={handleChange} rows={4}
              placeholder={ph.bio} />
          </div>
        )}

        {showSocialLinks && (
          <>
            <p className="profile-form__section-title">Social Links</p>
            <div className="form-group">
              <label>📸 Instagram URL</label>
              <input name="instagram" value={form.instagram} onChange={handleChange}
                placeholder="https://instagram.com/yourhandle" />
            </div>
            <div className="form-group">
              <label>🐦 Twitter URL</label>
              <input name="twitter" value={form.twitter} onChange={handleChange}
                placeholder="https://twitter.com/yourhandle" />
            </div>
            <div className="form-group">
              <label>▶️ YouTube URL</label>
              <input name="youtube" value={form.youtube} onChange={handleChange}
                placeholder="https://youtube.com/yourchannel" />
            </div>
          </>
        )}

        {/* ── Password section ── */}
        <div className="form-row">
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              name="current"
              placeholder={ph.current}
              value={form.current}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              name="newPass"
              placeholder={ph.newPass}
              value={form.newPass}
              onChange={handleChange}
              minLength={form.newPass ? 6 : undefined}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Confirm New Password</label>
          <input
            type="password"
            name="confirm"
            placeholder={ph.confirm}
            value={form.confirm}
            onChange={handleChange}
          />
          {matchStatus()}
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default ProfileForm;
