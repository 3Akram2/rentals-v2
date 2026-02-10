import { useState, useEffect } from 'react';
import { useLang } from '../context/LanguageContext';
import NumberInput from './NumberInput';
import { convertArabicNumerals } from '../utils/numberToArabicWords';
import * as api from '../api';

function PropertyForm({ property, onSave, onCancel }) {
  const { t } = useLang();
  const [type, setType] = useState(property?.type || 'apartment');
  const [unit, setUnit] = useState(property?.unit || '');
  const [renterName, setRenterName] = useState(property?.renterName || '');
  const [renterId, setRenterId] = useState(property?.renterId || '');
  const [paymentType, setPaymentType] = useState(property?.paymentType || 'flexible');
  const [fixedRent, setFixedRent] = useState(property?.fixedRent || 0);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoadingUsers(true);
    const data = await api.getUsers({ status: 'active' });
    setUsers(data);
    setLoadingUsers(false);
  }

  function handleRenterSelect(userId) {
    setRenterId(userId);
    if (userId) {
      const user = users.find(u => u._id === userId);
      if (user) {
        setRenterName(user.name);
      }
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!unit.trim()) return;
    onSave({
      type,
      unit: unit.trim(),
      renterName: renterName.trim(),
      renterId: renterId || null,
      paymentType,
      fixedRent: paymentType === 'fixed' ? Number(fixedRent) : 0
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label>{t('type')}</label>
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="apartment">{t('apartment')}</option>
            <option value="store">{t('store')}</option>
          </select>
        </div>
        <div className="form-group">
          <label>{t('unitNumber')}</label>
          <input
            type="text"
            value={unit}
            onChange={e => setUnit(convertArabicNumerals(e.target.value))}
            placeholder={t('unitPlaceholder')}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>{t('linkToOwner')}</label>
        <select
          value={renterId}
          onChange={e => handleRenterSelect(e.target.value)}
          disabled={loadingUsers}
        >
          <option value="">{t('noOwnerLink')}</option>
          {users.map(user => (
            <option key={user._id} value={user._id}>
              {user.name} {user.buildingsOwned?.length > 0 && `(${t('owner')})`}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>{t('renterName')}</label>
        <input
          type="text"
          value={renterName}
          onChange={e => setRenterName(e.target.value)}
          placeholder={t('renterNamePlaceholder')}
        />
        {renterId && <small className="form-hint">{t('linkedToOwner')}</small>}
      </div>

      <div className="form-group">
        <label>{t('paymentType')}</label>
        <select value={paymentType} onChange={e => setPaymentType(e.target.value)}>
          <option value="flexible">{t('flexibleDesc')}</option>
          <option value="fixed">{t('fixedDesc')}</option>
          <option value="blocked">{t('blockedDesc')}</option>
        </select>
      </div>

      {paymentType === 'fixed' && (
        <div className="form-group">
          <label>{t('fixedMonthlyRent')}</label>
          <NumberInput
            value={fixedRent}
            onChange={e => setFixedRent(e.target.value)}
            placeholder="e.g., 500"
          />
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {property ? t('update') : t('create')}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          {t('cancel')}
        </button>
      </div>
    </form>
  );
}

export default PropertyForm;
