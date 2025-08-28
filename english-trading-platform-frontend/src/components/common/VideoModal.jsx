import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import '@styles/common/VideoModal.css';

export default function VideoModal({ open, src, onClose }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="tp-modal" onClick={onClose} role="dialog" aria-modal="true">
      <div className="tp-modal__dialog" onClick={(e) => e.stopPropagation()}>
        <button className="tp-modal__close" onClick={onClose} aria-label="Đóng">×</button>
        <video controls autoPlay src={src} />
      </div>
    </div>,
    document.body
  );
}
