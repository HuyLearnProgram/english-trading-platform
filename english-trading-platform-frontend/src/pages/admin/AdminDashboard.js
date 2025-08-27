import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import '@styles/Admin.css';

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="admin">
      <aside className="admin-sidebar">
        <div className="admin-brand" onClick={() => navigate('/admin')} role="button">Admin Panel</div>
        <nav className="admin-nav">
          <NavLink end to="/admin" className="admin-link">Tổng quan</NavLink>
          <NavLink to="/admin/consultations" className="admin-link">Quản lý tư vấn</NavLink>
          <NavLink to="/home" className="admin-link">Trang chủ</NavLink>
        </nav>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
