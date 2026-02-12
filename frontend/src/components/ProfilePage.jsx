import { useState, useRef } from 'react';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';

function ProfilePage() {
  const { t } = useLang();
  const { user, refreshUser } = useAuth();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const fileInputRef = useRef(null);

  function getGroupNames() {
    if (!user?.groups || user.groups.length === 0) return '-';
    return user.groups.map(g => typeof g === 'string' ? g : g.name).join(', ');
  }

  function resizeImage(file, maxSize = 300) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');
    setPhotoLoading(true);

    try {
      const base64 = await resizeImage(file);
      await api.updateMyProfile({ profileImage: base64 });
      await refreshUser();
      setSuccess(t('photoUpdated'));
    } catch (err) {
      setError(err.message || 'Failed to update photo');
    }
    setPhotoLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleRemovePhoto() {
    setError('');
    setSuccess('');
    setPhotoLoading(true);
    try {
      await api.updateMyProfile({ profileImage: '' });
      await refreshUser();
      setSuccess(t('photoRemoved'));
    } catch (err) {
      setError(err.message || 'Failed to remove photo');
    }
    setPhotoLoading(false);
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordForm.password !== passwordForm.confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      await api.changePassword({
        oldPassword: passwordForm.oldPassword,
        password: passwordForm.password
      });
      setSuccess(t('passwordChanged'));
      setPasswordForm({ oldPassword: '', password: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (err) {
      setError(err.message || 'Failed to change password');
    }
    setLoading(false);
  }

  if (!user) return null;

  return (
    <div className="profile-page">
      <div className="modal-header">
        <h3>{t('profile')}</h3>
      </div>

      <div className="card">
        <div className="profile-photo-section">
          <div className="profile-photo-container">
            {user.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="profile-photo" />
            ) : (
              <div className="profile-photo-placeholder">
                <span>{user.name?.charAt(0)?.toUpperCase() || '?'}</span>
              </div>
            )}
            {photoLoading && (
              <div className="profile-photo-loading">
                <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }}></div>
              </div>
            )}
          </div>
          <div className="profile-photo-actions">
            <button
              className="btn btn-primary btn-small"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoLoading}
            >
              {t('changePhoto')}
            </button>
            {user.profileImage && (
              <button
                className="btn btn-secondary btn-small"
                onClick={handleRemovePhoto}
                disabled={photoLoading}
              >
                {t('removePhoto')}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            style={{ display: 'none' }}
          />
        </div>

        <div className="profile-details">
          <div className="profile-detail-row">
            <span className="profile-label">{t('userName')}</span>
            <span className="profile-value">{user.name}</span>
          </div>
          <div className="profile-detail-row">
            <span className="profile-label">{t('email')}</span>
            <span className="profile-value">{user.email}</span>
          </div>
          <div className="profile-detail-row">
            <span className="profile-label">{t('username')}</span>
            <span className="profile-value">@{user.username}</span>
          </div>
          <div className="profile-detail-row">
            <span className="profile-label">{t('role')}</span>
            <span className="profile-value">
              <span className="status-badge active">{getGroupNames()}</span>
            </span>
          </div>
        </div>
      </div>

      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}

      {!showPasswordForm ? (
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowPasswordForm(true);
            setError('');
            setSuccess('');
          }}
          style={{ marginTop: '15px' }}
        >
          {t('changePassword')}
        </button>
      ) : (
        <div className="card" style={{ marginTop: '15px' }}>
          <h4 style={{ marginBottom: '15px', color: '#2c3e50' }}>{t('changePassword')}</h4>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>{t('oldPassword')}</label>
              <input
                type="password"
                value={passwordForm.oldPassword}
                onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="form-group">
              <label>{t('newPassword')}</label>
              <input
                type="password"
                value={passwordForm.password}
                onChange={e => setPasswordForm({ ...passwordForm, password: e.target.value })}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label>{t('confirmPassword')}</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? t('loading') : t('save')}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowPasswordForm(false);
                  setError('');
                }}
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
