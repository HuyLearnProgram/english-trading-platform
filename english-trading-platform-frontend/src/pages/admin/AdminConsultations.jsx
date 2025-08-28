import React from 'react';
import { toast } from 'react-toastify';
import {
  listConsultations,
  updateConsultation,
  deleteConsultation,
} from '@apis/consultation';
import { STATUS_OPTIONS } from '@utils/constants';

import ConsultationModal from '@components/admin/ConsultationModal';
import StatusDropdown from '@components/admin/StatusDropdown';
import '@styles/AdminModal.css';

export default function AdminConsultations() {
  const [data, setData] = React.useState([]);
  const [meta, setMeta] = React.useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [modal, setModal] = React.useState({ open: false, id: null });

  const fetchList = React.useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await listConsultations({
        page,
        limit: meta.limit,
        search: search || undefined,
        status: status || undefined
      });
      setData(res.data?.items || []);
      setMeta(res.data?.meta || { total: 0, page, limit: meta.limit, totalPages: 1 });
    } catch { toast.error('Không tải được danh sách'); }
    finally { setLoading(false); }
  }, [search, status, meta.limit]);

  React.useEffect(() => { fetchList(1); }, [fetchList]);

  const onChangeStatusInline = async (id, value) => {
    try {
      await updateConsultation(id, { status: value });
      toast.success('Đã cập nhật trạng thái');
      fetchList(meta.page);
    } catch { toast.error('Cập nhật thất bại'); }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Xoá yêu cầu này?')) return;
    try {
      await deleteConsultation(id);
      toast.success('Đã xoá');
      fetchList(1);
    } catch { toast.error('Xoá thất bại'); }
  };

  return (
    <div className="admin-page">
      <h1 className="admin-title">Quản lý tư vấn</h1>

      <div className="toolbar">
        <div className="search">
          <input
            placeholder="Tìm theo tên/điện thoại/email/giảng viên…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchList(1)}
          />
          <button className="btn" onClick={() => fetchList(1)}>Tìm</button>
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); }}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div className="admin-loading">Đang tải…</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Điện thoại</th>
                <th>Giảng viên</th>
                <th>Người xử lý</th>
                <th className="col-status">Trạng thái</th>
                <th className="col-note">Lời nhắn</th>
                <th style={{ width: 140 }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {data.map(it => (
                <tr key={it.id}>
                  <td>
                    <div className="cell-title">{it.fullName}</div>
                    <div className="cell-sub">{it.email || ''}</div>
                  </td>
                  <td>{it.phone}</td>
                  <td>{it.teacherName || it.teacher?.fullName || '-'}</td>
                  <td>{it.handledBy || '-'}</td>

                  <td className="col-status">
                    <StatusDropdown
                      value={it.status}
                      onChange={(v) => onChangeStatusInline(it.id, v)}
                    />
                  </td>

                  <td className="col-note">
                    <span className="cell-note" title={it?.message || ''}>
                      {it?.message || ''}
                    </span>
                  </td>

                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-btn"
                        title="Xem / Sửa"
                        onClick={() => setModal({ open: true, id: it.id })}
                      >👁</button>
                      <button
                        className="icon-btn danger"
                        title="Xoá"
                        onClick={() => onDelete(it.id)}
                      >🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!data.length && (
                <tr><td colSpan={7} style={{textAlign:'center', color:'#6b7280', padding:'18px'}}>Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        )}

        <div className="pagination">
          <span>Tổng: {meta.total}</span>
          <div className="pager">
            <button className="btn" disabled={meta.page <= 1} onClick={() => fetchList(meta.page - 1)}>Trước</button>
            <span>Trang {meta.page}/{meta.totalPages || 1}</span>
            <button className="btn" disabled={meta.page >= (meta.totalPages || 1)} onClick={() => fetchList(meta.page + 1)}>Sau</button>
          </div>
        </div>
      </div>

      <ConsultationModal
        id={modal.id}
        open={modal.open}
        onClose={() => setModal({ open: false, id: null })}
        onSaved={() => fetchList(meta.page)}
      />
    </div>
  );
}
