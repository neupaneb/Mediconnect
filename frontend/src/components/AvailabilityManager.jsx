import { useEffect, useState } from 'react';
import { availability as availabilityApi } from '../api';

const DAYS = [
  ['0', 'Monday'],
  ['1', 'Tuesday'],
  ['2', 'Wednesday'],
  ['3', 'Thursday'],
  ['4', 'Friday'],
  ['5', 'Saturday'],
  ['6', 'Sunday'],
];

function formatDayLabel(dayOfWeek) {
  return DAYS.find(([value]) => Number(value) === Number(dayOfWeek))?.[1] || 'Unknown';
}

export default function AvailabilityManager({ onChanged }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    day_of_week: '0',
    start_time: '09:00',
    end_time: '17:00',
    slot_duration_minutes: '30',
  });

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const data = await availabilityApi.list();
      setItems((data || []).sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)));
      setError('');
    } catch (err) {
      setError(err.error || 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailability();
  }, []);

  const addAvailability = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await availabilityApi.create({
        day_of_week: Number(form.day_of_week),
        start_time: form.start_time,
        end_time: form.end_time,
        slot_duration_minutes: Number(form.slot_duration_minutes),
      });
      await loadAvailability();
      onChanged?.();
    } catch (err) {
      setError(err.error || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const removeAvailability = async (id) => {
    setError('');
    try {
      await availabilityApi.delete(id);
      await loadAvailability();
      onChanged?.();
    } catch (err) {
      setError(err.error || 'Failed to delete availability');
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>Available Times</h3>
      </div>

      <form onSubmit={addAvailability}>
        <div className="form-row">
          <div className="form-group">
            <label>Day</label>
            <select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}>
              {DAYS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Start</label>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>End</label>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Slot Length</label>
            <select
              value={form.slot_duration_minutes}
              onChange={(e) => setForm({ ...form, slot_duration_minutes: e.target.value })}
            >
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
            </select>
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Add Time'}
        </button>
      </form>

      <div style={{ marginTop: '1rem' }}>
        {loading ? (
          <p className="text-muted">Loading available times...</p>
        ) : items.length === 0 ? (
          <p className="text-muted" style={{ marginBottom: 0 }}>
            No available times added yet.
          </p>
        ) : (
          <div className="availability-list">
            {items.map((item) => (
              <div className="availability-item" key={item.id}>
                <div>
                  <strong>{formatDayLabel(item.day_of_week)}</strong>
                  <div className="text-muted">
                    {item.start_time} - {item.end_time} • {item.slot_duration_minutes} min slots
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => removeAvailability(item.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
