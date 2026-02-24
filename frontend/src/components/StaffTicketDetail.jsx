import { useState, useEffect } from 'react';
import { tickets as ticketsApi } from '../api';

const STATUSES = ['Open', 'In Review', 'Waiting on Patient', 'Resolved', 'Closed'];

export default function StaffTicketDetail({ ticketId, onClose, onUpdate }) {
  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => {
    ticketsApi.get(ticketId).then((t) => {
      setTicket(t);
      setStatus(t.status);
    }).catch(console.error);
  };

  useEffect(load, [ticketId]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      await ticketsApi.addMessage(ticketId, message);
      setMessage('');
      load();
      onUpdate?.();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async () => {
    if (status === ticket.status) return;
    setLoading(true);
    try {
      await ticketsApi.update(ticketId, { status });
      load();
      onUpdate?.();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!ticket) return <div className="loading">Loading ticket...</div>;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            Ticket #{ticket.id} • Patient: {ticket.patient_name}
          </div>
          <h2 style={{ margin: 0 }}>{ticket.subject}</h2>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {ticket.category} • Opened {ticket.created_at && new Date(ticket.created_at).toLocaleString()}
          </div>
        </div>
        <button className="btn btn-secondary" onClick={onClose}>← Back to Queue</button>
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ padding: '0.5rem 0.9rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--card)', color: 'var(--text)', minWidth: 180 }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={updateStatus} disabled={loading}>
          Update Status
        </button>
      </div>

      <h3 style={{ marginBottom: '0.75rem' }}>Conversation</h3>
      <div className="thread">
        {ticket.messages?.length === 0 && (
          <p className="text-muted">No messages yet. Start the conversation below.</p>
        )}
        {ticket.messages?.map((m) => (
          <div key={m.id} className={`msg ${m.user_name?.includes('Staff') ? 'msg-staff' : ''}`}>
            <div className="msg-meta">{m.user_name} • {m.created_at && new Date(m.created_at).toLocaleString()}</div>
            <div>{m.content}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Reply</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your response..."
            style={{ width: '100%', minHeight: 100, marginBottom: '0.75rem', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 8 }}
        />
        <button className="btn btn-primary" onClick={sendMessage} disabled={loading}>
          {loading ? 'Sending...' : 'Send Reply'}
        </button>
      </div>
    </div>
  );
}
