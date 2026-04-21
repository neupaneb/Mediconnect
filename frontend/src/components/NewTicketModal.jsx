import { useState } from 'react';
import { tickets as ticketsApi, aiScheduling as aiSchedulingApi, appointments as appointmentsApi } from '../api';

const CATEGORIES = {
  appointment_request: 'Appointment Request',
  billing_issue: 'Billing Issue',
  prescription_request: 'Prescription Request',
  general_inquiry: 'General Inquiry',
};

const DEPARTMENTS = ['Scheduling', 'Billing', 'Pharmacy', 'Laboratory', 'Primary Care'];
const PRIORITIES = ['routine', 'priority', 'urgent'];

export default function NewTicketModal({ onClose, onCreated }) {
  const [aiMessage, setAiMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general_inquiry');
  const [department, setDepartment] = useState('Primary Care');
  const [priority, setPriority] = useState('routine');
  const [content, setContent] = useState('');
  const [aiProvider, setAiProvider] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestedSlots, setSuggestedSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAiAssist = async () => {
    if (!aiMessage.trim()) {
      setError('Add your AI request first so the assistant can draft the ticket.');
      return;
    }

    setAiLoading(true);
    setError('');
    try {
      const data = await ticketsApi.aiAssist({ subject, content: aiMessage });
      const suggestion = data.suggestion || {};
      setSubject(suggestion.subject || subject);
      setCategory(suggestion.category || category);
      setDepartment(suggestion.department || department);
      setPriority(suggestion.priority || priority);
      setContent(suggestion.content || aiMessage);
      setAiProvider(data.provider || '');

      const nextCategory = suggestion.category || category;
      if (nextCategory === 'appointment_request') {
        const scheduling = await aiSchedulingApi.recommend(aiMessage);
        setSuggestedSlots(scheduling.slots || []);
        setSelectedSlot((scheduling.slots || [])[0] || null);
      } else {
        setSuggestedSlots([]);
        setSelectedSlot(null);
      }
    } catch (err) {
      const msg = err.error || err.message || 'AI ticket assist is unavailable right now.';
      setError(msg);
      setAiProvider('');
      setSuggestedSlots([]);
      setSelectedSlot(null);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const ticket = await ticketsApi.create({ subject, category, department, priority, content });
      if (selectedSlot) {
        await appointmentsApi.create({
          appointment_date: selectedSlot.date,
          start_time: selectedSlot.start,
          duration_minutes: 30,
          notes: subject || 'Scheduled from AI support request',
          ticket_id: ticket.id,
          visit_type: 'primary_care',
          urgency: priority === 'urgent' ? 'urgent' : priority === 'priority' ? 'priority' : 'routine',
          symptom_summary: content,
          medications: '',
        });
      }
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
              <label>AI Request</label>
              <textarea
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                placeholder="Describe what you need in your own words. AI will draft the ticket and, for appointment requests, suggest booking times."
                rows={4}
              />
            </div>
            <div style={{ marginTop: '-0.5rem', marginBottom: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={handleAiAssist} disabled={aiLoading}>
                {aiLoading ? 'Analyzing...' : 'Analyze with AI'}
              </button>
            </div>
            <p className="text-muted" style={{ marginTop: '-0.25rem', marginBottom: '1rem' }}>
              This field is separate from the final ticket message. It drafts the request automatically and can suggest appointment times when scheduling is mentioned.
            </p>
            {aiProvider && (
              <p className="text-muted" style={{ marginTop: '-0.75rem', marginBottom: '1rem' }}>
                Drafted with: {aiProvider === 'rules' ? 'local rules' : aiProvider}
              </p>
            )}

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
            <div className="form-row">
              <div className="form-group">
                <label>Department</label>
                <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                  {DEPARTMENTS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {PRIORITIES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
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
            {suggestedSlots.length > 0 && (
              <div className="form-group">
                <label>Suggested Appointment Times</label>
                <div className="slot-grid">
                  {suggestedSlots.map((slot, index) => (
                    <button
                      key={`${slot.date}-${slot.start}-${index}`}
                      type="button"
                      className={`slot-btn ${selectedSlot?.date === slot.date && selectedSlot?.start === slot.start ? 'selected' : ''}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot.date} {slot.start}
                    </button>
                  ))}
                </div>
                <p className="text-muted" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                  When you submit this request, the selected slot will also be booked automatically.
                </p>
              </div>
            )}
            {error && <p className="error">{error}</p>}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : selectedSlot ? 'Create Ticket and Book Appointment' : 'Submit Request'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
