import { appointments as appointmentsApi } from '../api';

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
              <tr key={a.id}>
                {staffView && <td><strong>{a.patient_name}</strong></td>}
                <td>{a.appointment_date}</td>
                <td>{a.start_time} – {a.end_time}</td>
                <td><span className={`badge badge-${a.status === 'scheduled' ? 'scheduled' : 'cancelled'}`}>{a.status}</span></td>
                {patientView && (
                  <td>
                    <button className="btn btn-small btn-secondary" onClick={() => cancel(a.id)}>Cancel</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
