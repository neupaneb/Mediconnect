import { Fragment } from 'react';
import { appointments as appointmentsApi } from '../api';

const VISIT_TYPE_LABELS = {
  primary_care: 'Primary care',
  follow_up: 'Follow-up',
  urgent_visit: 'Urgent visit',
  lab_review: 'Lab review',
  vaccination: 'Vaccination',
};

export default function AppointmentList({ appointments, onUpdate, patientView, staffView }) {
  const cancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await appointmentsApi.cancel(id);
      onUpdate?.();
    } catch (e) {
      alert(e.error || 'Failed to cancel');
    }
  };

  const filtered = appointments.filter((a) => a.status === 'scheduled');

  if (filtered.length === 0) {
    return (
      <div className="ticket-empty">
        <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No appointments scheduled</p>
        <p className="text-muted">Book an appointment to get started.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {staffView && <th>Patient</th>}
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              {patientView && <th></th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <Fragment key={a.id}>
                <tr>
                  {staffView && <td><strong>{a.patient_name}</strong></td>}
                  <td>
                    <div>{a.appointment_date}</div>
                    {a.intake?.visit_type && (
                      <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                        {VISIT_TYPE_LABELS[a.intake.visit_type] || a.intake.visit_type}
                      </div>
                    )}
                  </td>
                  <td>{a.start_time} – {a.end_time}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
                      <span className={`badge badge-${a.status === 'scheduled' ? 'scheduled' : 'cancelled'}`}>{a.status}</span>
                      {a.intake?.urgency && (
                        <span className={`badge badge-urgency-${a.intake.urgency}`}>{a.intake.urgency}</span>
                      )}
                    </div>
                  </td>
                  {patientView && (
                    <td>
                      <button className="btn btn-small btn-secondary" onClick={() => cancel(a.id)}>Cancel</button>
                    </td>
                  )}
                </tr>
                {a.intake?.symptom_summary && (
                  <tr className="appointment-intake-row">
                    {staffView && <td></td>}
                    <td colSpan={staffView ? 3 : 2}>
                      <strong>Intake:</strong> {a.intake.symptom_summary}
                      {a.intake.medications ? ` | Medications/notes: ${a.intake.medications}` : ''}
                    </td>
                    {patientView && <td></td>}
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
