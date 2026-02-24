import { useState, useEffect } from 'react';
import { analytics as analyticsApi } from '../api';

const CATEGORIES = {
  appointment_request: 'Appointment',
  billing_issue: 'Billing',
  prescription_request: 'Prescription',
  general_inquiry: 'General',
};

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.dashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const exportTickets = () => analyticsApi.exportTickets().catch(alert);
  const exportAppointments = () => analyticsApi.exportAppointments().catch(alert);

  if (loading || !data) return <div className="loading">Loading analytics...</div>;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{data.total_tickets}</div>
          <div className="stat-label">Total Tickets</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.total_appointments}</div>
          <div className="stat-label">Scheduled Appointments</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.appointment_volume_7d}</div>
          <div className="stat-label">Appointments (7 days)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.avg_resolution_hours != null ? `${data.avg_resolution_hours}h` : '—'}</div>
          <div className="stat-label">Avg. Resolution Time</div>
        </div>
      </div>

      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Tickets by Category</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.entries(data.tickets_by_category || {}).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{CATEGORIES[k] || k}</span>
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Tickets by Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.entries(data.tickets_by_status || {}).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{k}</span>
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Export Data</h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={exportTickets}>Export Tickets (CSV)</button>
          <button className="btn btn-primary" onClick={exportAppointments}>Export Appointments (CSV)</button>
        </div>
      </div>
    </div>
  );
}
