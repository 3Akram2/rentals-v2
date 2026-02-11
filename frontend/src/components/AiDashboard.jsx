import { useEffect, useState } from 'react';
import * as api from '../api';

function AiDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAiDashboardOverview();
      setData(res);
    } catch (e) {
      setError(e.message || 'Failed to load AI dashboard');
    } finally {
      setLoading(false);
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
