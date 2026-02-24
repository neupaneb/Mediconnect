import { useState } from 'react';
import { tickets as ticketsApi } from '../api';

const CATEGORIES = {
  appointment_request: 'Appointment Request',
  billing_issue: 'Billing Issue',
  prescription_request: 'Prescription Request',
  general_inquiry: 'General Inquiry',
};

export default function NewTicketModal({ onClose, onCreated }) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general_inquiry');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await ticketsApi.create({ subject, category, content });
      onCreated?.();
      onClose();
    } catch (err) {
      const msg = err.error || err.message || 'Failed to create ticket. Is the backend running on port 5001?';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Support Request</h2>
          <button className="btn btn-secondary btn-small" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Request Type</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {Object.entries(CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="Brief description of your request"
              />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Please provide details to help us assist you..."
                rows={4}
              />
            </div>
            {error && <p className="error">{error}</p>}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
