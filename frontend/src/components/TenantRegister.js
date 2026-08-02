import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../theme.css';
import { getBrandVars } from './brandTheme';

const API = 'http://127.0.0.1:8000/api';

function TenantRegister({ onLogin }) {
  const { tenantId } = useParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [tenantColor, setTenantColor] = useState(null);
  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    axios.get(`${API}/tenants/${tenantId}/info/`)
      .then(res => {
        setTenantName(res.data.name);
        setTenantColor(res.data.primary_color || null);
      })
      .catch(() => {
        setTenantName(tenantId);
        setTenantColor(null);
      });
  }, [tenantId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setPasswordError('');
    if (!validateEmail(email)) { setEmailError('Invalid email'); return; }
    setEmailError('');
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    try {
      const res = await axios.post(`${API}/tenants/${tenantId}/register/`, { name, email, password });
      onLogin(res.data.access, res.data.tenant, res.data.user_name, res.data.user_uuid);
      navigate(`/t/${tenantId}/groups`);
    } catch (err) {
      if (err.response) {
        setErrorMessage(err.response.data?.error || 'Registration failed.');
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
          <p className="lg-eyebrow">Join workspace</p>
          <h2 className="lg-title">Register for {tenantName}</h2>

          {errorMessage && <div className="lg-alert lg-alert--error">{errorMessage}</div>}

          <form className="lg-form" onSubmit={handleSubmit}>
            <div className="lg-field">
              <label className="lg-label">Your name</label>
              <input className="lg-input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
            </div>

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

            <div className="lg-field">
              <label className="lg-label">Confirm password</label>
              <input className="lg-input" type={showPassword ? 'text' : 'password'} placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              {passwordError && <div className="lg-alert lg-alert--error">{passwordError}</div>}
            </div>

            <button className="lg-btn lg-btn--primary lg-btn--full" type="submit">Register</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TenantRegister;