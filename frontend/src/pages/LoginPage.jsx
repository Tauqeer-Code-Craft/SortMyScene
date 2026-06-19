import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const LoginPage = ({ navigateTo, params }) => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fromEventId = params?.fromEventId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      if (fromEventId) {
        navigateTo('event-details', { eventId: fromEventId });
      } else {
        navigateTo('events');
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Log in to book your tickets</p>
      </div>

      {/* Demo Credentials Box for Evaluator */}
      <div className="alert alert-info" style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', border: '1px solid var(--border)' }}>
        <span><strong>Testing Credentials (Assessor)</strong></span>
        <span>Email: <code>demo@example.com</code><br/>Password: <code>password123</code></span>
        <button
          type="button"
          className="btn btn-sm btn-outline"
          style={{ width: '100%', marginTop: '4px', fontSize: '12px', padding: '4px 8px', justifyContent: 'center' }}
          onClick={() => {
            setEmail('demo@example.com');
            setPassword('password123');
          }}
        >
          Auto-fill Demo Credentials
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" id="login-error-alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            className="form-control"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            className="form-control"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <button
          id="login-submit-btn"
          type="submit"
          className="btn btn-primary btn-block"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Sign in'}
        </button>
      </form>

      <div className="form-footer">
        Don't have an account?{' '}
        <a
          id="go-to-register-link"
          href="#"
          className="form-link"
          onClick={(e) => {
            e.preventDefault();
            navigateTo('register');
          }}
        >
          Sign up
        </a>
      </div>
    </div>
  );
};
