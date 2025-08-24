// src/App.js
import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './contexts/AuthContext';
import Register from './components/Register';
import Login from './components/Login';
import CustomerDashboard from './components/CustomerDashboard';
import CustomerHome from './pages/guest/CustomerHome';
import BlogDetailPage from './pages/guest/BlogDetailPage';
import BlogPage from './pages/guest/BlogPage';

const App = () => {
  const { user, role } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/customer" element={<PrivateRoute component={CustomerDashboard} role="customer" />}>
          <Route path="home" element={<CustomerHome />} />
          <Route path='blog' element={<BlogPage />} />
          <Route path="blog/:slug" element={<BlogDetailPage />} />
        </Route>
        <Route
          path="/"
          element={
            user ? (
              <NavigateToDashboard role={role} />
            ) : (
              <Navigate to="/register" />
            )
          }
        />
      </Routes>
    </Router>
  );
};

const PrivateRoute = ({ component: Component, role, ...rest }) => {
  const { user, role: userRole, initializing } = useContext(AuthContext);
  if (initializing) return null; // hoặc spinner
  return user && userRole === role ? <Component {...rest} /> : <Navigate to="/login" replace />;
};


const NavigateToDashboard = ({ role }) => {
  switch (role) {
    case 'customer':
      return <Navigate to="/customer/home" />;
    default:
      return <Navigate to="/login" />;
  }
};

const Main = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default Main;
