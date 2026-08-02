import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../theme.css';
import Modal from './Modal';
import AlertModal from './AlertModal';
import { CopyIcon, CheckIcon, BanIcon, PlusIcon } from '../Icons';

const API = 'http://127.0.0.1:8000/api';

function AdminTenantList({ adminToken, adminInfo }) {
  const [tenants, setTenants] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [errorMessage, setErrorMessage] = useState('');
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [confirmToggle, setConfirmToggle] = useState({ isOpen: false, tenantId: null, isActive: false });
  const navigate = useNavigate();

  const showAlert = (message, type = 'info', title = '') => {
    const titles = { success: 'Success', error: 'Error', info: 'Info' };
    setAlertModal({ isOpen: true, title: title || titles[type] || 'Info', message, type });
  };

  const fetchTenants = async () => {
    try {
      const res = await axios.get(`${API}/tenants/owned/`, { headers: { Authorization: `Bearer ${adminToken}` } });
      setTenants(res.data);
    } catch (err) {
      setErrorMessage('Failed to fetch tenants.');
    }
  };

  useEffect(() => { fetchTenants(); }, [adminToken]);

  const handleCreate = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    try {
      await axios.post(`${API}/tenants/admin-create/`, { company_name: companyName, primary_color: primaryColor }, { headers: { Authorization: `Bearer ${adminToken}` } });
      setShowCreate(false);
      setCompanyName('');
      fetchTenants();
    } catch (err) {
      if (err.response) {
        setErrorMessage(err.response.data?.error || 'Failed to create tenant.');
      } else if (err.request) {
        setErrorMessage('Network error.');
      } else {
        setErrorMessage('Unexpected error.');
      }
    }
  };

  const requestToggleActive = (tenantId, isActive) => {
    setConfirmToggle({ isOpen: true, tenantId, isActive });
  };

  const handleToggleActive = async () => {
    const { tenantId, isActive } = confirmToggle;
    const action = isActive ? 'disable' : 'enable';
    setConfirmToggle({ isOpen: false, tenantId: null, isActive: false });
    try {
      if (isActive) {
        await axios.delete(`${API}/tenants/${tenantId}/soft-delete/`, { headers: { Authorization: `Bearer ${adminToken}` } });
      } else {
        await axios.put(`${API}/tenants/${tenantId}/enable/`, {}, { headers: { Authorization: `Bearer ${adminToken}` } });
      }
      showAlert(`Tenant ${action}d successfully.`, 'success');
      fetchTenants();
    } catch (err) {
      showAlert(`Failed to ${action} tenant. Please try again.`, 'error');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showAlert('Login URL copied to clipboard.', 'success');
    }).catch(() => {
      showAlert(`Couldn't copy automatically. Here's the link: ${text}`, 'info', 'Copy manually');
    });
  };

  const baseURL = window.location.origin;

  return (
    <div className="lg-page">
      <div className="lg-shell lg-shell--wide">
        <div className="lg-brandbar" />
        <div className="lg-card lg-card--ticket">
          <div className="lg-header-row">
            <div>
              <p className="lg-eyebrow">Admin console</p>
              <h2 className="lg-title" style={{ marginBottom: 0 }}>Your tenants</h2>
            </div>

            <button
              className="lg-btn lg-btn--primary"
              onClick={() => setShowCreate(true)}
            >
              <PlusIcon size={14} /> Add new tenant
            </button>
          </div>
          <p className="lg-subtitle">Workspaces you own and manage.</p>

          {errorMessage && <div className="lg-alert lg-alert--error">{errorMessage}</div>}

          {tenants.length === 0 ? (
            <div className="lg-empty">No tenants found. Add your first one below.</div>
          ) : (
            <div className="lg-table-wrap">
              <table className="lg-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>ID</th>
                    <th>Status</th>
                    <th>User login URL</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => {
                    const userURL = `${baseURL}/t/${t.tenant_id}/login`;
                    return (
                      <tr
                        key={t.id}
                        className={`${t.is_active ? 'lg-row--clickable' : 'lg-row--inactive'}`}
                        onClick={() => t.is_active && navigate(`/admin/tenants/${t.tenant_id}`)}
                      >
                        <td>{t.name}</td>
                        <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{t.tenant_id}</td>
                        <td>
                          <span className={`lg-badge ${t.is_active ? 'lg-badge--active' : 'lg-badge--inactive'}`}>
                            {t.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="lg-url-copy">
                            <a href={userURL} target="_blank" rel="noopener noreferrer">{userURL}</a>
                            <button
                              className="lg-btn lg-btn--ghost lg-btn--sm"
                              onClick={(e) => { e.stopPropagation(); copyToClipboard(userURL); }}
                            >
                              <CopyIcon size={13} /> Copy
                            </button>
                          </div>
                        </td>
                        <td>
                          {t.is_active ? (
                            <button
                              className="lg-btn lg-btn--danger lg-btn--sm"
                              onClick={(e) => { e.stopPropagation(); requestToggleActive(t.tenant_id, true); }}
                            >
                              <BanIcon size={13} /> Disable
                            </button>
                          ) : (
                            <button
                              className="lg-btn lg-btn--success lg-btn--sm"
                              onClick={(e) => { e.stopPropagation(); requestToggleActive(t.tenant_id, false); }}
                            >
                              <CheckIcon size={13} /> Enable
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      <Modal
        isOpen={showCreate}
        onClose={() => {
          setShowCreate(false);
          setCompanyName('');
          setPrimaryColor('#000000');
          setErrorMessage('');
        }}
        title="Add new tenant"
        footer={
          <>
            <button
              className="lg-btn lg-btn--ghost"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </button>
            <button
              className="lg-btn lg-btn--primary"
              onClick={handleCreate}
            >
              Create
            </button>
          </>
        }
      >
        <form className="lg-form" onSubmit={handleCreate}>
          <div className="lg-row-inline">
            <input
              className="lg-input"
              placeholder="Company name"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              required
            />

            <input
              className="lg-input"
              type="color"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
            />
          </div>

          {errorMessage && (
            <div className="lg-alert lg-alert--error">
              {errorMessage}
            </div>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={confirmToggle.isOpen}
        onClose={() => setConfirmToggle({ isOpen: false, tenantId: null, isActive: false })}
        title={confirmToggle.isActive ? 'Disable tenant' : 'Enable tenant'}
        footer={
          <>
            <button className="lg-btn lg-btn--ghost" onClick={() => setConfirmToggle({ isOpen: false, tenantId: null, isActive: false })}>Cancel</button>
            <button className={confirmToggle.isActive ? 'lg-btn lg-btn--danger' : 'lg-btn lg-btn--success'} onClick={handleToggleActive}>
              {confirmToggle.isActive ? 'Disable' : 'Enable'}
            </button>
          </>
        }
      >
        {confirmToggle.isActive ? (
          <p>This will disable the tenant and block all its users from logging in until it's re-enabled. This action can be reversed later.</p>
        ) : (
          <p>This will re-enable the tenant and restore login access for its users.</p>
        )}
      </Modal>
    </div>
  );
}

export default AdminTenantList;