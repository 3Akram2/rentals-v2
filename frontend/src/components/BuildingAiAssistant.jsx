import { useEffect, useRef, useState } from 'react';
import * as api from '../api';

function BuildingAiAssistant({ building, visible, onClose }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!visible) return;
    setMessages([]);
    setQuestion('');
  }, [visible, building?._id]);

  async function handleAsk() {
    const trimmed = question.trim();
    if (!trimmed || !building?._id || loading) return;

    const nextUser = { role: 'user', text: trimmed };
    setMessages((prev) => [...prev, nextUser]);
    setQuestion('');
    setLoading(true);

    try {
      const result = await api.askBuildingAi(building._id, trimmed);
      setMessages((prev) => [...prev, { role: 'ai', text: result.answer || 'No response.' }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'ai', text: `Error: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  if (!visible || !building) return null;

  return (
    <div className="ai-assistant-overlay" onClick={onClose}>
      <div className="ai-assistant-panel" onClick={(e) => e.stopPropagation()}>
        <div className="ai-assistant-header">
          <div>
            <div className="ai-assistant-title">Ask Building AI</div>
            <div className="ai-assistant-subtitle">Building {building.number}{building.address ? ` - ${building.address}` : ''}</div>
          </div>
          <button className="btn btn-secondary btn-small" onClick={onClose}>Close</button>
        </div>

        <div className="ai-assistant-messages">
          {messages.length === 0 && (
            <div className="ai-assistant-empty">
              Ask about this building only. Example: who paid in {new Date().getFullYear()}?
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`ai-message ${msg.role}`}>
              <div className="ai-message-label">{msg.role === 'user' ? 'You' : 'AI'}</div>
              <div className="ai-message-text">{msg.text}</div>
            </div>
          ))}

          {loading && <div className="ai-message ai"><div className="ai-message-text">Thinking...</div></div>}
          <div ref={endRef} />
        </div>

        <div className="ai-assistant-input-row">
          <textarea
            className="form-control"
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about unit payments, renters, and who paid or didn't pay..."
          />
          <button className="btn btn-primary" onClick={handleAsk} disabled={loading || !question.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default BuildingAiAssistant;
