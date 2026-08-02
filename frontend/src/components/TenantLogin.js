import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../theme.css';
import { getBrandVars } from './brandTheme';

const API = 'http://127.0.0.1:8000/api';

function TenantLogin({ onLogin }) {
  const { tenantId } = useParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantColor, setTenantColor] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    axios.get(`${API}/tenants/${tenantId}/info/`)
      .then(res => {
        setTenantName(res.data.name);
        setTenantColor(res.data.primary_color || null);
      })
      .catch(() => setTenantName(''));
  }, [tenantId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!validateEmail(email)) { setEmailError('Invalid email'); return; }
    setEmailError('');
    try {
      const res = await axios.post(`${API}/t/${tenantId}/login/`, { email, password });
      onLogin(res.data.access, res.data.tenant, res.data.user_name, res.data.user_uuid);
      navigate(`/t/${tenantId}/groups`);
    } catch (err) {
      if (err.response) {
        setErrorMessage(err.response.data?.error || 'Invalid email or password.');
      } else if (err.request) {
        setErrorMessage('Network error.');
      } else {
        setErrorMessage('Unexpected error.');
      }
    }
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <div className="lg-page" style={getBrandVars(tenantColor)}>
      <div className="lg-shell lg-shell--narrow">
        <div className="lg-brandbar" />
        <div className="lg-card lg-card--ticket">
          <p className="lg-eyebrow">Tenant login</p>
          <h2 className="lg-title">{tenantName ? tenantName : 'Sign in'}</h2>
          <p className="lg-subtitle">Split bills and settle up with your group.</p>

          {errorMessage && <div className="lg-alert lg-alert--error">{errorMessage}</div>}

          <form className="lg-form" onSubmit={handleSubmit}>
            <div className="lg-field">
              <label className="lg-label">Email</label>
              <input className="lg-input" type="email" placeholder="you@example.com" value={email} onChange={e => { setEmail(e.target.value); setEmailError(''); }} required />
              {emailError && <span className="lg-alert lg-alert--error">{emailError}</span>}
            </div>

            <div className="lg-field">
              <label className="lg-label">Password</label>
              <div className="lg-password-wrap">
                <input className="lg-input" type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                <span className="lg-password-toggle" onClick={toggleShowPassword}>{showPassword ? 'Hide' : 'Show'}</span>
              </div>
            </div>

            <button className="lg-btn lg-btn--primary lg-btn--full" type="submit">Login</button>
          </form>

          <p style={{ marginTop: 20, textAlign: 'center' }}>
            <button className="lg-link-btn" onClick={() => navigate(`/t/${tenantId}/register`)}>Register</button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default TenantLogin;