import { useLang } from '../context/LanguageContext';

function BuildingList({
  buildings,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  onReport,
  onOwnership,
  onDivision,
  canCreateBuilding,
  canUpdateBuilding,
  canDeleteBuilding,
  canReadReport,
  canManageOwnership,
}) {
  const { t } = useLang();

  return (
    <div>
      <div className="section-header">
        <h2>{t('buildings')}</h2>
        {canCreateBuilding && (
          <button className="btn btn-primary" onClick={onAdd}>
            {t('addBuilding')}
          </button>
        )}
      </div>

      {buildings.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            {t('noBuildings')}
          </div>
        </div>
      ) : (
        buildings.map(building => (
          <div key={building._id} className="card">
            <div className="card-header">
              <div style={{ cursor: 'pointer' }} onClick={() => onSelect(building)}>
                <div className="card-title">{t('buildingNumber')}: {building.number}</div>
                {building.address && <div className="card-subtitle">{building.address}</div>}
              </div>
              <div className="card-actions">
                <button className="btn btn-primary btn-small" onClick={() => onSelect(building)}>
                  {t('view')}
                </button>
                {canReadReport && (
                  <button className="btn btn-secondary btn-small" onClick={() => onReport(building)}>
                    {t('report')}
                  </button>
                )}
                {canReadReport && (
                  <button className="btn btn-secondary btn-small" onClick={() => onDivision(building)}>
                    {t('divisionReport')}
                  </button>
                )}
                {canManageOwnership && (
                  <button className="btn btn-secondary btn-small" onClick={() => onOwnership(building)}>
                    {t('ownership')}
                  </button>
                )}
                {canUpdateBuilding && (
                  <button className="btn btn-secondary btn-small" onClick={() => onEdit(building)}>
                    {t('edit')}
                  </button>
                )}
                {canDeleteBuilding && (
                  <button className="btn btn-danger btn-small" onClick={() => onDelete(building._id)}>
                    {t('delete')}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default BuildingList;
