import { useState, useEffect } from 'react';
import { useLang } from '../context/LanguageContext';
import * as api from '../api';

function MigrationReview({ onClose }) {
  const { t } = useLang();
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decisions, setDecisions] = useState({});
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);

  useEffect(() => {
    loadReviewData();
  }, []);

  async function loadReviewData() {
    setLoading(true);
    try {
      const res = await fetch('/api/migration/review');
      if (res.ok) {
        const data = await res.json();
        setReviewData(data);
        // Initialize decisions from existing data
        const initialDecisions = {};
        for (const item of data.needsReview || []) {
          if (item.decision) {
            initialDecisions[item.normalizedName] = item.decision;
          }
        }
        setDecisions(initialDecisions);
      }
    } catch (error) {
      console.error('Failed to load review data:', error);
    }
    setLoading(false);
  }

  function handleDecision(normalizedName, decision) {
    setDecisions(prev => ({
      ...prev,
      [normalizedName]: decision
    }));
  }

  async function handleExecuteMigration() {
    if (!confirm('Start migration? This will create users from the migration review.')) {
      return;
    }

    setMigrating(true);
    try {
      const res = await fetch('/api/migration/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisions })
      });

      const result = await res.json();
      setMigrationResult(result);
    } catch (error) {
      setMigrationResult({ error: error.message });
    }
    setMigrating(false);
  }

  const unresolvedCount = reviewData?.needsReview?.filter(
    item => !decisions[item.normalizedName]
  ).length || 0;

  if (loading) {
    return (
      <div className="migration-review">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (migrationResult) {
    return (
      <div className="migration-review">
        <div className="modal-header">
          <h3>{t('migrationReview')}</h3>
          <button className="btn btn-secondary" onClick={onClose}>{t('close')}</button>
        </div>

        <div className="migration-result">
          {migrationResult.error ? (
            <div className="error-message">
              <h4>Migration Failed</h4>
              <p>{migrationResult.error}</p>
            </div>
          ) : (
            <div className="success-message">
              <h4>{t('migrationComplete')}</h4>
              <p>Users created: {migrationResult.usersCreated?.length || 0}</p>
              {migrationResult.errors?.length > 0 && (
                <div className="migration-errors">
                  <p>Errors: {migrationResult.errors.length}</p>
                  <ul>
                    {migrationResult.errors.map((err, i) => (
                      <li key={i}>{err.name}: {err.error}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p>Next step: Run Phase 3 migration to link members to users.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!reviewData) {
    return (
      <div className="migration-review">
        <div className="modal-header">
          <h3>{t('migrationReview')}</h3>
          <button className="btn btn-secondary" onClick={onClose}>{t('close')}</button>
        </div>
        <div className="no-data">
          <p>No migration review data found.</p>
          <p>Run the migration script first:</p>
          <code>node backend/scripts/migrate-phase2-create-users.js</code>
        </div>
      </div>
    );
  }

  return (
    <div className="migration-review">
      <div className="modal-header">
        <h3>{t('migrationReview')}</h3>
        <button className="btn btn-secondary" onClick={onClose}>{t('close')}</button>
      </div>

      <div className="migration-summary card">
        <h4>{t('summary')}</h4>
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-value">{reviewData.summary?.totalUniqueNames || 0}</span>
            <span className="stat-label">Total Names</span>
          </div>
          <div className="stat">
            <span className="stat-value">{reviewData.summary?.autoMigrateCount || 0}</span>
            <span className="stat-label">{t('autoMigrate')}</span>
          </div>
          <div className="stat">
            <span className="stat-value">{reviewData.summary?.needsReviewCount || 0}</span>
            <span className="stat-label">{t('needsReview')}</span>
          </div>
        </div>
      </div>

      {reviewData.autoMigrate?.length > 0 && (
        <div className="migration-section">
          <h4>{t('autoMigrate')} ({reviewData.autoMigrate.length})</h4>
          <p className="section-desc">These members appear in only one building and will be auto-migrated.</p>
          <div className="auto-migrate-list">
            {reviewData.autoMigrate.map((item, i) => (
              <div key={i} className="migrate-item">
                <span className="member-name">{item.name}</span>
                <span className="member-details">
                  Building {item.building}, {item.groupName}, {item.kirats} {t('kirats')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {reviewData.needsReview?.length > 0 && (
        <div className="migration-section">
          <h4>{t('needsReview')} ({reviewData.needsReview.length})</h4>
          <p className="section-desc">These members appear in multiple buildings. Decide if they are the same person or different people.</p>

          <div className="needs-review-list">
            {reviewData.needsReview.map((item, i) => (
              <div key={i} className="review-item card">
                <div className="review-header">
                  <strong>{item.name}</strong>
                  <span className="occurrence-count">{item.occurrences.length} {t('occurrences')}</span>
                </div>

                <div className="occurrences">
                  {item.occurrences.map((occ, j) => (
                    <div key={j} className="occurrence">
                      <span className="building">Building {occ.buildingNumber}</span>
                      <span className="group">{occ.groupName}</span>
                      <span className="kirats">{occ.kirats} {t('kirats')}</span>
                    </div>
                  ))}
                </div>

                <div className="decision-buttons">
                  <button
                    className={`btn ${decisions[item.normalizedName] === 'same' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleDecision(item.normalizedName, 'same')}
                  >
                    {t('samePerson')}
                  </button>
                  <button
                    className={`btn ${decisions[item.normalizedName] === 'different' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleDecision(item.normalizedName, 'different')}
                  >
                    {t('differentPeople')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="migration-actions">
        <button
          className="btn btn-primary"
          onClick={handleExecuteMigration}
          disabled={migrating || unresolvedCount > 0}
        >
          {migrating ? t('loading') : t('createUsers')}
        </button>
        {unresolvedCount > 0 && (
          <span className="unresolved-warning">
            {unresolvedCount} items need decisions before migration
          </span>
        )}
      </div>
    </div>
  );
}

export default MigrationReview;
