import { useState } from 'react';
import { useLang } from '../context/LanguageContext';
import { convertArabicNumerals, formatNumber } from '../utils/numberToArabicWords';

function PropertyList({
  properties,
  onAdd,
  onEdit,
  onDelete,
  onPayment,
  onHistory,
  onReceipt,
  onBlankReceipt,
  canCreateProperty,
  canUpdateProperty,
  canDeleteProperty,
  canCreatePayment,
}) {
  const { t } = useLang();
  const [search, setSearch] = useState('');

  const filteredProperties = properties.filter(property => {
    if (!search.trim()) return true;
    const searchLower = search.toLowerCase().trim();
    const unitMatch = property.unit?.toLowerCase().includes(searchLower);
    const renterMatch = property.renterName?.toLowerCase().includes(searchLower);
    return unitMatch || renterMatch;
  });

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'apartment' ? -1 : 1;
    }
    const unitA = parseInt(convertArabicNumerals(a.unit)) || 0;
    const unitB = parseInt(convertArabicNumerals(b.unit)) || 0;
    if (unitA !== unitB) {
      return unitA - unitB;
    }
    return a.unit.localeCompare(b.unit);
  });

  return (
    <div>
      <div className="section-header">
        <h2>{t('properties')}</h2>
        {canCreateProperty && (
          <button className="btn btn-primary" onClick={onAdd}>
            {t('addProperty')}
          </button>
        )}
      </div>

      {properties.length > 0 && (
        <div className="search-box" style={{ marginBottom: '15px', maxWidth: '350px' }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder={t('searchProperties')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {properties.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            {t('noProperties')}
          </div>
        </div>
      ) : (
        <div className="property-list">
          {sortedProperties.map(property => (
            <div key={property._id} className="property-item">
              <div className="property-info">
                <div>
                  <span className={`property-type ${property.type}`}>
                    {property.type === 'apartment' ? t('apartment') : t('store')}
                  </span>
                  <strong>{property.unit}</strong>
                  <span className={`payment-type ${property.paymentType}`}>
                    {t(property.paymentType)}
                  </span>
                </div>
                <div className="property-details">
                  {property.renterName ? (
                    <>{t('renter')}: {property.renterName}</>
                  ) : (
                    <em>{t('noRenter')}</em>
                  )}
                  {property.paymentType === 'fixed' && property.fixedRent > 0 && (
                    <> | {t('fixedRent')}: {formatNumber(property.fixedRent)}/{t('month')}</>
                  )}
                </div>
              </div>
              <div className="card-actions">
                {canCreatePayment && property.paymentType !== 'blocked' && (
                  <button className="btn btn-primary btn-small" onClick={() => onPayment(property)}>
                    {t('pay')}
                  </button>
                )}
                <button className="btn btn-secondary btn-small" onClick={() => onHistory(property)}>
                  {t('history')}
                </button>
                <button className="btn btn-secondary btn-small" onClick={() => onReceipt(property)}>
                  {t('receipt')}
                </button>
                <button className="btn btn-secondary btn-small" onClick={() => onBlankReceipt(property)}>
                  {t('blankReceipt')}
                </button>
                {canUpdateProperty && (
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => {
                      if (window.confirm(`Confirm ${t('edit')}?`)) onEdit(property);
                    }}
                  >
                    {t('edit')}
                  </button>
                )}
                {canDeleteProperty && (
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => {
                      if (window.confirm(t('deleteProperty'))) onDelete(property._id);
                    }}
                  >
                    {t('delete')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PropertyList;
