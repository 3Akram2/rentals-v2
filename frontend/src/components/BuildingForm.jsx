import { useMemo, useState } from 'react';
import { useLang } from '../context/LanguageContext';

function BuildingForm({ building, adminUsers = [], onSave, onCancel }) {
  const { t } = useLang();
  const [number, setNumber] = useState(building?.number || '');
  const [address, setAddress] = useState(building?.address || '');
  const [moderatorAdminUserId, setModeratorAdminUserId] = useState(
    typeof building?.moderatorAdminUserId === 'string'
      ? building.moderatorAdminUserId
      : building?.moderatorAdminUserId?._id || ''
  );

  const moderatorOptions = useMemo(
    () => adminUsers.filter((u) => u?.username && u?.email),
    [adminUsers]
  );

  function handleSubmit(e) {
    e.preventDefault();
    if (!number.trim()) return;
    onSave({
      number: number.trim(),
      address: address.trim(),
      moderatorAdminUserId: moderatorAdminUserId || null,
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>{t('buildingNumber')}</label>
        <input
          type="text"
          value={number}
          onChange={e => setNumber(e.target.value)}
          placeholder={t('buildingNumberPlaceholder')}
          required
        />
      </div>
      <div className="form-group">
        <label>{t('address')}</label>
        <input
          type="text"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder={t('addressPlaceholder')}
        />
      </div>
      <div className="form-group">
        <label>{t('buildingModerator')}</label>
        <select
          value={moderatorAdminUserId}
          onChange={(e) => setModeratorAdminUserId(e.target.value)}
        >
          <option value="">{t('noModeratorAssigned')}</option>
          {moderatorOptions.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name || u.username} ({u.email})
            </option>
          ))}
        </select>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {building ? t('update') : t('create')}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          {t('cancel')}
        </button>
      </div>
    </form>
  );
}

export default BuildingForm;
