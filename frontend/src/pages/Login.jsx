import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const loginHeroImage =
  'https://ncimpact.sog.unc.edu/wp-content/uploads/sites/1111/2025/04/Healthcare-AdobeStock_270629805-wpv_1100x_center_center.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await login(email, password);
      navigate(data.user?.role === 'staff' ? '/staff' : '/');
    } catch (err) {
      setError(err.error || 'Login failed');
    }
  };

  return (
    <div className="auth-page auth-page--hero" style={{ '--auth-hero-image': `url("${loginHeroImage}")` }}>
      <div className="auth-page__overlay" />
      <div className="auth-page__inner">
        <div className="auth-brand auth-brand--overlay">
          <div className="auth-brand__content">
            <div className="auth-kicker">Digital Care Experience</div>
            <h1>MediConnect</h1>
            <p className="auth-lead">
              Secure patient access for appointments, lab results, and care team support in one calm, simple portal.
            </p>
          </div>
        </div>
        <div className="auth-form-wrap auth-form-wrap--floating">
          <div className="auth-form-content">
            <h2>Sign In</h2>
            <p className="subtitle">Access your patient portal</p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="you@example.com"
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
              {error && <p className="error">{error}</p>}
              <button type="submit" className="btn btn-primary btn-block">Sign In</button>
            </form>
            <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
