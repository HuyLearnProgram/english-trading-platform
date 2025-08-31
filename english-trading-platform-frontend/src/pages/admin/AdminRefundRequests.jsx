import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  apiListRefunds,
  apiUpdateRefund,
} from '@apis/refundRequests';
import '@styles/admin/AdminRefundRequests.css';

// toast
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getErrMsg, Refund_badgeClass, Refund_SORTS, Refund_STATUS } from '@utils/constants';


export default function AdminRefundRequests() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // filters
  const [teacherId, setTeacherId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [status, setStatus] = useState('');
  const [eligible, setEligible] = useState(''); // '', 'true', 'false'
  const [sort, setSort] = useState('created_desc');

  // modal xác nhận
  const [confirm, setConfirm] = useState({ open: false, id: null, type: null }); // 'approve' | 'reject'
  const [reason, setReason] = useState('');       // dùng khi reject
  const [rejectError, setRejectError] = useState(''); // hiển thị lỗi inline

  // ===== fetch =====
  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await apiListRefunds({
        page,
        limit: meta.limit,
        teacherId: teacherId || undefined,
        studentId: studentId || undefined,
        status: status || undefined,
        eligible: eligible || undefined,
      });
      setItems(data.items || []);
      setMeta(data.meta || { total: 0, page, limit: 20, totalPages: 1 });
    } catch (e) {
      toast.error(`Tải dữ liệu thất bại: ${getErrMsg(e)}`);
    } finally {
      setLoading(false);
    }
  }, [teacherId, studentId, status, eligible, meta.limit]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  const onSearch = () => fetchData(1);

  // Phân trang
  const prev = () => meta.page > 1 && fetchData(meta.page - 1);
  const next = () => meta.page < meta.totalPages && fetchData(meta.page + 1);

  // Cập nhật trạng thái (optimistic + toast)
  const setStatusQuick = async (id, newStatus, reasonText) => {
    // Optimistic UI
    setItems(prev =>
      prev.map(r =>
        r.id === id ? { ...r, status: newStatus, ...(newStatus === 'rejected' ? { reason: reasonText } : {}) } : r
      )
    );
    try {
      const payload = { status: newStatus };
      if (newStatus === 'rejected') payload.reason = (reasonText || '').trim();
      await apiUpdateRefund(id, payload);
      toast.success(newStatus === 'approved' ? 'Đã duyệt yêu cầu hoàn phí.' : 'Đã từ chối yêu cầu hoàn phí.');
    } catch (e) {
      // rollback nếu lỗi
      await fetchData(meta.page);
      toast.error(getErrMsg(e)); // ví dụ 403 Forbidden / 400 Bad Request từ BE
    }
  };

  // Sắp xếp client-side
  const viewItems = useMemo(() => {
    const arr = [...items];
    switch (sort) {
      case 'created_asc':
        arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'status':
        arr.sort((a, b) => String(a.status).localeCompare(String(b.status)));
        break;
      case 'eligible':
        arr.sort((a, b) => {
          if (a.eligible === b.eligible) return new Date(b.createdAt) - new Date(a.createdAt);
          return a.eligible ? -1 : 1;
        });
        break;
      case 'teacher':
        arr.sort((a, b) => (a.teacherId || 0) - (b.teacherId || 0));
        break;
      case 'student':
        arr.sort((a, b) => (a.studentId || 0) - (b.studentId || 0));
        break;
      case 'created_desc':
      default:
        arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }
    return arr;
  }, [items, sort]);

  const onKeyEnter = (e) => { if (e.key === 'Enter') onSearch(); };

  const openApprove = (r) => setConfirm({ open: true, id: r.id, type: 'approve' });
  const openReject  = (r) => { setReason(''); setRejectError(''); setConfirm({ open: true, id: r.id, type: 'reject' }); };
  const closeConfirm = () => setConfirm({ open:false, id:null, type:null });

  const doConfirm = async () => {
    if (!confirm.open || !confirm.id) return;
    if (confirm.type === 'reject') {
      if (!reason.trim()) {
        setRejectError('Vui lòng nhập lý do từ chối.');
        return;
      }
      setRejectError('');
    }
    await setStatusQuick(
      confirm.id,
      confirm.type === 'approve' ? 'approved' : 'rejected',
      confirm.type === 'reject' ? reason.trim() : undefined
    );
    closeConfirm();
  };

  return (
    <div className="admin-page">
      <h2 className="admin-title">Refund Requests</h2>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search">
          <input
            placeholder="Teacher ID"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value.replace(/\D/g, ''))}
            onKeyDown={onKeyEnter}
          />
          <input
            placeholder="Student ID"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
            onKeyDown={onKeyEnter}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {Refund_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={eligible} onChange={(e) => setEligible(e.target.value)}>
            <option value="">Eligible: Tất cả</option>
            <option value="true">Eligible: true</option>
            <option value="false">Eligible: false</option>
          </select>

          {/* Sort (client-side) */}
          <select value={sort} onChange={(e) => setSort(e.target.value)} title="Sắp xếp">
            {Refund_SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          <button className="btn primary" onClick={onSearch}>Tìm</button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="admin-loading">Đang tải…</div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Teacher</th>
                  <th>Student</th>
                  <th className='text-center'>Eligible</th>
                  <th className='text-center'>Status</th>
                  <th>Reason</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {viewItems.map(r => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td><div className="cell-title">#{r.teacherId}</div></td>
                    <td><div className="cell-title">#{r.studentId}</div></td>
                    <td>
                      <span className={`badge ${r.eligible ? 'green' : 'red'}`}>{String(!!r.eligible)}</span>
                    </td>
                    <td>
                      <span className={Refund_badgeClass(r.status)}>{r.status}</span>
                    </td>
                    <td style={{maxWidth: 280}}>
                      <div className="cell-sub" title={r.reason || ''}>
                        {(r.reason || '').length > 80 ? (r.reason || '').slice(0,80) + '…' : (r.reason || '—')}
                      </div>
                    </td>
                    <td className="cell-sub">{new Date(r.createdAt).toLocaleString()}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn btn-sm btn-approve"
                          disabled={r.status === 'approved'}
                          onClick={() => openApprove(r)}
                          title="Duyệt"
                        >
                          Duyệt
                        </button>
                        <button
                          className="btn btn-sm btn-reject"
                          disabled={r.status === 'rejected'}
                          onClick={() => openReject(r)}
                          title="Từ chối"
                        >
                          Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!viewItems.length && (
                  <tr><td colSpan={8} className="cell-sub">Không có dữ liệu.</td></tr>
                )}
              </tbody>
            </table>

            <div className="pagination">
              <span>Tổng: {meta.total}</span>
              <div className="pager">
                <button className="btn" onClick={prev} disabled={meta.page <= 1}>Trước</button>
                <span>Trang {meta.page}/{meta.totalPages || 1}</span>
                <button className="btn" onClick={next} disabled={meta.page >= meta.totalPages}>Sau</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal xác nhận */}
      {confirm.open && (
        <div className="modal-backdrop" onClick={(e)=>{ if (e.target === e.currentTarget) closeConfirm(); }}>
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-head">
              <strong>{confirm.type === 'approve' ? 'Xác nhận duyệt yêu cầu' : 'Từ chối yêu cầu hoàn phí'}</strong>
              <button className="icon-btn" onClick={closeConfirm}>✖</button>
            </div>
            <div className="modal-body">
              {confirm.type === 'approve' ? (
                <p>Bạn có chắc chắn <b>DUYỆT</b> yêu cầu này?</p>
              ) : (
                <>
                  <p>Bạn đang <b>TỪ CHỐI</b> yêu cầu. Vui lòng nhập lý do:</p>
                  <textarea
                    rows={5}
                    placeholder="Lý do từ chối…"
                    value={reason}
                    onChange={(e)=>{ setReason(e.target.value); if (rejectError) setRejectError(''); }}
                  />
                  {rejectError && <div className="form-error">{rejectError}</div>}
                </>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={closeConfirm}>Hủy</button>
              <button className="btn primary" onClick={doConfirm}>
                {confirm.type === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast container ở góc dưới phải */}
      <ToastContainer position="bottom-right" autoClose={3000} newestOnTop />
    </div>
  );
}
