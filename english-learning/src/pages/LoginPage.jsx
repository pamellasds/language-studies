import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function LoginPage() {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const err = await login(username.trim(), password);
    if (err) setError(err);
    setLoading(false);
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">📖</span>
          <h1 className="login-title">Language Learning</h1>
          <p className="login-subtitle">English &amp; Spanish by Spaced Repetition</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="your username"
              autoFocus
              autoComplete="username"
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button className="btn btn-primary login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
