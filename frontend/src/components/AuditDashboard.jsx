import { useEffect, useMemo, useState } from 'react';
import { useLang } from '../context/LanguageContext';
import * as api from '../api';

function AuditDashboard() {
  const { t, lang, isRtl } = useLang();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function load(initial = false, targetPage = page) {
    if (initial) setLoading(true);
    else setRefreshing(true);

    setError('');
    try {
      const res = await api.getAuditEvents({ page: targetPage, pageSize });
      setEvents(res?.data || []);
      setTotal(Number(res?.total || 0));
      setPage(Number(res?.page || targetPage));
      setLastRefreshed(new Date());
    } catch (e) {
      setError(e.message || t('auditLoadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load(true, 1);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => load(false, page), 15000);
    return () => clearInterval(id);
  }, [autoRefresh, page]);

  const rows = useMemo(() => events || [], [events]);

  if (loading) return <div className="card"><div className="loading-text">{t('auditLoading')}</div></div>;

  return (
    <div className="ai-dashboard" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="card">
        <div className="card-header" style={{ marginBottom: 10 }}>
          <div className="card-title">{t('auditDashboard')}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
              <span>{t('autoRefresh')}</span>
            </label>
            <button className="btn btn-secondary btn-small" onClick={() => load(false, page)} disabled={refreshing}>
              {refreshing ? t('loading') : t('refreshData')}
            </button>
          </div>
        </div>

        <div className="card-subtitle" style={{ marginBottom: 12 }}>
          {t('lastRefreshed')}: {lastRefreshed ? lastRefreshed.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US') : '-'}
        </div>

        {error && <div className="error" style={{ marginBottom: 10 }}>{error}</div>}

        <div className="table-wrapper">
          <table className="table ai-table">
            <thead>
              <tr>
                <th>{t('aiTime')}</th>
                <th>{t('users')}</th>
                <th>{t('eventType')}</th>
                <th>{t('status')}</th>
                <th>{t('action')}</th>
                <th>{t('ipAddress')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="no-data">{t('noData') || 'No data'}</td>
                </tr>
              ) : rows.map((e) => (
                <tr key={e._id}>
                  <td>{new Date(e.ts || e.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}</td>
                  <td>{e.actor?.name || e.actor?.email || e.actor?.username || '-'}</td>
                  <td>{e.eventType || '-'}</td>
                  <td>{e.action?.status || '-'}</td>
                  <td>{e.action?.module ? `${e.action.module}.${e.action.operation}` : '-'}</td>
                  <td>{e.client?.ip || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ai-pagination">
          <button className="btn btn-secondary btn-small" disabled={page <= 1} onClick={() => load(false, Math.max(1, page - 1))}>{t('previous')}</button>
          <span className="ai-pagination-text">{t('page')} {page} / {totalPages}</span>
          <button className="btn btn-secondary btn-small" disabled={page >= totalPages} onClick={() => load(false, Math.min(totalPages, page + 1))}>{t('next')}</button>
        </div>
      </div>
    </div>
  );
}

export default AuditDashboard;
