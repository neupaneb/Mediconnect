import { tickets as ticketsApi } from '../api';

const CATEGORIES = {
  appointment_request: 'Appointment Request',
  billing_issue: 'Billing Issue',
  prescription_request: 'Prescription Request',
  general_inquiry: 'General Inquiry',
};

function statusClass(s) {
  if (s === 'Open') return 'badge-open';
  if (s === 'In Review') return 'badge-review';
  if (s === 'Waiting on Patient') return 'badge-waiting';
  if (s === 'Resolved') return 'badge-resolved';
  return 'badge-closed';
}

export default function TicketList({ tickets, onSelect, onUpdate, patientView, staffView }) {
  if (tickets.length === 0) {
    return (
      <div className="ticket-empty">
        <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No support requests yet</p>
        <p className="text-muted">Submit a request for appointments, billing, prescriptions, or general inquiries.</p>
      </div>
    );
  }

  return (
    <div className="ticket-list">
      {tickets.map((t) => (
        <div
          key={t.id}
          className="ticket-card"
          onClick={() => onSelect?.(t.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelect?.(t.id)}
        >
          <div className="ticket-id">#{t.id}</div>
          <div className="ticket-main">
            <div className="ticket-subject">{t.subject}</div>
            <div className="ticket-meta">
              {CATEGORIES[t.category] || t.category}
              {staffView && t.patient_name && ` • ${t.patient_name}`}
              {t.updated_at && ` • Updated ${new Date(t.updated_at).toLocaleDateString()}`}
            </div>
          </div>
          <div className="ticket-status-wrap">
            <span className={`badge ${statusClass(t.status)}`}>{t.status}</span>
          </div>
          <div className="ticket-action" style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600 }}>
            View →
          </div>
        </div>
      ))}
    </div>
  );
}
