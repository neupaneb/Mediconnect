import { useState } from 'react';
import { appointments as appointmentsApi, aiScheduling as aiApi } from '../api';

export default function BookAppointment({ onClose, onBooked }) {
  const [mode, setMode] = useState('ai');
  const [aiRequest, setAiRequest] = useState('');
  const [aiSlots, setAiSlots] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [manualDate, setManualDate] = useState('');
  const [manualSlots, setManualSlots] = useState({});
  const [manualLoading, setManualLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  const getAiSlots = async () => {
    if (!aiRequest.trim()) return;
    setAiLoading(true);
    setError('');
    try {
      const data = await aiApi.recommend(aiRequest);
      setAiSlots(data.slots || []);
      if (data.error && !data.slots?.length) setError(data.error);
    } catch (e) {
      setError(e.error || 'AI scheduling unavailable');
      setAiSlots([]);
    } finally {
      setAiLoading(false);
    }
  };

  const loadManualSlots = async () => {
    if (!manualDate) return;
    setManualLoading(true);
    try {
      const end = new Date();
      end.setDate(end.getDate() + 14);
      const endStr = end.toISOString().slice(0, 10);
      const data = await appointmentsApi.slots(manualDate, endStr);
      setManualSlots(data.slots || {});
    } catch (e) {
      setManualSlots({});
    } finally {
      setManualLoading(false);
    }
  };

  const confirmBooking = async () => {
    if (!selectedSlot || !selectedSlot.date || !selectedSlot.start) {
      setError('Select a time slot first');
      return;
    }
    setBooking(true);
    setError('');
    try {
      await appointmentsApi.create({
        appointment_date: selectedSlot.date,
        start_time: selectedSlot.start,
        duration_minutes: 30,
        notes,
      });
      onBooked?.();
      onClose();
    } catch (e) {
      setError(e.error || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const pickManualSlot = (date, slot) => {
    setSelectedSlot({ date, start: slot.start, end: slot.end });
    setManualDate(date);
  };

  const slotsForDate = manualSlots[manualDate] || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Book Appointment</h2>
          <button className="btn btn-secondary btn-small" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <button
              className={`btn ${mode === 'ai' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('ai')}
            >
              AI Assistant
            </button>
            <button
              className={`btn ${mode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('manual')}
            >
              Pick Slot
            </button>
          </div>

          {mode === 'ai' && (
            <>
              <div className="form-group">
                <label>Describe when you'd like an appointment</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    value={aiRequest}
                    onChange={(e) => setAiRequest(e.target.value)}
                    placeholder="e.g. next week after 2pm, or Friday morning"
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-primary" onClick={getAiSlots} disabled={aiLoading}>
                    {aiLoading ? 'Searching...' : 'Find Slots'}
                  </button>
                </div>
              </div>
              {error && <p className="error">{error}</p>}
              <div className="form-group">
                <label>Available slots</label>
                <div className="slot-grid">
                  {aiSlots.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`slot-btn ${selectedSlot?.date === s.date && selectedSlot?.start === s.start ? 'selected' : ''}`}
                      onClick={() => setSelectedSlot(s)}
                    >
                      {s.date} {s.start}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {mode === 'manual' && (
            <>
              <div className="form-group">
                <label>Select date</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    style={{ flex: 1, maxWidth: 200, padding: '0.65rem 0.9rem', border: '1px solid var(--border)', borderRadius: 8 }}
                  />
                  <button className="btn btn-primary" onClick={loadManualSlots} disabled={manualLoading || !manualDate}>
                    {manualLoading ? 'Loading...' : 'Load Slots'}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Available times</label>
                <div className="slot-grid">
                  {slotsForDate.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`slot-btn ${selectedSlot?.start === s.start ? 'selected' : ''}`}
                      onClick={() => pickManualSlot(manualDate, s)}
                    >
                      {s.start}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Notes (optional)</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason for visit..." />
          </div>

          {selectedSlot && (
            <button className="btn btn-primary btn-block" onClick={confirmBooking} disabled={booking}>
              {booking ? 'Booking...' : `Confirm: ${selectedSlot.date} at ${selectedSlot.start}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
