import React, { useCallback, useEffect, useRef, useState } from 'react';
import { fetchNotifications, markNotificationRead, fetchUnreadCount } from '@apis/notifications';
import '@styles/menu/NotificationMenu.css';
import { timeAgo } from '@utils/constants';



const NotificationMenu = ({ userId }) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const btnRef = useRef(null);
  const popRef = useRef(null);

  // ====== LOAD LIST khi mở popover ======
  const loadList = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setErr('');
    try {
      const { data } = await fetchNotifications({ userId });
      const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setItems(sorted);
      // đồng bộ lại badge theo list
      const unread = sorted.reduce((acc, n) => acc + (n.read ? 0 : 1), 0);
      setUnreadCount(unread);
    } catch (e) {
      setErr('Không tải được thông báo');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { if (open) loadList(); }, [open, loadList]);

  // ====== POLL UNREAD COUNT ngay cả khi đóng popover ======
  const loadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await fetchUnreadCount({ userId });
      setUnreadCount(Number(data?.count || 0));
    } catch {/* bỏ qua */}
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let timer = null;
    let cancelled = false;

    const kick = async () => {
      if (cancelled) return;
      await loadCount();
    };

    kick();                              // nạp ngay khi mount/đổi user
    timer = setInterval(kick, 20000);    // poll mỗi 20s

    // refresh khi tab active lại / cửa sổ focus
    const onFocus = () => kick();
    const onVisibility = () => { if (!document.hidden) kick(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [userId, loadCount]);

  // ====== Close on outside / ESC ======
  useEffect(() => {
    const onDoc = (e) => {
      if (popRef.current && !popRef.current.contains(e.target) && !btnRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    const onEsc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc, { passive: true });
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  // ====== Actions ======
  const onItemClick = async (id) => {
    try {
      await markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));   // cập nhật badge ngay
    } catch {}
  };

  const showBadge = unreadCount > 0;

  return (
    <div className="notify">
      <button
        ref={btnRef}
        className="notify-btn"
        aria-label="Thông báo"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm6-6V11a6 6 0 1 0-12 0v5L4 18v2h16v-2l-2-2z" fill="currentColor"/>
        </svg>
        {showBadge && (
          <span className="notify-badge-count" aria-label={`${unreadCount} thông báo chưa đọc`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div ref={popRef} className="notify-popover" role="menu" aria-label="Notifications">
          <div className="notify-header">
            <div className="notify-title">Thông báo ({items.length})</div>
            <button className="notify-reload" onClick={loadList} title="Tải lại" aria-label="Tải lại">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M17.65 6.35A7.95 7.95 0 0 0 12 4V1L7 6l5 5V7c2.76 0 5 2.24 5 5 0 1.64-.8 3.09-2.02 4l1.46 1.46A7.94 7.94 0 0 0 20 12c0-2.21-.9-4.21-2.35-5.65zM6 12c0-1.64.8-3.09 2.02-4L6.56 6.54A7.94 7.94 0 0 0 4 12c0 4.42 3.58 8 8 8v3l5-5-5-5v3c-2.76 0-5-2.24-5-5z"/>
              </svg>
            </button>
          </div>

          <div className="notify-divider" />

          {loading ? (
            <div className="notify-empty">Đang tải…</div>
          ) : err ? (
            <div className="notify-empty">{err}</div>
          ) : items.length === 0 ? (
            <div className="notify-empty">
              <div className="notify-bell-ghost" aria-hidden>🔔</div>
              Không có thông báo
            </div>
          ) : (
            <div className="notify-list">
              {items.map((n) => (
                <button
                  key={n.id}
                  className={`notify-item ${n.read ? '' : 'unread'}`}
                  onClick={() => onItemClick(n.id)}
                >
                  <div className="notify-dot" aria-hidden />
                  <div className="notify-content">
                    <div className="notify-row">
                      <div className="notify-item-title">{n.title}</div>
                      <div className="notify-time">{timeAgo(n.createdAt)}</div>
                    </div>
                    {n.body && <div className="notify-item-body">{n.body}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationMenu;
