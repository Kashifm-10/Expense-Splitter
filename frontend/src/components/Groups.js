import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../theme.css';
import { getBrandVars } from './brandTheme';
import AlertModal from './AlertModal';
import Modal from './Modal';
import { UsersIcon, SearchIcon, PlusIcon } from '../Icons';

const API = 'http://127.0.0.1:8000/api';

function Groups({ token, tenantInfo }) {
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const showAlert = (message, type = 'info', title = '') => {
    const titles = { success: 'Success', error: 'Error', info: 'Info' };
    setAlertModal({ isOpen: true, title: title || titles[type] || 'Info', message, type });
  };

  const fetchGroups = async () => {
    try {
      const res = await axios.get(`${API}/groups/`, { headers: { Authorization: `Bearer ${token}` } });
      setGroups(res.data);
    } catch (err) {
      if (err.response) {
        setErrorMessage('Failed to load groups.');
      } else if (err.request) {
        setErrorMessage('Network error.');
      } else {
        setErrorMessage('Unexpected error.');
      }
    }
  };

  useEffect(() => { fetchGroups(); }, [token]);

  const createGroup = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newGroupName.trim()) return;
    setErrorMessage('');
    try {
      await axios.post(`${API}/groups/`, { name: newGroupName }, { headers: { Authorization: `Bearer ${token}` } });
      setNewGroupName('');
      setShowCreateModal(false);
      showAlert('Group created successfully!', 'success');
      fetchGroups();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create group.';
      setErrorMessage(msg);
      showAlert(msg, 'error');
    }
  };

  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="lg-page" style={getBrandVars(tenantInfo?.primary_color)}>
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
      <div className="lg-shell lg-shell--full">
        <div className="lg-brandbar" />
        <div className="lg-card lg-card--ticket">
          <p className="lg-eyebrow">{tenantInfo?.name || 'Workspace'}</p>
          <h2 className="lg-title">Groups</h2>
          <p className="lg-subtitle">Shared expenses live inside a group.</p>

          {errorMessage && <div className="lg-alert lg-alert--error">{errorMessage}</div>}

          <div className="lg-row-inline" style={{ marginBottom: 20 }}>
            <div className="lg-search-wrap">
              <SearchIcon size={15} />
              <input className="lg-input" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search groups..." />
            </div>
            <button className="lg-btn lg-btn--primary" onClick={() => setShowCreateModal(true)}>
              <PlusIcon size={14} /> Add group
            </button>
          </div>

          {groups.length === 0 ? (
            <div className="lg-empty">Create a new group to get started or get added by another group.</div>
          ) : filteredGroups.length === 0 ? (
            <div className="lg-empty">No groups match your search.</div>
          ) : (
            <div className="lg-grid">
              {filteredGroups.map(g => (
                <div
                  key={g.id}
                  className="lg-group-card"
                  onClick={() => navigate(`/t/${tenantInfo.tenant_id}/groups/${g.group_id}`)}
                  role="link"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate(`/t/${tenantInfo.tenant_id}/groups/${g.group_id}`);
                  }}
                >
                  <div className="lg-group-card__top">
                    <p className="lg-group-card__name">{g.name}</p>
                    <span className="lg-group-card__chevron" aria-hidden="true">›</span>
                  </div>
                  {Array.isArray(g.members) && (
                    <div className="lg-group-card__meta">
                      <UsersIcon size={14} />
                      <span>{g.members.length} member{g.members.length === 1 ? '' : 's'}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setNewGroupName(''); }}
        title="New group"
        footer={
          <>
            <button className="lg-btn lg-btn--ghost" onClick={() => { setShowCreateModal(false); setNewGroupName(''); }}>Cancel</button>
            <button className="lg-btn lg-btn--primary" onClick={createGroup}>Create</button>
          </>
        }
      >
        <div className="lg-field">
          <label className="lg-label">Group name</label>
          <input className="lg-input" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="e.g. Goa trip" autoFocus />
        </div>
      </Modal>
    </div>
  );
}

export default Groups;