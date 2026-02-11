import { useState, useEffect } from 'react';
import { useLang } from '../context/LanguageContext';
import * as api from '../api';

function AdminUserManagement({ onClose }) {
  const { t } = useLang();
  const [adminUsers, setAdminUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    groups: [],
    allowedBuildingIds: []
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [usersData, groupsData, buildingsData] = await Promise.all([
        api.getAdminUsers(),
        api.getGroups(),
        api.getBuildings()
      ]);
      setAdminUsers(Array.isArray(usersData) ? usersData : []);
      setGroups(Array.isArray(groupsData) ? groupsData : []);
      setBuildings(Array.isArray(buildingsData) ? buildingsData : []);
    } catch {
      setError('Failed to load data');
    }
    setLoading(false);
  }

  function getGroupName(userGroups) {
    if (!userGroups || userGroups.length === 0) return '-';
    return userGroups
      .map(g => typeof g === 'string' ? (groups.find(gr => gr._id === g)?.name || g) : g.name)
      .join(', ');
  }

  function isSuperAdminUser(user) {
    return (user?.groups || []).some(g => (typeof g === 'string' ? g : g.name) === 'SuperAdmin');
  }

  function isProtectedPrimaryAdmin(user) {
    const email = String(user?.email || '').toLowerCase();
    const username = String(user?.username || '').toLowerCase();
    return email === 'admin@rentals.local' || username === 'admin';
  }

  function openAddForm() {
    setEditingUser(null);
    setForm({ name: '', email: '', username: '', password: '', groups: [], allowedBuildingIds: [] });
    setShowForm(true);
    setError('');
  }

  function openEditForm(user) {
    setEditingUser(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      username: user.username || '',
      password: '',
      groups: (user.groups || []).map(g => typeof g === 'string' ? g : g._id),
      allowedBuildingIds: (user.allowedBuildingIds || []).map(b => typeof b === 'string' ? b : b._id)
    });
    setShowForm(true);
    setError('');
  }

  function cancelForm() {
    setShowForm(false);
    setEditingUser(null);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    try {
      if (editingUser) {
        const data = {
          name: form.name,
          email: form.email,
          groups: form.groups,
          allowedBuildingIds: form.allowedBuildingIds
        };
        if (form.password) data.password = form.password;
        await api.updateAdminUser(editingUser._id, data);
      } else {
        await api.createAdminUser(form);
      }
      setShowForm(false);
      setEditingUser(null);
      loadData();
    } catch (err) {
      setError(err.message || 'Operation failed');
    }
  }

  async function handleDelete(user) {
    if (isProtectedPrimaryAdmin(user)) {
      setError('Primary super admin cannot be deleted.');
      return;
    }

    if (!confirm(t('deleteAdminUser'))) return;
    try {
      await api.deleteAdminUser(user._id);
      loadData();
    } catch {
      setError('Delete failed');
    }
  }

  function handleGroupChange(groupId) {
    setForm(prev => {
      const has = prev.groups.includes(groupId);
      return {
        ...prev,
        groups: has
          ? prev.groups.filter(g => g !== groupId)
          : [...prev.groups, groupId]
      };
    });
  }

  function handleBuildingChange(buildingId) {
    setForm(prev => {
      const has = prev.allowedBuildingIds.includes(buildingId);
      return {
        ...prev,
        allowedBuildingIds: has
          ? prev.allowedBuildingIds.filter(id => id !== buildingId)
          : [...prev.allowedBuildingIds, buildingId]
      };
    });
  }

  const selectedGroupNames = form.groups
    .map(id => groups.find(g => g._id === id)?.name)
    .filter(Boolean);
  const formHasSuperAdmin = selectedGroupNames.includes('SuperAdmin');

  const isEditingSuperAdmin = isSuperAdminUser(editingUser) || formHasSuperAdmin;
  const isEditingProtectedAdmin = isProtectedPrimaryAdmin(editingUser);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="modal-header">
        <h3>{t('adminUsers')}</h3>
        <button className="btn btn-primary" onClick={openAddForm}>
          {t('addAdminUser')}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="card user-form">
          <h4>{editingUser ? t('editAdminUser') : t('addAdminUser')}</h4>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t('userName')}</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('email')}</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            {!editingUser && (
              <div className="form-group">
                <label>{t('username')}</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>
                {t('password')}
                {editingUser && (
                  <span className="form-hint"> ({t('passwordOptionalOnEdit')})</span>
                )}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required={!editingUser}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label>{t('role')}</label>
              <div className="role-checkboxes">
                {groups.map(group => (
                  <label key={group._id} className="role-checkbox">
                    <input
                      type="checkbox"
                      checked={form.groups.includes(group._id)}
                      onChange={() => handleGroupChange(group._id)}
                      disabled={isEditingProtectedAdmin}
                    />
                    <span>{group.name}</span>
                  </label>
                ))}
              </div>
              {groups.length === 0 && (
                <p className="no-data" style={{ padding: '10px 0' }}>{t('selectRole')}</p>
              )}
              {isEditingProtectedAdmin && (
                <p className="form-hint" style={{ marginTop: 8 }}>
                  Primary super admin role cannot be changed.
                </p>
              )}
            </div>

            {!isEditingSuperAdmin && (
            <div className="form-group">
              <label>Building Access</label>
              <div className="role-checkboxes">
                {buildings.map(building => (
                  <label key={building._id} className="role-checkbox">
                    <input
                      type="checkbox"
                      checked={form.allowedBuildingIds.includes(building._id)}
                      onChange={() => handleBuildingChange(building._id)}
                    />
                    <span>{building.number}{building.address ? ` - ${building.address}` : ''}</span>
                  </label>
                ))}
              </div>
              {buildings.length === 0 && (
                <p className="no-data" style={{ padding: '10px 0' }}>No buildings available</p>
              )}
            </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingUser ? t('update') : t('create')}
              </button>
              <button type="button" className="btn btn-secondary" onClick={cancelForm}>
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="users-list">
        {adminUsers.length === 0 ? (
          <div className="no-data">{t('noUsers')}</div>
        ) : (
          adminUsers.map(user => (
            <div key={user._id} className="card user-card">
              <div className="user-header">
                <div className="user-info">
                  <strong>{user.name}</strong>
                  <span className="user-phone">{user.email}</span>
                  <span className="status-badge active">
                    {getGroupName(user.groups)}
                  </span>
                </div>
                <div className="user-actions">
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => openEditForm(user)}
                  >
                    {t('edit')}
                  </button>
                  {!isProtectedPrimaryAdmin(user) && (
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => handleDelete(user)}
                    >
                      {t('delete')}
                    </button>
                  )}
                </div>
              </div>
              <div className="user-notes">
                @{user.username}
                {user.allowedBuildingIds?.length ? ` • Buildings: ${user.allowedBuildingIds.map(b => typeof b === 'string' ? b : b.number).join(', ')}` : ' • Buildings: none'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminUserManagement;
