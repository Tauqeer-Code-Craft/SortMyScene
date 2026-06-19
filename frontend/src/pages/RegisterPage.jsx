import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const RegisterPage = ({ navigateTo, params }) => {
  const { register } = useContext(AuthContext);
  const [name, setName] = useState('');
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
      await register(name, email, password);
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
        <h2 className="auth-title">Create an account</h2>
        <p className="auth-subtitle">Get started booking tickets instantly</p>
      </div>

      {error && (
        <div className="alert alert-danger" id="register-error-alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="register-name">
            Full name
          </label>
          <input
            id="register-name"
            type="text"
            className="form-control"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="register-email">
            Email address
          </label>
          <input
            id="register-email"
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
          <label className="form-label" htmlFor="register-password">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            className="form-control"
            placeholder="•••••••• (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={6}
          />
        </div>

        <button
          id="register-submit-btn"
          type="submit"
          className="btn btn-primary btn-block"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Sign up'}
        </button>
      </form>

      <div className="form-footer">
        Already have an account?{' '}
        <a
          id="go-to-login-link"
          href="#"
          className="form-link"
          onClick={(e) => {
            e.preventDefault();
            navigateTo('login');
          }}
        >
          Sign in
        </a>
      </div>
    </div>
  );
};
