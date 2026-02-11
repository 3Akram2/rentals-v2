import { useEffect, useState } from 'react';
import * as api from '../api';

function AiDashboard() {
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
      setError(e.message || 'Failed to load AI dashboard');
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
      alert(e.message || 'Failed to create prompt');
    } finally {
      setSavingPrompt(false);
    }
  }

  async function handleActivatePrompt(id) {
    try {
      await api.activateAiPrompt(id);
      await load();
    } catch (e) {
      alert(e.message || 'Failed to activate prompt');
    }
  }

  async function handleEditPrompt(item) {
    const nextTitle = window.prompt('Prompt title:', item.title || '');
    if (nextTitle === null) return;
    const nextContent = window.prompt('Prompt content:', item.content || '');
    if (nextContent === null) return;

    try {
      await api.updateAiPrompt(item._id, {
        title: nextTitle,
        content: nextContent,
      });
      await load();
    } catch (e) {
      alert(e.message || 'Failed to update prompt');
    }
  }

  if (loading) return <div className="card"><div className="loading-text">Loading AI dashboard...</div></div>;
  if (error) return <div className="card"><div className="error">{error}</div></div>;

  const stats = data?.stats || {};
  const chats = data?.recentChats || [];

  return (
    <div className="ai-dashboard">
      <div className="card">
        <div className="card-title">AI Monitoring Dashboard</div>
        <div className="stats">
          <div className="stat"><span className="stat-value">{stats.buildings || 0}</span> Buildings</div>
          <div className="stat"><span className="stat-value">{stats.units || 0}</span> Units</div>
          <div className="stat"><span className="stat-value">{stats.owners || 0}</span> Owners</div>
          <div className="stat"><span className="stat-value">{stats.loginUsers || 0}</span> Login Users</div>
          <div className="stat"><span className="stat-value">{stats.chats || 0}</span> Chats</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ marginBottom: 10 }}>
          <div className="card-title">Prompt Versions</div>
          <button className="btn btn-secondary btn-small" onClick={load}>Refresh</button>
        </div>

        <div className="form-group" style={{ marginBottom: 12 }}>
          <input
            className="form-control"
            value={newPromptTitle}
            onChange={(e) => setNewPromptTitle(e.target.value)}
            placeholder="Prompt title (optional)"
          />
        </div>

        <div className="form-group" style={{ marginBottom: 12 }}>
          <textarea
            className="form-control"
            rows={4}
            value={newPromptContent}
            onChange={(e) => setNewPromptContent(e.target.value)}
            placeholder="Write prompt content..."
          />
        </div>

        <button className="btn btn-primary" onClick={handleCreatePrompt} disabled={savingPrompt || !newPromptContent.trim()}>
          {savingPrompt ? 'Saving...' : 'Add Prompt'}
        </button>

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {prompts.map((p) => (
            <div key={p._id} className="ai-prompt-card">
              <div className="ai-prompt-head">
                <div>
                  <strong>v{p.version}</strong> — {p.title || `Prompt v${p.version}`}
                  {p.active && <span className="ai-active-tag">Active</span>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-secondary btn-small" onClick={() => handleEditPrompt(p)}>Edit</button>
                  {!p.active && (
                    <button className="btn btn-primary btn-small" onClick={() => handleActivatePrompt(p._id)}>Set Active</button>
                  )}
                </div>
              </div>
              <div className="ai-prompt-content">{p.content}</div>
            </div>
          ))}
          {prompts.length === 0 && <div className="no-data">No prompts yet.</div>}
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ marginBottom: 10 }}>
          <div className="card-title">Recent AI Chats</div>
          <button className="btn btn-secondary btn-small" onClick={load}>Refresh</button>
        </div>

        {chats.length === 0 ? (
          <div className="no-data">No chats yet.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Building</th>
                  <th>Prompt</th>
                  <th>AI Response</th>
                </tr>
              </thead>
              <tbody>
                {chats.map((chat) => (
                  <tr key={chat._id}>
                    <td>{new Date(chat.createdAt).toLocaleString()}</td>
                    <td>{chat.actorId?.name || chat.actorId?.email || chat.actorId?.username || 'Unknown'}</td>
                    <td>{chat.buildingId?.number || '-'}{chat.buildingId?.address ? ` - ${chat.buildingId.address}` : ''}</td>
                    <td className="chat-cell">{chat.question}</td>
                    <td className="chat-cell">{chat.answer}</td>
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
