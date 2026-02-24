import { useState, useEffect } from 'react';
import { labResults as labApi, users as usersApi } from '../api';

export default function UploadLabResult({ onClose, onUploaded }) {
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [testType, setTestType] = useState('');
  const [resultValue, setResultValue] = useState('');
  const [unit, setUnit] = useState('');
  const [referenceRange, setReferenceRange] = useState('');
  const [notes, setNotes] = useState('');
  const [performedAt, setPerformedAt] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    usersApi.list('patient').then((data) => setPatients(data.users || [])).catch(() => setPatients([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientId || !testType) {
      setError('Patient and test type required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await labApi.create({
        patient_id: parseInt(patientId),
        test_type: testType,
        result_value: resultValue || undefined,
        unit: unit || undefined,
        reference_range: referenceRange || undefined,
        notes: notes || undefined,
        performed_at: performedAt,
      });
      onUploaded?.();
      if (onClose) onClose();
      else {
        setPatientId('');
        setTestType('');
        setResultValue('');
        setUnit('');
        setReferenceRange('');
        setNotes('');
      }
    } catch (err) {
      setError(err.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1.25rem' }}>Enter Lab Results</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Patient</label>
          <select value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
            <option value="">Select patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.email})</option>
            ))}
          </select>
          {patients.length === 0 && <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>No patients found. Patients must register first.</p>}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Test Type</label>
            <input value={testType} onChange={(e) => setTestType(e.target.value)} placeholder="e.g. CBC, Glucose" required />
          </div>
          <div className="form-group">
            <label>Result Value</label>
            <input value={resultValue} onChange={(e) => setResultValue(e.target.value)} placeholder="e.g. 120" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Unit</label>
            <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. mg/dL" />
          </div>
          <div className="form-group">
            <label>Reference Range</label>
            <input value={referenceRange} onChange={(e) => setReferenceRange(e.target.value)} placeholder="e.g. 70-100" />
          </div>
        </div>
        <div className="form-group">
          <label>Performed Date</label>
          <input type="date" value={performedAt} onChange={(e) => setPerformedAt(e.target.value)} style={{ maxWidth: 200 }} />
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Uploading...' : 'Save Lab Result'}
        </button>
      </form>
    </div>
  );
}
