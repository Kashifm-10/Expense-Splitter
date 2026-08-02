import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../theme.css';
import { getBrandVars } from './brandTheme';
import Modal from './Modal';
import AlertModal from './AlertModal';
import { EditIcon, TrashIcon, PlusIcon, UsersIcon, ArrowRightIcon, InfoIcon, LogoutIcon, SearchIcon } from '../Icons';

const API = 'http://127.0.0.1:8000/api';

function GroupDetail({ token, tenantInfo }) {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [selectedUsernames, setSelectedUsernames] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [showAddMembers, setShowAddMembers] = useState(false);

  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');

  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [showLeaveGroupModal, setShowLeaveGroupModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [expenseSearch, setExpenseSearch] = useState('');

  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpensePaidBy, setNewExpensePaidBy] = useState('');

  const [editExpense, setEditExpense] = useState(null);
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false);
  const [editExpenseDesc, setEditExpenseDesc] = useState('');
  const [editExpenseAmount, setEditExpenseAmount] = useState('');
  const [editExpensePaidBy, setEditExpensePaidBy] = useState('');

  const [showDeleteExpenseModal, setShowDeleteExpenseModal] = useState(false);
  const [deleteExpenseId, setDeleteExpenseId] = useState(null);

  const currentUserUuid = localStorage.getItem('app_user_uuid');

  const showAlert = (message, type = 'info', title = '') => {
    const titles = { success: 'Success', error: 'Error', info: 'Info' };
    setAlertModal({ isOpen: true, title: title || titles[type] || 'Info', message, type });
  };

  const fetchGroup = async () => {
    try {
      const res = await axios.get(`${API}/groups/${groupId}/`, { headers: { Authorization: `Bearer ${token}` } });
      setGroup(res.data);
      setEditGroupName(res.data.name);
    } catch (err) {
      setErrorMessage('Error loading group.');
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`${API}/groups/${groupId}/expenses/`, { headers: { Authorization: `Bearer ${token}` } });
      setExpenses(res.data);
    } catch (err) {
      setErrorMessage('Error loading expenses.');
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await axios.get(`${API}/members/`, { headers: { Authorization: `Bearer ${token}` } });
      setAllMembers(res.data);
    } catch (err) {
      setErrorMessage('Error loading members.');
    }
  };

  useEffect(() => {
    fetchGroup();
    fetchExpenses();
    fetchMembers();
  }, [groupId]);

  useEffect(() => {
    if (showAddExpenseModal && group) {
      const currentMember = group.members.find(m => m.uuid === currentUserUuid);
      setNewExpensePaidBy(currentMember ? currentMember.uuid : (group.members[0]?.uuid || ''));
    }
  }, [showAddExpenseModal, group, currentUserUuid]);

  const handleAddExpense = async () => {
    setErrorMessage('');
    try {
      await axios.post(`${API}/groups/${groupId}/expenses/`, {
        description: newExpenseDesc,
        amount: newExpenseAmount,
        paid_by: newExpensePaidBy
      }, { headers: { Authorization: `Bearer ${token}` } });
      setNewExpenseDesc('');
      setNewExpenseAmount('');
      setNewExpensePaidBy('');
      setShowAddExpenseModal(false);
      showAlert('Expense added successfully!', 'success');
      fetchExpenses();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to add expense.';
      setErrorMessage(msg);
      showAlert(msg, 'error');
    }
  };

  const toggleUsername = (username) => {
    setSelectedUsernames(prev => prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]);
  };

  const addMembers = async () => {
    if (selectedUsernames.length === 0) return;
    setErrorMessage('');
    try {
      const res = await axios.post(`${API}/groups/${groupId}/add-member/`, { usernames: selectedUsernames }, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedUsernames([]);
      setShowAddMembers(false);
      showAlert(res.data.status, 'success');
      fetchGroup();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to add members.';
      setErrorMessage(msg);
      showAlert(msg, 'error');
    }
  };

  const handleEditGroup = async () => {
    setErrorMessage('');
    try {
      await axios.put(`${API}/groups/${groupId}/`, { name: editGroupName }, { headers: { Authorization: `Bearer ${token}` } });
      setShowEditGroupModal(false);
      showAlert('Group name updated successfully!', 'success');
      fetchGroup();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update group.';
      setErrorMessage(msg);
      showAlert(msg, 'error');
    }
  };

  const handleDeleteGroup = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setErrorMessage('Please type "DELETE" to confirm.');
      return;
    }
    try {
      await axios.delete(`${API}/groups/${groupId}/`, { headers: { Authorization: `Bearer ${token}` } });
      showAlert('Group deleted successfully.', 'success');
      navigate(`/t/${tenantInfo.tenant_id}/groups`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to delete group.';
      setErrorMessage(msg);
      showAlert(msg, 'error');
    }
  };

  const handleLeaveGroup = async () => {
    try {
      const res = await axios.post(`${API}/groups/${groupId}/leave/`, {}, { headers: { Authorization: `Bearer ${token}` } });
      // Close the leave modal first
      setShowLeaveGroupModal(false);
      const msg = res.data.status + (res.data.next_owner_name ? ` Ownership transferred to ${res.data.next_owner_name}.` : '');
      showAlert(msg, 'success');
      navigate(`/t/${tenantInfo.tenant_id}/groups`);
    } catch (err) {
      // Close the leave modal before showing error
      setShowLeaveGroupModal(false);
      const msg = err.response?.data?.error || 'Failed to leave group.';
      showAlert(msg, 'error');
    }
  };

  const openEditExpenseModal = (exp) => {
    setEditExpense(exp);
    setEditExpenseDesc(exp.description);
    setEditExpenseAmount(exp.amount);
    setEditExpensePaidBy(exp.paid_by);
    setShowEditExpenseModal(true);
  };

  const handleEditExpense = async () => {
    setErrorMessage('');
    try {
      await axios.put(`${API}/expenses/${editExpense.id}/`, {
        description: editExpenseDesc,
        amount: editExpenseAmount,
        paid_by: editExpensePaidBy
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowEditExpenseModal(false);
      showAlert('Expense updated successfully!', 'success');
      fetchExpenses();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update expense.';
      setErrorMessage(msg);
      showAlert(msg, 'error');
    }
  };

  const handleDeleteExpense = async () => {
    try {
      await axios.delete(`${API}/expenses/${deleteExpenseId}/`, { headers: { Authorization: `Bearer ${token}` } });
      setShowDeleteExpenseModal(false);
      showAlert('Expense deleted successfully.', 'success');
      fetchExpenses();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to delete expense.';
      showAlert(msg, 'error');
    }
  };

  if (!group) return <div className="lg-page"><p className="lg-loading">Loading...</p></div>;

  const isCreator = group.created_by === currentUserUuid;
  const memberCount = group.members.length;
  const nextOwner = group.members.find(m => m.uuid !== currentUserUuid);
  const q = expenseSearch.trim().toLowerCase();
  const filteredExpenses = q
    ? expenses.filter(exp =>
        (exp.description || '').toLowerCase().includes(q) ||
        (exp.paid_by_name || '').toLowerCase().includes(q) ||
        (exp.created_by_name || '').toLowerCase().includes(q)
      )
    : expenses;

  return (
    <div className="lg-page" style={getBrandVars(tenantInfo?.primary_color)}>
      <div className="lg-shell lg-shell--full">
        <div className="lg-brandbar" />
        <div className="lg-card lg-card--ticket">
          <Link to={`/t/${tenantInfo.tenant_id}/groups`} className="lg-card-back lg-card-back--icon-only" title="Back to groups" aria-label="Back to groups" />

          <div className="lg-header-row">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 className="lg-title" style={{ marginBottom: 0 }}>{group.name}</h2>
                <button className="lg-btn lg-btn--ghost lg-btn--icon" onClick={() => setShowGroupInfoModal(true)} title="Group info & actions">
                  <InfoIcon size={16} />
                </button>
              </div>
            </div>
          </div>

          {errorMessage && <div className="lg-alert lg-alert--error">{errorMessage}</div>}

          <h3 className="lg-section-title">Expenses</h3>

          <div className="lg-toolbar-row" style={{ marginBottom: 16 }}>
            {expenses.length > 0 && (
              <div className="lg-search-wrap">
                <SearchIcon size={15} />
                <input className="lg-input" value={expenseSearch} onChange={e => setExpenseSearch(e.target.value)} placeholder="Search expenses by description or payer..." />
              </div>
            )}
            <button className="lg-btn lg-btn--primary lg-btn--icon" onClick={() => setShowAddExpenseModal(true)} title="Add expense">
              <PlusIcon size={16} />
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="lg-empty">No expenses yet. Add your first one above to start tracking who paid for what.</div>
          ) : filteredExpenses.length === 0 ? (
            <div className="lg-empty">No expenses match your search.</div>
          ) : (
            <div className="lg-table-wrap">
              <div className="lg-table-scroll">
              <table className="lg-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Paid by</th>
                    <th>Added by</th>
                    <th className="lg-col-right">Amount</th>
                    <th>Date Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(exp => {
                    const isDeleted = exp.is_deleted;
                    const isEdited = !isDeleted && new Date(exp.updated_at) - new Date(exp.created_at) > 1000;
                    const canEdit = !isDeleted && exp.created_by === currentUserUuid;
                    return (
                      <tr key={exp.id} style={isDeleted ? { opacity: 0.5 } : undefined}>
                        <td>
                          <span style={isDeleted ? { textDecoration: 'line-through' } : undefined}>{exp.description}</span>
                          {(isDeleted || isEdited) && (
                            <span className="lg-table-badges">
                              {isDeleted && <span className="lg-badge lg-badge--inactive">Deleted</span>}
                              {isEdited && <span className="lg-badge lg-badge--active" title={`Edited at ${new Date(exp.updated_at).toLocaleString()}`}>Edited</span>}
                            </span>
                          )}
                        </td>
                        <td className="lg-td-nowrap">{exp.paid_by_name}</td>
                        <td className="lg-td-nowrap">{exp.created_by_name}</td>
                        <td className="lg-money">₹{parseFloat(exp.amount).toFixed(2)}</td>
                        <td className="lg-td-nowrap">{new Date(exp.created_at).toLocaleString()}</td>
                        <td>
                          {canEdit && (
                            <div className="lg-table-actions">
                              <button className="lg-btn lg-btn--ghost lg-btn--icon" onClick={() => openEditExpenseModal(exp)} title="Edit expense"><EditIcon size={13} /></button>
                              <button className="lg-btn lg-btn--danger lg-btn--icon" onClick={() => { setDeleteExpenseId(exp.id); setShowDeleteExpenseModal(true); }} title="Delete expense"><TrashIcon size={13} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          )}

          <Link
            to={`/t/${tenantInfo.tenant_id}/groups/${groupId}/settle`}
            className="lg-btn lg-btn--primary lg-btn--full"
            style={{ marginTop: 24 }}
          >
            Settle up <ArrowRightIcon size={15} />
          </Link>
        </div>
      </div>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      {/* Group Info Modal */}
      <Modal
        isOpen={showGroupInfoModal}
        onClose={() => setShowGroupInfoModal(false)}
        title="Group info"
        footer={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {isCreator && (
              <button className="lg-btn lg-btn--ghost lg-btn--icon" title="Edit group" onClick={() => { setShowGroupInfoModal(false); setShowEditGroupModal(true); }}><EditIcon size={15} /></button>
            )}
            <button className="lg-btn lg-btn--ghost lg-btn--icon" title="Add members" onClick={() => { setShowGroupInfoModal(false); setShowAddMembers(true); }}><UsersIcon size={15} /></button>
            <button className="lg-btn lg-btn--ghost lg-btn--icon" title="Leave group" onClick={() => { setShowGroupInfoModal(false); setShowLeaveGroupModal(true); }}><LogoutIcon size={15} /></button>
            {isCreator && (
              <button className="lg-btn lg-btn--danger lg-btn--icon" title="Delete group" onClick={() => { setShowGroupInfoModal(false); setShowDeleteGroupModal(true); }}><TrashIcon size={15} /></button>
            )}
          </div>
        }
      >
        <p className="lg-label" style={{ marginBottom: 10 }}>Members ({group.members?.length || 0})</p>
        <ul className="lg-list">
          {group.members?.map(m => (
            <li key={m.uuid} className="lg-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{m.first_name} <span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}>({m.username})</span></span>
              {m.uuid === group.created_by && <span className="lg-badge lg-badge--active">Owner</span>}
            </li>
          ))}
        </ul>
      </Modal>

      {/* Add Members Modal */}
      <Modal
        isOpen={showAddMembers}
        onClose={() => setShowAddMembers(false)}
        title="Add members"
        footer={
          <>
            <button className="lg-btn lg-btn--ghost" onClick={() => setShowAddMembers(false)}>Cancel</button>
            <button className="lg-btn lg-btn--primary" onClick={addMembers} disabled={selectedUsernames.length === 0}>
              Add selected
            </button>
          </>
        }
      >
        <div className="lg-checkbox-list" style={{ maxHeight: 260 }}>
          {allMembers.filter(m => !group.members.some(gm => gm.username === m.username)).length === 0 ? (
            <p className="lg-subtitle" style={{ margin: 0 }}>Everyone is already in this group.</p>
          ) : (
            allMembers.filter(m => !group.members.some(gm => gm.username === m.username)).map(m => (
              <label key={m.id} className="lg-checkbox-row">
                <input type="checkbox" checked={selectedUsernames.includes(m.username)} onChange={() => toggleUsername(m.username)} />
                {m.name} ({m.username})
              </label>
            ))
          )}
        </div>
      </Modal>

      {/* Add Expense Modal */}
      <Modal
        isOpen={showAddExpenseModal}
        onClose={() => { setShowAddExpenseModal(false); setNewExpenseDesc(''); setNewExpenseAmount(''); setNewExpensePaidBy(''); }}
        title="Add expense"
        footer={
          <>
            <button className="lg-btn lg-btn--ghost" onClick={() => setShowAddExpenseModal(false)}>Cancel</button>
            <button className="lg-btn lg-btn--primary" onClick={handleAddExpense}>Add</button>
          </>
        }
      >
        <div className="lg-form">
          <div className="lg-field">
            <label className="lg-label">Description</label>
            <input className="lg-input" value={newExpenseDesc} onChange={e => setNewExpenseDesc(e.target.value)} placeholder="What was it?" />
          </div>
          <div className="lg-field">
            <label className="lg-label">Amount</label>
            <input className="lg-input" type="number" step="0.01" value={newExpenseAmount} onChange={e => setNewExpenseAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div className="lg-field">
            <label className="lg-label">Paid by</label>
            <select className="lg-select" value={newExpensePaidBy} onChange={e => setNewExpensePaidBy(e.target.value)}>
              {group.members.map(m => (
                <option key={m.uuid} value={m.uuid}>{m.first_name} ({m.username})</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Edit Group Modal */}
      <Modal
        isOpen={showEditGroupModal}
        onClose={() => setShowEditGroupModal(false)}
        title="Edit group name"
        footer={
          <>
            <button className="lg-btn lg-btn--ghost" onClick={() => setShowEditGroupModal(false)}>Cancel</button>
            <button className="lg-btn lg-btn--primary" onClick={handleEditGroup}>Save</button>
          </>
        }
      >
        <input className="lg-input" value={editGroupName} onChange={e => setEditGroupName(e.target.value)} placeholder="Group name" />
      </Modal>

      {/* Delete Group Modal */}
      <Modal
        isOpen={showDeleteGroupModal}
        onClose={() => { setShowDeleteGroupModal(false); setDeleteConfirmText(''); }}
        title="Delete group"
        footer={
          <>
            <button className="lg-btn lg-btn--ghost" onClick={() => { setShowDeleteGroupModal(false); setDeleteConfirmText(''); }}>Cancel</button>
            <button className="lg-btn lg-btn--danger" onClick={handleDeleteGroup}>Delete</button>
          </>
        }
      >
        <p>This will permanently delete the group and all its expenses, including any that were already soft-deleted. <strong>This action cannot be undone.</strong></p>
        <p><strong>Total expenses: {expenses.length}</strong></p>
        <p>Type <strong>DELETE</strong> to confirm:</p>
        <input className="lg-input" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="DELETE" />
      </Modal>

      {/* Leave Group Modal */}
      <Modal
        isOpen={showLeaveGroupModal}
        onClose={() => setShowLeaveGroupModal(false)}
        title="Leave group"
        footer={
          <>
            <button className="lg-btn lg-btn--ghost" onClick={() => setShowLeaveGroupModal(false)}>Cancel</button>
            <button className="lg-btn lg-btn--primary" onClick={handleLeaveGroup}>Leave</button>
          </>
        }
      >
        {isCreator ? (
          <p>You are the creator. If you leave, ownership will transfer to <strong>{nextOwner ? nextOwner.first_name : 'no one (this should not happen)'}</strong>. Are you sure?</p>
        ) : (
          <p>Are you sure you want to leave this group?</p>
        )}
        {memberCount === 1 && <p className="lg-alert lg-alert--error">You are the only member – you cannot leave.</p>}
      </Modal>

      {/* Edit Expense Modal */}
      <Modal
        isOpen={showEditExpenseModal}
        onClose={() => setShowEditExpenseModal(false)}
        title="Edit expense"
        footer={
          <>
            <button className="lg-btn lg-btn--ghost" onClick={() => setShowEditExpenseModal(false)}>Cancel</button>
            <button className="lg-btn lg-btn--primary" onClick={handleEditExpense}>Save</button>
          </>
        }
      >
        <div className="lg-form">
          <div className="lg-field">
            <label className="lg-label">Description</label>
            <input className="lg-input" value={editExpenseDesc} onChange={e => setEditExpenseDesc(e.target.value)} />
          </div>
          <div className="lg-field">
            <label className="lg-label">Amount</label>
            <input className="lg-input" type="number" step="0.01" value={editExpenseAmount} onChange={e => setEditExpenseAmount(e.target.value)} />
          </div>
          <div className="lg-field">
            <label className="lg-label">Paid by</label>
            <select className="lg-select" value={editExpensePaidBy} onChange={e => setEditExpensePaidBy(e.target.value)}>
              {group.members.map(m => (
                <option key={m.uuid} value={m.uuid}>{m.first_name} ({m.username})</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Delete Expense Modal */}
      <Modal
        isOpen={showDeleteExpenseModal}
        onClose={() => setShowDeleteExpenseModal(false)}
        title="Delete expense"
        footer={
          <>
            <button className="lg-btn lg-btn--ghost" onClick={() => setShowDeleteExpenseModal(false)}>Cancel</button>
            <button className="lg-btn lg-btn--danger" onClick={handleDeleteExpense}>Delete</button>
          </>
        }
      >
        <p>This expense will be marked as deleted and excluded from future settlements. It will still be visible here, greyed out, for your records.</p>
      </Modal>
    </div>
  );
}

export default GroupDetail;