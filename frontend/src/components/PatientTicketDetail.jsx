import { useState, useEffect } from 'react';
import { tickets as ticketsApi } from '../api';

export default function PatientTicketDetail({ ticketId, onClose, onUpdate }) {
  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => {
    ticketsApi.get(ticketId).then(setTicket).catch(console.error);
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

  if (!ticket) return <div className="loading">Loading...</div>;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            Request #{ticket.id}
          </div>
          <h2 style={{ margin: 0 }}>{ticket.subject}</h2>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Status: <span className={`badge badge-${ticket.status === 'Open' ? 'open' : ticket.status === 'Resolved' || ticket.status === 'Closed' ? 'resolved' : 'review'}`}>{ticket.status}</span>
            {' • '}{ticket.created_at && new Date(ticket.created_at).toLocaleString()}
          </div>
        </div>
        <button className="btn btn-secondary" onClick={onClose}>← Back</button>
      </div>

      <h3 style={{ marginBottom: '0.75rem' }}>Messages</h3>
      <div className="thread">
        {ticket.messages?.map((m) => (
          <div key={m.id} className="msg">
            <div className="msg-meta">{m.user_name} • {m.created_at && new Date(m.created_at).toLocaleString()}</div>
            <div>{m.content}</div>
          </div>
        ))}
      </div>

      {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Add a message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            style={{ width: '100%', minHeight: 100, marginBottom: '0.75rem', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 8 }}
          />
          <button className="btn btn-primary" onClick={sendMessage} disabled={loading}>
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      )}
    </div>
  );
}
