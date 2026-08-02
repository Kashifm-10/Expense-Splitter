import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../theme.css';
import AlertModal from './AlertModal';
import { EditIcon } from '../Icons';

const API = 'http://127.0.0.1:8000/api';

function AdminTenantDetail({ adminToken }) {
  const { tenantId } = useParams();
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const navigate = useNavigate();

  const showAlert = (message, type = 'info', title = '') => {
    const titles = { success: 'Success', error: 'Error', info: 'Info' };
    setAlertModal({ isOpen: true, title: title || titles[type] || 'Info', message, type });
  };

  useEffect(() => {
    axios.get(`${API}/tenants/${tenantId}/info/`)
      .then(res => setTenantName(res.data.name))
      .catch(() => setTenantName(tenantId));
  }, [tenantId]);

  const fetchMembers = async () => {
    try {
      const res = await axios.get(`${API}/tenants/${tenantId}/members/`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setMembers(res.data);
    } catch (err) {
      setError('Failed to load members.');
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [tenantId, adminToken]);

  const handleEdit = async () => {
    try {
      const res = await axios.post(`${API}/tenants/admin-get-tenant-token/`, { tenant_id: tenantId }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      localStorage.setItem('admin_tenant_token', res.data.access);
      localStorage.setItem('admin_tenant_info', JSON.stringify(res.data.tenant));
      navigate(`/t/${tenantId}/admin/edit`);
    } catch (err) {
      showAlert("Couldn't open the edit screen for this tenant. Please try again.", 'error');
    }
  };

  return (
    <div className="lg-page">
      <div className="lg-shell">
        <div className="lg-brandbar" />
        <div className="lg-card lg-card--ticket">
          <Link to="/admin/tenants" className="lg-card-back lg-card-back--icon-only"></Link>

          <div className="lg-header-row">
            <h2 className="lg-title">{tenantName || tenantId}</h2>
            <button className="lg-btn lg-btn--primary lg-btn--icon" onClick={handleEdit} title="Edit tenant"><EditIcon size={15} /></button>
          </div>

          {error && <div className="lg-alert lg-alert--error">{error}</div>}

          <h3 className="lg-section-title">Members</h3>
          {members.length === 0 ? (
            <div className="lg-empty">No members found.</div>
          ) : (
            <div className="lg-table-wrap">
              <table className="lg-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id}>
                      <td>{m.name}</td>
                      <td>{m.username}</td>
                      <td>{m.role}</td>
                      <td>{new Date(m.joined_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
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
    </div>
  );
}

export default AdminTenantDetail;