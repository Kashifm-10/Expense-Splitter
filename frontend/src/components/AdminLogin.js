import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../theme.css';

const API = 'http://127.0.0.1:8000/api';

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!validateEmail(email)) {
      setEmailError('Invalid email format');
      return;
    }
    setEmailError('');
    try {
      const res = await axios.post(`${API}/admin/login/`, { email, password });
      onLogin(res.data.access, res.data.user);
    } catch (err) {
      if (err.response) {
        setErrorMessage(err.response.data?.error || 'Invalid email or password.');
      } else if (err.request) {
        setErrorMessage('Network error. Please check your connection.');
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
    }
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <div className="lg-page">
      <div className="lg-shell lg-shell--narrow">
        <div className="lg-brandbar" />
        <div className="lg-card lg-card--ticket">
          <p className="lg-eyebrow">Admin console</p>
          <h2 className="lg-title">Sign in</h2>
          <p className="lg-subtitle">Manage your tenants and settings.</p>

          {errorMessage && <div className="lg-alert lg-alert--error">{errorMessage}</div>}

          <form className="lg-form" onSubmit={handleSubmit}>
            <div className="lg-field">
              <label className="lg-label">Email</label>
              <input
                className="lg-input"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                required
              />
              {emailError && <span className="lg-alert lg-alert--error">{emailError}</span>}
            </div>

            <div className="lg-field">
              <label className="lg-label">Password</label>
              <div className="lg-password-wrap">
                <input
                  className="lg-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <span className="lg-password-toggle" onClick={toggleShowPassword}>
                  {showPassword ? 'Hide' : 'Show'}
                </span>
              </div>
            </div>

            <button className="lg-btn lg-btn--primary lg-btn--full" type="submit">Login</button>
          </form>

          <p style={{ marginTop: 20, textAlign: 'center' }}>
            <button className="lg-link-btn" onClick={() => navigate('/create')}>Register a tenant</button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;