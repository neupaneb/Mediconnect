export default function LabResultsList({ results }) {
  const byDate = {};
  (results || []).forEach((r) => {
    const d = r.performed_at || 'Unknown';
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(r);
  });
  const dates = Object.keys(byDate).sort().reverse();

  if (dates.length === 0) {
    return (
      <div className="ticket-empty">
        <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No lab results yet</p>
        <p className="text-muted">Your lab results will appear here once they are available.</p>
      </div>
    );
  }

  return (
    <div>
      {dates.map((d) => (
        <div className="card" key={d}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Results from {d}
          </h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Result</th>
                  <th>Unit</th>
                  <th>Reference Range</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {byDate[d].map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.test_type}</strong></td>
                    <td>{r.result_value ?? '—'}</td>
                    <td>{r.unit ?? '—'}</td>
                    <td>{r.reference_range ?? '—'}</td>
                    <td>{r.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
