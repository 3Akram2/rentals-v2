import { useEffect, useState } from 'react';
import { useLang } from '../context/LanguageContext';
import * as api from '../api';

function AiDashboard() {
  const { t, lang, isRtl } = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [prompts, setPrompts] = useState([]);
  const [newPromptTitle, setNewPromptTitle] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');
  const [savingPrompt, setSavingPrompt] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [overview, promptsData] = await Promise.all([
        api.getAiDashboardOverview(),
        api.getAiPrompts()
      ]);
      setData(overview);
      setPrompts(promptsData || []);
    } catch (e) {
      setError(e.message || t('aiLoadDashboardFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePrompt() {
    if (!newPromptContent.trim()) return;
    setSavingPrompt(true);
    try {
      await api.createAiPrompt({
        title: newPromptTitle.trim() || undefined,
        content: newPromptContent.trim(),
      });
      setNewPromptTitle('');
      setNewPromptContent('');
      await load();
    } catch (e) {
      alert(e.message || t('aiCreatePromptFailed'));
    } finally {
      setSavingPrompt(false);
    }
  }

  async function handleActivatePrompt(id) {
    try {
      await api.activateAiPrompt(id);
      await load();
    } catch (e) {
      alert(e.message || t('aiActivatePromptFailed'));
    }
  }

  async function handleEditPrompt(item) {
    const nextTitle = window.prompt(t('aiPromptTitleLabel'), item.title || '');
    if (nextTitle === null) return;
    const nextContent = window.prompt(t('aiPromptContentLabel'), item.content || '');
    if (nextContent === null) return;

    try {
      await api.updateAiPrompt(item._id, {
        title: nextTitle,
        content: nextContent,
      });
      await load();
    } catch (e) {
      alert(e.message || t('aiUpdatePromptFailed'));
    }
  }

  async function handleDeletePrompt(item) {
    const ok = window.confirm(t('confirmDeletePrompt'));
    if (!ok) return;
    try {
      await api.deleteAiPrompt(item._id);
      await load();
    } catch (e) {
      alert(e.message || t('aiDeletePromptFailed'));
    }
  }

  if (loading) return <div className="card"><div className="loading-text">{t('aiLoadingDashboard')}</div></div>;
  if (error) return <div className="card"><div className="error">{error}</div></div>;

  const stats = data?.stats || {};
  const chats = data?.recentChats || [];

  return (
    <div className="ai-dashboard" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="card ai-overview-card">
        <div className="card-title">{t('aiMonitoringDashboard')}</div>
        <div className="stats ai-stats-grid">
          <div className="stat"><span className="stat-value">{stats.buildings || 0}</span> {t('buildings')}</div>
          <div className="stat"><span className="stat-value">{stats.units || 0}</span> {t('aiUnits')}</div>
          <div className="stat"><span className="stat-value">{stats.owners || 0}</span> {t('allOwners')}</div>
          <div className="stat"><span className="stat-value">{stats.loginUsers || 0}</span> {t('adminUsers')}</div>
          <div className="stat"><span className="stat-value">{stats.chats || 0}</span> {t('aiChats')}</div>
        </div>
      </div>

      <div className="card ai-prompts-card">
        <div className="card-header" style={{ marginBottom: 10 }}>
          <div className="card-title">{t('aiPromptVersions')}</div>
          <button className="btn btn-secondary btn-small" onClick={load}>{t('refreshData')}</button>
        </div>

        <div className="form-group" style={{ marginBottom: 12 }}>
          <input
            className="form-control"
            value={newPromptTitle}
            onChange={(e) => setNewPromptTitle(e.target.value)}
            placeholder={t('aiPromptTitleOptional')}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 12 }}>
          <textarea
            className="form-control"
            rows={4}
            value={newPromptContent}
            onChange={(e) => setNewPromptContent(e.target.value)}
            placeholder={t('aiWritePromptContent')}
          />
        </div>

        <button className="btn btn-primary" onClick={handleCreatePrompt} disabled={savingPrompt || !newPromptContent.trim()}>
          {savingPrompt ? t('aiSaving') : t('aiAddPrompt')}
        </button>

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {prompts.map((p) => (
            <div key={p._id} className="ai-prompt-card">
              <div className="ai-prompt-head">
                <div>
                  <strong>v{p.version}</strong> — {p.title || `${t('aiPrompt')} v${p.version}`}
                  {p.active && <span className="ai-active-tag">{t('active')}</span>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-secondary btn-small" onClick={() => handleEditPrompt(p)}>{t('edit')}</button>
                  {!p.active && (
                    <button className="btn btn-primary btn-small" onClick={() => handleActivatePrompt(p._id)}>{t('aiSetActive')}</button>
                  )}
                  <button className="btn btn-danger btn-small" onClick={() => handleDeletePrompt(p)}>{t('delete')}</button>
                </div>
              </div>
              <div className="ai-prompt-content">{p.content}</div>
            </div>
          ))}
          {prompts.length === 0 && <div className="no-data">{t('aiNoPromptsYet')}</div>}
        </div>
      </div>

      <div className="card ai-chats-card">
        <div className="card-header" style={{ marginBottom: 10 }}>
          <div className="card-title">{t('aiRecentChats')}</div>
          <button className="btn btn-secondary btn-small" onClick={load}>{t('refreshData')}</button>
        </div>

        {chats.length === 0 ? (
          <div className="no-data">{t('aiNoChatsYet')}</div>
        ) : (
          <div className="table-wrapper">
            <table className="table ai-table">
              <thead>
                <tr>
                  <th>{t('aiTime')}</th>
                  <th>{t('users')}</th>
                  <th>{t('buildings')}</th>
                  <th>{t('aiPrompt')}</th>
                  <th>{t('aiResponse')}</th>
                </tr>
              </thead>
              <tbody>
                {chats.map((chat) => (
                  <tr key={chat._id}>
                    <td data-label={t('aiTime')}>{new Date(chat.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}</td>
                    <td data-label={t('users')}>{chat.actorId?.name || chat.actorId?.email || chat.actorId?.username || t('aiUnknown')}</td>
                    <td data-label={t('buildings')}>{chat.buildingId?.number || '-'}{chat.buildingId?.address ? ` - ${chat.buildingId.address}` : ''}</td>
                    <td data-label={t('aiPrompt')} className="chat-cell">{chat.question}</td>
                    <td data-label={t('aiResponse')} className="chat-cell">{chat.answer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AiDashboard;
