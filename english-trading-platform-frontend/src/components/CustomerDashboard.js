import React, { useContext, useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import '../styles/CustomerDashboard.css';
import '../styles/CustomerHome.css';
import Footer from './Footer';
import ConsultationForm from './blog/ConsultationForm';

const CustomerDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [stuck, setStuck] = useState(false);
  const [showAdviseForm, setShowAdviseForm] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 0);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Tự cuộn tới section khi URL có hash (#reviews/#about)
  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location]);

  const handleLogout = () => { logout(); navigate('/login'); };

  // Tính trạng thái active cho items dùng anchor
  const isHome = location.pathname.startsWith('/customer/home');
  const isReviews = isHome && location.hash === '#reviews';
  const isAbout   = isHome && location.hash === '#about';

  const handleAdvise = () => {
    setShowAdviseForm(true);
  }

  return (
    <div className="page">
      <header className={`hero ${stuck ? 'is-stuck' : ''}`}>
        <div className="hero-inner">
          <div className="nav-container">
            <div className="brand" onClick={() => navigate('/home')} style={{cursor:'pointer'}}>antoree</div>

            <nav className="nav">
              {/* Trang Giáo viên (home) */}
              <NavLink to="/home" end
                className={({ isActive }) =>
                  isActive && !isReviews && !isAbout ? 'nav-active' : undefined
                }
              >
                Giáo viên
              </NavLink>

              {/* Blog */}
              <NavLink to="/blog" className={({ isActive }) => (isActive ? 'nav-active' : undefined)}>
                Blog
              </NavLink>

              {/* Hai anchor trong trang home */}
              <Link to="/home#reviews" className={isReviews ? 'nav-active' : undefined}>
                Đánh giá của học viên
              </Link>

              <Link to="/home#about" className={isAbout ? 'nav-active' : undefined}>
                Về chúng tôi
              </Link>
            </nav>
          </div>

          <div className="actions">
            <button className="cta-top" onClick={handleAdvise}>Học thử MIỄN PHÍ ngay</button>
            {user ? (
              <button onClick={handleLogout} className="logout-button">Đăng xuất</button>
            ) : (
              <button onClick={() => navigate('/login')} className="logout-button">Đăng nhập</button>
            )}
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <Outlet />
      </main>

      <Footer />
      {showAdviseForm && (
        <ConsultationForm
          variant="modal"
          isOpen={showAdviseForm}
          onClose={() => setShowAdviseForm(false)}
          source="home"
        />
      )}
      <ToastContainer position="bottom-right" theme="colored" />
    </div>
  );
};

export default CustomerDashboard;