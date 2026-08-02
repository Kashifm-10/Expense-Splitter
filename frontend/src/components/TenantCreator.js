import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../theme.css';

const API = 'http://127.0.0.1:8000/api';

function TenantCreator() {
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setPasswordError('');
    setEmailError('');
    if (!validateEmail(email)) {
      setEmailError('Invalid email format');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    try {
      await axios.post(`${API}/tenants/create/`, {
        company_name: companyName,
        owner_name: ownerName,
        email,
        password,
        primary_color: primaryColor
      });
      navigate('/admin/login');
    } catch (err) {
      if (err.response) {
        setErrorMessage(err.response.data?.error || err.response.data?.email || 'Tenant creation failed.');
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
        <div className="lg-brandbar" style={{ background: primaryColor }} />
        <div className="lg-card lg-card--ticket">
          <p className="lg-eyebrow">New workspace</p>
          <h2 className="lg-title">Create a new tenant</h2>
          <p className="lg-subtitle">Set up a company workspace and its first admin.</p>

          {errorMessage && <div className="lg-alert lg-alert--error">{errorMessage}</div>}

          <form className="lg-form" onSubmit={handleSubmit}>
            <div className="lg-field">
              <label className="lg-label">Company name</label>
              <input className="lg-input" placeholder="Acme Inc." value={companyName} onChange={e => setCompanyName(e.target.value)} required />
            </div>

            <div className="lg-field">
              <label className="lg-label">Owner name</label>
              <input className="lg-input" placeholder="Your name" value={ownerName} onChange={e => setOwnerName(e.target.value)} required />
            </div>

            <div className="lg-field">
              <label className="lg-label">Email</label>
              <input className="lg-input" type="email" placeholder="you@company.com" value={email} onChange={e => { setEmail(e.target.value); setEmailError(''); }} required />
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

            <div className="lg-field">
              <label className="lg-label">Brand color</label>
              <input className="lg-input" type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
            </div>

            <button className="lg-btn lg-btn--primary lg-btn--full" type="submit">Create tenant</button>
          </form>

          <p style={{ marginTop: 20, textAlign: 'center' }}>
            <button className="lg-link-btn" onClick={() => navigate('/admin/login')}>Admin login</button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default TenantCreator;