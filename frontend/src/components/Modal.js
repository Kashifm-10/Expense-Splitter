import React, { useEffect } from 'react';
import '../theme.css';

function Modal({ isOpen, onClose, title, children, footer }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="lg-modal-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="presentation"
    >
      <div className="lg-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="lg-modal-header">
          <h3 className="lg-modal-title">{title}</h3>
          <button type="button" className="lg-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="lg-modal-body">{children}</div>
        {footer && <div className="lg-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;