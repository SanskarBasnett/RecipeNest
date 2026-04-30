import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API, { getImageUrl } from '../api/axios';

const ProfileForm = ({
  showSpecialty   = true,
  showSocialLinks = true,
  showBio         = true,
  showLocation    = true,
}) => {
  const { user, updateUser } = useAuth();

  const isChef  = showSpecialty;
  const isAdmin = !showBio && !showSpecialty;

  const ph = {
    name:     isChef  ? 'e.g. Marco Rossi' : isAdmin ? 'e.g. Admin Name' : 'e.g. John Smith',
    bio:      isChef  ? 'Tell food lovers about your cooking style and experience...' : 'Tell the community a little about yourself...',
    specialty:'e.g. Italian Cuisine, Pastry, BBQ...',
    location: isChef  ? 'e.g. Rome, Italy' : 'e.g. London, UK',
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

  const matchStatus = () => {
    if (!form.confirm) return null;
    if (form.newPass === form.confirm)
      return <span className="block text-xs font-semibold mt-1.5 text-green-700">✓ Passwords match</span>;
    return <span className="block text-xs font-semibold mt-1.5 text-red-600">✗ Passwords don't match</span>;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (form.newPass || form.confirm || form.current) {
      if (!form.current) { setError('Enter your current password to change it.'); return; }
      if (form.newPass.length < 6) { setError('New password must be at least 6 characters.'); return; }
      if (form.newPass !== form.confirm) { setError('Passwords do not match.'); return; }
    }

    setLoading(true);
    try {
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

      if (avatar) {
        const fd = new FormData();
        fd.append('avatar', avatar);
        const { data: ad } = await API.put('/chefs/avatar', fd);
        updateUser(ad);
        setAvatar(null);
      }

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
    <div className="card p-8 max-w-[700px]">
      <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text)' }}>Edit Profile</h2>

      {success && <div className="alert alert-success">{success}</div>}
      {error   && <div className="alert alert-error">{error}</div>}

      {/* Avatar row */}
      <div
        className="flex items-center gap-6 mb-6 p-5 rounded-xl"
        style={{ background: 'var(--bg)' }}
      >
        <div
          className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0"
          style={{ border: '3px solid var(--primary)' }}
        >
          {currentAvatar
            ? <img src={currentAvatar} alt="avatar" className="w-full h-full object-cover" />
            : (
              <div
                className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
              >
                {user.name.charAt(0)}
              </div>
            )
          }
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text)' }}>Profile Picture</h4>
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>JPG, PNG or WebP. Max 5MB.</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="text-xs"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Name + Specialty */}
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
            <textarea name="bio" value={form.bio} onChange={handleChange} rows={4} placeholder={ph.bio} />
          </div>
        )}

        {showSocialLinks && (
          <>
            <p
              className="text-xs uppercase tracking-widest font-semibold mt-6 mb-4 pb-2 border-b"
              style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', fontFamily: 'Inter, sans-serif' }}
            >
              Social Links
            </p>
            <div className="form-group">
              <label>Instagram URL</label>
              <input name="instagram" value={form.instagram} onChange={handleChange} placeholder="https://instagram.com/yourhandle" />
            </div>
            <div className="form-group">
              <label>Twitter URL</label>
              <input name="twitter" value={form.twitter} onChange={handleChange} placeholder="https://twitter.com/yourhandle" />
            </div>
            <div className="form-group">
              <label>YouTube URL</label>
              <input name="youtube" value={form.youtube} onChange={handleChange} placeholder="https://youtube.com/yourchannel" />
            </div>
          </>
        )}

        {/* Password section */}
        <p
          className="text-xs uppercase tracking-widest font-semibold mt-6 mb-4 pb-2 border-b"
          style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', fontFamily: 'Inter, sans-serif' }}
        >
          Change Password
        </p>
        <div className="form-row">
          <div className="form-group">
            <label>Current Password</label>
            <input type="password" name="current" placeholder={ph.current} value={form.current} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password" name="newPass" placeholder={ph.newPass}
              value={form.newPass} onChange={handleChange}
              minLength={form.newPass ? 6 : undefined}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Confirm New Password</label>
          <input type="password" name="confirm" placeholder={ph.confirm} value={form.confirm} onChange={handleChange} />
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
