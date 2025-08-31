import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './contexts/AuthContext';
import Register from '@components/Register';
import Login from '@components/Login';

import CustomerDashboard from '@pages/guest/CustomerDashboard';
import CustomerHome from '@pages/guest/CustomerHome';
import BlogDetailPage from '@pages/guest/BlogDetailPage';
import BlogPage from '@pages/guest/BlogPage';

// --- Admin pages ---
import AdminDashboard from '@pages/admin/AdminDashboard';
import AdminOverview from '@pages/admin/AdminOverview';
import AdminConsultations from '@pages/admin/AdminConsultations';
import BlogCategoryPage from '@pages/guest/BlogCategoryPage';
import TeacherProfile from '@pages/guest/TeacherProfile';
import AdminRefundRequests from '@pages/admin/AdminRefundRequests';
import AdminUsers from '@pages/admin/AdminUsers';

// --- Auth pages ---
import GoogleCallback from '@pages/auth/GoogleCallback';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Auth pages */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login/callback" element={<GoogleCallback />} />

        {/* ===== PUBLIC CUSTOMER PAGES (không yêu cầu đăng nhập) ===== */}
        {/* Dùng lại layout CustomerDashboard */}
        <Route element={<CustomerDashboard />}>
          <Route path="/home" element={<CustomerHome />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogDetailPage />} />
          <Route path="/blog/category/:slug" element={<BlogCategoryPage />} />
          <Route path="/blog/search" element={<BlogCategoryPage />} />
          <Route path="/teacher/:id" element={<TeacherProfile/>} />
        </Route>

        {/* ===== ADMIN (yêu cầu role admin) ===== */}
        <Route
          path="/admin"
          element={<PrivateRoute component={AdminDashboard} roles={['admin']} />}
        >
          <Route index element={<AdminOverview />} />
          <Route path="consultations" element={<AdminConsultations />} />
          <Route path="refunds" element={<AdminRefundRequests />} />
          <Route path="account" element={<AdminUsers />} />
        </Route>

        {/* ===== ROOT REDIRECT =====
            - Nếu đã đăng nhập & là admin -> /admin
            - Còn lại -> /customer/home (public)
        */}
        <Route path="/" element={<RootRedirect />} />

        {/* fallback 404 -> home */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
};

/* ------------ Guards & helpers ------------ */
const PrivateRoute = ({ component: Component, roles = [], ...rest }) => {
  const { user, role: userRole, initializing } = useContext(AuthContext);
  if (initializing) return null;

  if (!user) return <Navigate to="/login" replace />;
  if (roles.length && !roles.includes(userRole)) return <Navigate to="/login" replace />;

  return <Component {...rest} />;
};

const RootRedirect = () => {
  const { user, role, initializing } = useContext(AuthContext);
  if (initializing) return null;
  if (user && role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/home" replace />;
};

const Main = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default Main;
