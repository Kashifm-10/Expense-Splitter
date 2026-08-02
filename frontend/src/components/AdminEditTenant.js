import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../theme.css';
import AlertModal from './AlertModal';

const API = 'http://127.0.0.1:8000/api';

function AdminEditTenant() {
  const { tenantId } = useParams();
  const [token, setToken] = useState(localStorage.getItem('admin_tenant_token'));
  const [tenantInfo, setTenantInfo] = useState(localStorage.getItem('admin_tenant_info') ? JSON.parse(localStorage.getItem('admin_tenant_info')) : null);
  const [editName, setEditName] = useState(tenantInfo?.name || '');
  const [editColor, setEditColor] = useState(tenantInfo?.primary_color || '#000000');
  const [errorMessage, setErrorMessage] = useState('');
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const navigate = useNavigate();

  const showAlert = (message, type = 'info', title = '') => {
    const titles = { success: 'Success', error: 'Error', info: 'Info' };
    setAlertModal({ isOpen: true, title: title || titles[type] || 'Info', message, type });
  };

  useEffect(() => {
    if (!token) {
      navigate('/admin/tenants');
    }
  }, [token]);

  const handleUpdate = async () => {
    setErrorMessage('');
    try {
      await axios.put(`${API}/tenants/${tenantId}/update/`,
        { name: editName, primary_color: editColor },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedInfo = { ...tenantInfo, name: editName, primary_color: editColor };
      localStorage.setItem('admin_tenant_info', JSON.stringify(updatedInfo));
      setTenantInfo(updatedInfo);
      showAlert('Tenant details updated successfully.', 'success');
    } catch (err) {
      let msg;
      if (err.response) {
        msg = err.response.data?.error || 'Update failed. Please check the details and try again.';
      } else if (err.request) {
        msg = 'Network error. Please check your connection and try again.';
      } else {
        msg = 'An unexpected error occurred.';
      }
      setErrorMessage(msg);
      showAlert(msg, 'error');
    }
  };

  return (
    <div className="lg-page">
      <div className="lg-shell lg-shell--narrow">
        <div className="lg-brandbar" style={{ background: editColor }} />
        <div className="lg-card lg-card--ticket">
          <button className="lg-card-back lg-card-back--icon-only" onClick={() => navigate('/admin/tenants')}></button>

          <h2 className="lg-title">Edit tenant: {tenantInfo?.name}</h2>

          {errorMessage && <div className="lg-alert lg-alert--error">{errorMessage}</div>}

          <div className="lg-form">
            <div className="lg-field">
              <label className="lg-label">Name</label>
              <input className="lg-input" value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="lg-field">
              <label className="lg-label">Brand color</label>
              <input className="lg-input" type="color" value={editColor} onChange={e => setEditColor(e.target.value)} />
            </div>

            <button className="lg-btn lg-btn--primary" style={{ marginTop: 8 }} onClick={handleUpdate}>Save</button>
          </div>
        </div>
      </div>

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
}

export default AdminEditTenant;