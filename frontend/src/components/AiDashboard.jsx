import { useEffect, useMemo, useState } from 'react';
import { useLang } from '../context/LanguageContext';
import * as api from '../api';

function AiDashboard() {
  const { t, lang, isRtl } = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [prompts, setPrompts] = useState([]);
  const [newPromptTitle, setNewPromptTitle] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [deletingPromptId, setDeletingPromptId] = useState('');
  const [activatingPromptId, setActivatingPromptId] = useState('');
  const [chatPage, setChatPage] = useState(1);

  const CHATS_PER_PAGE = 10;

  useEffect(() => {
    load(true);
  }, []);

  async function load(initial = false) {
    if (initial || !data) setLoading(true);
    else setRefreshing(true);

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
      setRefreshing(false);
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
      await load(false);
    } catch (e) {
      alert(e.message || t('aiCreatePromptFailed'));
    } finally {
      setSavingPrompt(false);
    }
  }

  async function handleActivatePrompt(id) {
    setActivatingPromptId(id);
    try {
      await api.activateAiPrompt(id);
      await load(false);
    } catch (e) {
      alert(e.message || t('aiActivatePromptFailed'));
    } finally {
      setActivatingPromptId('');
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
      await load(false);
    } catch (e) {
      alert(e.message || t('aiUpdatePromptFailed'));
    }
  }

  async function handleDeletePrompt(item) {
    const ok = window.confirm(t('confirmDeletePrompt'));
    if (!ok) return;
    setDeletingPromptId(item._id);
    try {
      await api.deleteAiPrompt(item._id);
      setPrompts((prev) => prev.filter((p) => p._id !== item._id));
      await load(false);
    } catch (e) {
      alert(e.message || t('aiDeletePromptFailed'));
    } finally {
      setDeletingPromptId('');
    }
  }

  const stats = data?.stats || {};
  const chats = data?.recentChats || [];
  const totalChatPages = Math.max(1, Math.ceil(chats.length / CHATS_PER_PAGE));

  const pagedChats = useMemo(() => {
    const start = (chatPage - 1) * CHATS_PER_PAGE;
    return chats.slice(start, start + CHATS_PER_PAGE);
  }, [chats, chatPage]);

  useEffect(() => {
    if (chatPage > totalChatPages) setChatPage(totalChatPages);
  }, [chatPage, totalChatPages]);

  if (loading) return <div className="card"><div className="loading-text">{t('aiLoadingDashboard')}</div></div>;
  if (error && !data) return <div className="card"><div className="error">{error}</div></div>;

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
          <button className="btn btn-secondary btn-small" onClick={() => load(false)} disabled={refreshing}>
            {refreshing ? t('loading') : t('refreshData')}
          </button>
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
                    <button className="btn btn-primary btn-small" onClick={() => handleActivatePrompt(p._id)} disabled={activatingPromptId === p._id}>
                      {activatingPromptId === p._id ? t('loading') : t('aiSetActive')}
                    </button>
                  )}
                  <button className="btn btn-danger btn-small" onClick={() => handleDeletePrompt(p)} disabled={deletingPromptId === p._id}>
                    {deletingPromptId === p._id ? t('loading') : t('delete')}
                  </button>
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
          <button className="btn btn-secondary btn-small" onClick={() => load(false)} disabled={refreshing}>
            {refreshing ? t('loading') : t('refreshData')}
          </button>
        </div>

        {chats.length === 0 ? (
          <div className="no-data">{t('aiNoChatsYet')}</div>
        ) : (
          <>
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
                  {pagedChats.map((chat) => (
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

            <div className="ai-pagination">
              <button className="btn btn-secondary btn-small" disabled={chatPage <= 1} onClick={() => setChatPage((p) => Math.max(1, p - 1))}>
                {t('previous')}
              </button>
              <span className="ai-pagination-text">{t('page')} {chatPage} / {totalChatPages}</span>
              <button className="btn btn-secondary btn-small" disabled={chatPage >= totalChatPages} onClick={() => setChatPage((p) => Math.min(totalChatPages, p + 1))}>
                {t('next')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AiDashboard;
