import React from 'react';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { getConsultation, updateConsultation } from '@apis/consultation';
import '@styles/admin/ConsultationModal.css';

export default function ConsultationModal({ id, open, onClose, onSaved }) {
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [item, setItem] = React.useState(null);
  const [edit, setEdit] = React.useState({ status: 'new', handledBy: '', note: '' });

  React.useEffect(() => {
    if (!open || !id) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getConsultation(id);
        if (!mounted) return;
        const it = res.data;
        setItem(it);
        setEdit({
          status: it.status || 'new',
          handledBy: it.handledBy || '',
          note: it.note || '',
        });
      } catch {
        toast.error('Không tải được chi tiết');
        onClose?.();
      } finally { mounted && setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [open, id, onClose]);

  // khoá cuộn + ESC để đóng
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', esc); };
  }, [open, onClose]);

  const save = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updateConsultation(id, {
        status: edit.status,
        handledBy: edit.handledBy || undefined,
        note: edit.note || undefined,
      });
      toast.success('Đã lưu');
      onClose?.();
      onSaved?.();
    } catch {
      toast.error('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <section className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Chi tiết tư vấn #{id}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        {loading || !item ? (
          <div className="admin-loading">Đang tải…</div>
        ) : (
          <div className="modal-body">
            <div className="dl">
              <div><b>Họ tên:</b> {item.fullName}</div>
              <div><b>Điện thoại:</b> {item.phone}</div>
              <div><b>Email:</b> {item.email || '-'}</div>
              <div><b>Giảng viên:</b> {item.teacherName || item.teacher?.fullName || '-'}</div>
              <div><b>Lời nhắn:</b> {item.message || '-'}</div>
              <div><b>Gửi lúc:</b> {dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}</div>
            </div>

            <div className="form-row">
              <label>Trạng thái</label>
              <select
                value={edit.status}
                onChange={(e) => setEdit(p => ({ ...p, status: e.target.value }))}
              >
                <option value="new">Mới</option>
                <option value="contacted">Đã liên hệ</option>
                <option value="scheduled">Đã đặt lịch</option>
                <option value="done">Hoàn tất</option>
                <option value="canceled">Huỷ</option>
              </select>
            </div>

            <div className="form-row">
              <label>Người xử lý</label>
              <input
                value={edit.handledBy}
                onChange={(e) => setEdit(p => ({ ...p, handledBy: e.target.value }))}
                placeholder="Tên nhân viên CSKH"
              />
            </div>

            <div className="form-row">
              <label>Ghi chú</label>
              <textarea
                rows={4}
                value={edit.note}
                onChange={(e) => setEdit(p => ({ ...p, note: e.target.value }))}
              />
            </div>
          </div>
        )}

        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Huỷ</button>
          <button className="btn primary" disabled={saving} onClick={save}>
            {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </div>
      </section>
    </div>
  );
}
