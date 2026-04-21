import { useState } from 'react';
import { appointments as appointmentsApi, aiScheduling as aiApi } from '../api';

const VISIT_TYPES = [
  ['primary_care', 'Primary care'],
  ['follow_up', 'Follow-up'],
  ['urgent_visit', 'Urgent visit'],
  ['lab_review', 'Lab review'],
  ['vaccination', 'Vaccination'],
];

const URGENCY_LEVELS = [
  ['routine', 'Routine'],
  ['priority', 'Priority'],
  ['urgent', 'Urgent'],
];

export default function BookAppointment({ onClose, onBooked }) {
  const [mode, setMode] = useState('ai');
  const [aiRequest, setAiRequest] = useState('');
  const [aiSlots, setAiSlots] = useState([]);
  const [aiProvider, setAiProvider] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [manualDate, setManualDate] = useState('');
  const [manualSlots, setManualSlots] = useState({});
  const [manualLoading, setManualLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [visitType, setVisitType] = useState('primary_care');
  const [urgency, setUrgency] = useState('routine');
  const [symptomSummary, setSymptomSummary] = useState('');
  const [medications, setMedications] = useState('');
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  const getAiSlots = async () => {
    if (!aiRequest.trim()) return;
    setAiLoading(true);
    setError('');
    try {
      const data = await aiApi.recommend(aiRequest);
      setAiSlots(data.slots || []);
      setAiProvider(data.provider || '');
      if (data.error && !data.slots?.length) setError(data.error);
    } catch (e) {
      setError(e.error || 'AI scheduling unavailable');
      setAiSlots([]);
      setAiProvider('');
    } finally {
      setAiLoading(false);
    }
  };

  const loadManualSlots = async () => {
    if (!manualDate) return;
    setManualLoading(true);
    try {
      const end = new Date(`${manualDate}T00:00:00`);
      end.setDate(end.getDate() + 14);
      const endStr = end.toISOString().slice(0, 10);
      const data = await appointmentsApi.slots(manualDate, endStr);
      setManualSlots(data.slots || {});
    } catch {
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
        visit_type: visitType,
        urgency,
        symptom_summary: symptomSummary,
        medications,
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
          <div className="appointment-emergency-notice">
            If you are having a medical emergency, call 911 or seek emergency medical help immediately.
          </div>

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
              <p className="text-muted" style={{ marginTop: '-0.25rem', marginBottom: '1rem' }}>
                Works with Gemini or OpenAI API keys, plus a built-in local parser for requests like "Friday morning" or "after 2pm next week".
              </p>
              {aiProvider && (
                <p className="text-muted" style={{ marginTop: '-0.75rem', marginBottom: '1rem' }}>
                  Parsed with: {aiProvider === 'rules' ? 'local rules' : aiProvider}
                </p>
              )}
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

          <div className="card" style={{ background: 'var(--primary-light)', marginBottom: 0 }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Pre-Visit Intake</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Visit type</label>
                <select value={visitType} onChange={(e) => setVisitType(e.target.value)}>
                  {VISIT_TYPES.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Urgency</label>
                <select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
                  {URGENCY_LEVELS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Symptoms or reason for visit</label>
              <textarea
                rows={3}
                value={symptomSummary}
                onChange={(e) => setSymptomSummary(e.target.value)}
                placeholder="Describe symptoms, duration, or what you need to discuss."
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Current medications or care notes</label>
              <textarea
                rows={2}
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                placeholder="Optional: current medications, allergies, or prep notes."
              />
            </div>
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
