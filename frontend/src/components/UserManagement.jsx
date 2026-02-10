import { useState, useEffect } from 'react';
import { useLang } from '../context/LanguageContext';
import * as api from '../api';

function UserManagement({ onClose, onViewReport }) {
  const { t } = useLang();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', notes: '', status: 'active' });
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, [statusFilter]);

  async function loadUsers() {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    const data = await api.getUsers(params);
    setUsers(data);
    setLoading(false);
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    (user.phone && user.phone.includes(search))
  );

  function handleAdd() {
    setEditingUser('new');
    setFormData({ name: '', phone: '', notes: '', status: 'active' });
    setError('');
  }

  function handleEdit(user) {
    setEditingUser(user._id);
    setFormData({
      name: user.name,
      phone: user.phone || '',
      notes: user.notes || '',
      status: user.status || 'active'
    });
    setError('');
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      if (editingUser === 'new') {
        await api.createUser(formData);
      } else {
        await api.updateUser(editingUser, formData);
      }
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(userId) {
    if (!confirm(t('deleteUser'))) return;

    const result = await api.deleteUser(userId);
    if (result.error) {
      alert(t('userCannotDelete') + ': ' + result.error);
    } else {
      loadUsers();
    }
  }

  async function handleRefresh(userId) {
    await api.refreshUserData(userId);
    loadUsers();
  }

  function handleCancel() {
    setEditingUser(null);
    setError('');
  }

  return (
    <div className="user-management">
      <div className="modal-header">
        <h3>{t('users')}</h3>
        <button className="btn btn-secondary" onClick={onClose}>{t('close')}</button>
      </div>

      <div className="user-controls">
        <input
          type="text"
          placeholder={t('searchUsers')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">{t('userStatus')}: All</option>
          <option value="active">{t('active')}</option>
          <option value="inactive">{t('inactive')}</option>
        </select>
        <button className="btn btn-primary" onClick={handleAdd}>{t('addUser')}</button>
      </div>

      {editingUser && (
        <div className="user-form card">
          <h4>{editingUser === 'new' ? t('addUser') : t('editUser')}</h4>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>{t('userName')}</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('userName')}
            />
          </div>
          <div className="form-group">
            <label>{t('userPhone')}</label>
            <input
              type="text"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder={t('userPhone')}
            />
          </div>
          <div className="form-group">
            <label>{t('userNotes')}</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t('userNotes')}
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>{t('userStatus')}</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="active">{t('active')}</option>
              <option value="inactive">{t('inactive')}</option>
            </select>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleSave}>{t('save')}</button>
            <button className="btn btn-secondary" onClick={handleCancel}>{t('cancel')}</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <p className="no-data">{search ? 'No matching users' : t('noUsers')}</p>
      ) : (
        <div className="users-list">
          {filteredUsers.map(user => (
            <div key={user._id} className={`user-card card ${user.status === 'inactive' ? 'inactive' : ''}`}>
              <div className="user-header">
                <div className="user-info">
                  <strong>{user.name}</strong>
                  {user.phone && <span className="user-phone">{user.phone}</span>}
                  <span className={`status-badge ${user.status}`}>{t(user.status)}</span>
                </div>
                <div className="user-actions">
                  {onViewReport && (
                    <button className="btn btn-primary btn-small" onClick={() => onViewReport(user)}>
                      {t('userReport')}
                    </button>
                  )}
                  <button className="btn btn-secondary btn-small" onClick={() => handleRefresh(user._id)}>
                    {t('refreshData')}
                  </button>
                  <button className="btn btn-secondary btn-small" onClick={() => handleEdit(user)}>
                    {t('edit')}
                  </button>
                  <button className="btn btn-danger btn-small" onClick={() => handleDelete(user._id)}>
                    {t('delete')}
                  </button>
                </div>
              </div>
              {user.notes && <p className="user-notes">{user.notes}</p>}
              <div className="user-summary">
                {user.buildingsOwned && user.buildingsOwned.length > 0 && (
                  <div className="summary-section">
                    <span className="summary-label">{t('buildingsOwned')}:</span>
                    <div className="summary-items">
                      {user.buildingsOwned.map((b, i) => (
                        <span key={i} className="summary-tag">
                          {t('buildingNumber')} {b.buildingNumber} ({b.kirats} {t('kirats')})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {user.propertiesRented && user.propertiesRented.length > 0 && (
                  <div className="summary-section">
                    <span className="summary-label">{t('propertiesRented')}:</span>
                    <div className="summary-items">
                      {user.propertiesRented.map((p, i) => (
                        <span key={i} className="summary-tag rented">
                          {t('buildingNumber')} {p.buildingNumber} - {t('unit')} {p.unit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {user.buildingsOwned?.length > 0 && user.propertiesRented?.length > 0 && (
                  <span className="owner-renter-badge">{t('ownerAndRenter')}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserManagement;
