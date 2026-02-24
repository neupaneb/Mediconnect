import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    email: '', password: '', first_name: '', last_name: '', role: 'patient'
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await register(form);
      navigate(data.user?.role === 'staff' ? '/staff' : '/');
    } catch (err) {
      setError(err.error || 'Registration failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <h1>MediConnect</h1>
        <p>Create an account to access appointments, lab results, and submit support requests.</p>
        <div className="badges">
          <span className="badge-item">✓ Secure & Private</span>
          <span className="badge-item">✓ 24/7 Access</span>
        </div>
      </div>
      <div className="auth-form-wrap">
        <h2>Create Account</h2>
        <p className="subtitle">Register for the patient portal</p>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                required
                placeholder="Jane"
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                required
                placeholder="Doe"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              placeholder="jane@example.com"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
              placeholder="Min. 6 characters"
            />
          </div>
          <div className="form-group">
            <label>I am a</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="patient">Patient</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block">Create Account</button>
        </form>
        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
