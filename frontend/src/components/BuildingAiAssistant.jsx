import { useEffect, useMemo, useRef, useState } from 'react';
import * as api from '../api';

function BuildingAiAssistant({ building, visible, onClose }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const storageKey = useMemo(() => {
    if (!building?._id) return null;
    return `building-ai-chat:${building._id}`;
  }, [building?._id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!visible || !storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
          return;
        }
      }
    } catch {}
    setMessages([]);
  }, [visible, storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages.slice(-80)));
    } catch {}
  }, [messages, storageKey]);

  function mapHistoryForApi(items) {
    return items
      .filter((m) => m.role === 'user' || m.role === 'ai')
      .slice(-12)
      .map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', text: m.text }));
  }

  async function animateAssistantText(messageId, fullText) {
    let idx = 0;
    const step = 7;
    while (idx < fullText.length) {
      idx = Math.min(fullText.length, idx + step);
      const partial = fullText.slice(0, idx);
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, text: partial } : m)));
      await new Promise((r) => setTimeout(r, 14));
    }
  }

  async function handleAsk() {
    const trimmed = question.trim();
    if (!trimmed || !building?._id || loading) return;

    const userMessage = {
      id: `u-${Date.now()}-${Math.random()}`,
      role: 'user',
      text: trimmed,
      ts: Date.now(),
    };

    const snapshot = [...messages, userMessage];
    setMessages(snapshot);
    setQuestion('');
    setLoading(true);

    const aiMessageId = `a-${Date.now()}-${Math.random()}`;
    setMessages((prev) => [...prev, { id: aiMessageId, role: 'ai', text: '', ts: Date.now() }]);

    try {
      const result = await api.askBuildingAi(building._id, trimmed, mapHistoryForApi(snapshot));
      const answerText = result.answer || 'No response.';
      await animateAssistantText(aiMessageId, answerText);
    } catch (error) {
      setMessages((prev) => prev.map((m) => (m.id === aiMessageId ? { ...m, text: `Error: ${error.message}` } : m)));
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setMessages([]);
    if (storageKey) localStorage.removeItem(storageKey);
  }

  if (!visible || !building) return null;

  return (
    <div className="ai-assistant-overlay" onClick={onClose}>
      <div className="ai-assistant-panel" onClick={(e) => e.stopPropagation()}>
        <div className="ai-assistant-header">
          <div>
            <div className="ai-assistant-title">Building Copilot</div>
            <div className="ai-assistant-subtitle">Building {building.number}{building.address ? ` • ${building.address}` : ''}</div>
          </div>
          <div className="ai-assistant-head-actions">
            <button className="btn btn-secondary btn-small" onClick={handleClear}>Clear Chat</button>
            <button className="btn btn-secondary btn-icon" onClick={onClose} aria-label="Dismiss chat" title="Dismiss chat">✕</button>
          </div>
        </div>

        <div className="ai-assistant-messages">
          {messages.length === 0 && (
            <div className="ai-assistant-empty">
              Ask about units, renters, and payment records for current + previous year.
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`ai-message ${msg.role}`}>
              <div className="ai-message-text">{msg.text}</div>
            </div>
          ))}

          {loading && <div className="ai-typing">AI is typing…</div>}
          <div ref={endRef} />
        </div>

        <div className="ai-assistant-input-row">
          <textarea
            className="form-control"
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Who did not pay in 2026? How much did unit 4 pay?"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAsk();
              }
            }}
          />
          <button className="btn btn-primary" onClick={handleAsk} disabled={loading || !question.trim()}>
            {loading ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BuildingAiAssistant;
