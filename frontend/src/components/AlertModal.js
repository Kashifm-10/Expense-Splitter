import React from 'react';
import Modal from './Modal';

function AlertModal({ isOpen, onClose, title, message, type }) {
  const typeStyles = {
    success: { color: 'var(--moss-dark)', icon: '✓' },
    error: { color: 'var(--rust-dark)', icon: '✗' },
    info: { color: 'var(--teal)', icon: 'ℹ' },
  };

  const style = typeStyles[type] || typeStyles.info;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Notification'}
      footer={
        <button className="lg-btn lg-btn--primary" onClick={onClose}>OK</button>
      }
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <span style={{ fontSize: '24px', color: style.color, fontWeight: 'bold' }}>{style.icon}</span>
        <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.5', color: 'var(--ink)' }}>{message}</p>
      </div>
    </Modal>
  );
}

export default AlertModal;