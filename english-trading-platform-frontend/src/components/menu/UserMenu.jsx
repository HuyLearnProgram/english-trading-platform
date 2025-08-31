// src/components/menu/UserMenu.jsx
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@contexts/AuthContext';
import { fetchUserById, logoutUser } from '@apis/user';
import '@styles/menu/UserMenu.css';

/* Lấy chữ cái viết tắt cho avatar fallback */
function initials(str) {
  if (!str) return 'U';
  const parts = String(str).trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'U';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * props:
 *  - user: { id, email, role?, avatarUrl?, name? }
 *  - onLogout?: () => void    (tuỳ chọn, nếu không truyền sẽ dùng AuthContext.logout)
 */
const UserMenu = ({ user: userProp, onLogout }) => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(userProp);
  const menuRef = useRef(null);
  const btnRef = useRef(null);
  const navigate = useNavigate();
  const { logout: ctxLogout } = useContext(AuthContext);

  // Đồng bộ khi prop thay đổi
  useEffect(() => setUser(userProp), [userProp]);

  // Nạp thêm role/avatarUrl nếu thiếu
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (userProp?.id && (!userProp.role || !userProp.avatarUrl)) {
        try {
          const { data } = await fetchUserById(userProp.id);
          if (!cancelled) setUser((u) => ({ ...u, ...data }));
        } catch {}
      }
    })();
    return () => { cancelled = true; };
  }, [userProp?.id, userProp?.role, userProp?.avatarUrl]);

  useEffect(() => {
    const onDoc = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !btnRef.current?.contains(e.target)
      ) setOpen(false);
    };
    const onEsc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc, { passive: true });
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  const go = (path) => { setOpen(false); navigate(path); };
  const canSeeAdmin = String(user?.role || '').toUpperCase() === 'ADMIN';

  const handleLogout = async () => {
    try { await logoutUser(); } catch {}
    // ưu tiên onLogout từ parent; fallback dùng context
    if (onLogout) onLogout(); else ctxLogout?.();
  };

  return (
    <div className="user-menu">
      <button
        ref={btnRef}
        className="avatar-btn"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt="Avatar"
            className="avatar-img"
            loading="lazy"
            decoding="async"
            draggable="false"
          />
        ) : (
          <span className="avatar-fallback">
            {initials(user?.fullName || user?.name || user?.email)}
          </span>
        )}
      </button>

      {open && (
        <div ref={menuRef} className="user-menu-popover" role="menu" aria-label="Account options">
          <div className="user-menu-header">
            <div className="user-menu-name">{user?.fullName || user?.name || user?.email || 'User'}</div>
            <div className="user-menu-role">{user?.role || 'Customer'}</div>
          </div>

          <button className="user-menu-item" role="menuitem" onClick={() => go('/account/settings')}>
            <span className="umi-icon">⚙️</span> Account settings
          </button>

          <button className="user-menu-item" role="menuitem" onClick={() => go('/calendar')}>
            <span className="umi-icon">📅</span> Calendar
          </button>

          {canSeeAdmin && (
            <button className="user-menu-item" role="menuitem" onClick={() => go('/admin')}>
              <span className="umi-icon">🗂️</span> Admin dashboard
            </button>
          )}

          <div className="user-menu-sep" role="separator" />

          <button className="user-menu-item danger" role="menuitem" onClick={handleLogout}>
            <span className="umi-icon">↩️</span> Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
