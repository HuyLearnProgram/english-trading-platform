import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  apiListUsers,
  apiLockUser,
  apiUnlockUser,
} from '@apis/user';
import '@styles/admin/AdminUsers.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getErrMsg } from '@utils/constants';
import { Account_ROLES, Account_STATUS, Account_badgeClass, Account_SORTS } from '@utils/constants';
import AccountLockModal from '@components/admin/AccountLockModal';

export default function AdminUsers() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // filters
  const [qEmail, setQEmail] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('email_asc');

  // modal state
  const [confirm, setConfirm] = useState({ open: false, id: null, type: null }); // 'lock' | 'unlock'

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await apiListUsers({
        page,
        limit: meta.limit,
        emailLike: qEmail || undefined,
        role: role || undefined,
        status: status || undefined,
      });
      setItems(data.items || []);
      setMeta(data.meta || { total: 0, page, limit: meta.limit, totalPages: 1 });
    } catch (e) {
      toast.error(`Tải dữ liệu thất bại: ${getErrMsg(e)}`);
    } finally {
      setLoading(false);
    }
  }, [qEmail, role, status, meta.limit]);

  useEffect(() => { fetchData(1); }, [fetchData]);
  const onSearch = () => fetchData(1);

  // Phân trang
  const prev = () => meta.page > 1 && fetchData(meta.page - 1);
  const next = () => meta.page < meta.totalPages && fetchData(meta.page + 1);

  // Sắp xếp client-side
  const viewItems = useMemo(() => {
    const arr = [...items];
    switch (sort) {
      case 'email_desc':
        arr.sort((a, b) => String(b.email).localeCompare(String(a.email)));
        break;
      case 'status':
        arr.sort((a, b) => String(a.status).localeCompare(String(b.status)));
        break;
      case 'role':
        arr.sort((a, b) => (a.roles || []).join(',').localeCompare((b.roles || []).join(',')));
        break;
      case 'email_asc':
      default:
        arr.sort((a, b) => String(a.email).localeCompare(String(b.email)));
        break;
    }
    return arr;
  }, [items, sort]);

  // Modal helpers
  const openLock = (u) => setConfirm({ open: true, id: u.id, type: 'lock' });
  const openUnlock = (u) => setConfirm({ open: true, id: u.id, type: 'unlock' });
  const closeConfirm = () => setConfirm({ open: false, id: null, type: null });

  // Xử lý xác nhận (nhận reason từ modal nếu type === 'lock')
  const doConfirm = async (reasonText = '') => {
    if (!confirm.open || !confirm.id) return;
    try {
      if (confirm.type === 'lock') {
        const tId = toast.loading('Đang khóa tài khoản…');
        // optimistic để UI phản hồi tức thì
        setItems(prev => prev.map(u => u.id === confirm.id ? { ...u, status: 'hidden' } : u));
        closeConfirm(); // đóng modal ngay
        await apiLockUser(confirm.id, { reason: reasonText });
        toast.update(tId, { render: 'Đã khóa tài khoản và đã gửi email.', type: 'success', isLoading: false, autoClose: 2500 });
      } else {
        const tId = toast.loading('Đang mở khóa…');
        setItems(prev => prev.map(u => u.id === confirm.id ? { ...u, status: 'visible' } : u));
        closeConfirm();
        await apiUnlockUser(confirm.id);
        toast.update(tId, { render: 'Đã mở khóa tài khoản.', type: 'success', isLoading: false, autoClose: 2000 });
      }
    } catch (e) {
      await fetchData(meta.page); // rollback nếu lỗi
      toast.dismiss();
      toast.error(getErrMsg(e));
    }
  };

  const onKeyEnter = (e) => { if (e.key === 'Enter') onSearch(); };

  return (
    <div className="admin-page">
      <h2 className="admin-title">Quản lý người dùng</h2>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search">
          <input
            placeholder="Tìm theo email"
            value={qEmail}
            onChange={(e)=>setQEmail(e.target.value)}
            onKeyDown={onKeyEnter}
          />
          <select value={role} onChange={(e)=>setRole(e.target.value)}>
            {Account_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <select value={status} onChange={(e)=>setStatus(e.target.value)}>
            {Account_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          <select value={sort} onChange={(e)=>setSort(e.target.value)} title="Sắp xếp">
            {Account_SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
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
                  <th>Người dùng</th>
                  <th>Phone</th>
                  <th>Roles</th>
                  <th className="text-center">Status</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {viewItems.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>
                      <div className="user-cell">
                        <img className="user-avatar" src={u.avatarUrl || 'https://static.antoree.com/avatar.png'} alt={u.email}/>
                        <div>
                          <div className="cell-title">{u.email}</div>
                          {!!u.status && <div className="cell-sub">ID: {u.id}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="cell-sub">{u.phone || '—'}</td>
                    <td>
                      <div className="cell-sub">{(u.roles && u.roles.length) ? u.roles.join(', ') : (u.role || '—')}</div>
                    </td>
                    <td className="text-center">
                      <span className={Account_badgeClass(u.status)}>{u.status === 'visible' ? 'Hiện' : 'Ẩn'}</span>
                    </td>
                    <td className="text-right">
                      <div className="row-actions">
                        <button
                          className="btn btn-sm btn-lock"
                          disabled={u.status === 'hidden'}
                          onClick={() => openLock(u)}
                          title="Khóa tài khoản"
                        >
                          Khóa
                        </button>
                        <button
                          className="btn btn-sm btn-unlock"
                          disabled={u.status === 'visible'}
                          onClick={() => openUnlock(u)}
                          title="Mở khóa tài khoản"
                        >
                          Mở khóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!viewItems.length && (
                  <tr><td colSpan={6} className="cell-sub">Không có dữ liệu.</td></tr>
                )}
              </tbody>
            </table>

            <div className="pagination slim">
              <div className="muted">Tổng: <b>{meta.total}</b></div>
              <div className="pager">
                <button className="btn" onClick={prev} disabled={meta.page <= 1}>Trước</button>
                <span className="pager-text">Trang {meta.page}/{meta.totalPages}</span>
                <button className="btn" onClick={next} disabled={meta.page >= meta.totalPages}>Sau</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <AccountLockModal
        open={confirm.open}
        type={confirm.type}
        onClose={closeConfirm}
        onConfirm={doConfirm}
      />

      <ToastContainer position="bottom-right" autoClose={3000} newestOnTop />
    </div>
  );
}
