import React, { useEffect, useState } from 'react';
import '@styles/admin/AccountLockModal.css';

/**
 * Modal xác nhận khóa/mở khóa tài khoản
 * Props:
 *  - open: boolean
 *  - type: 'lock' | 'unlock'
 *  - onClose: () => void
 *  - onConfirm: (reason?: string) => void | Promise<void>
 */
export default function AccountLockModal({ open, type, onClose, onConfirm }) {
  const isLock = type === 'lock';
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setReason('');
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const submit = () => {
    if (isLock && !reason.trim()) {
      setError('Vui lòng nhập lý do khóa tài khoản.');
      return;
    }
    onConfirm?.(reason.trim());
  };

  const onBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div className="al-modal-backdrop" onMouseDown={onBackdrop}>
      <div className="al-modal" role="dialog" aria-modal="true">
        <div className="al-modal-head">
          <strong>{isLock ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}</strong>
          <button className="al-icon-btn" onClick={onClose} aria-label="Đóng">✖</button>
        </div>

        <div className="al-modal-body">
          {isLock ? (
            <>
              <p>
                Bạn đang <b>KHÓA</b> tài khoản. Vui lòng nhập lý do
                (email sẽ được gửi tới người dùng):
              </p>
              <textarea
                rows={5}
                placeholder="Lý do khóa tài khoản…"
                value={reason}
                onChange={(e) => { setReason(e.target.value); if (error) setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
              />
              {error && <div className="al-form-error">{error}</div>}
              <div className="al-tip">Mẹo: Nhấn <kbd>Ctrl</kbd> + <kbd>Enter</kbd> để xác nhận nhanh.</div>
            </>
          ) : (
            <p>Bạn có chắc chắn <b>MỞ KHÓA</b> tài khoản này?</p>
          )}
        </div>

        <div className="al-modal-foot">
          <button className="btn" onClick={onClose}>Hủy</button>
          <button className="btn primary" onClick={submit}>
            {isLock ? 'Xác nhận khóa' : 'Xác nhận mở khóa'}
          </button>
        </div>
      </div>
    </div>
  );
}
