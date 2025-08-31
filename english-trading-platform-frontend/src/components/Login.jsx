import React, { useState, useContext } from 'react';
import { AuthContext } from '@contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import '@styles/Auth.css'; // có thêm phần CSS mới ở dưới

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState(''); // email or phone
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Cho phép “email hoặc số ĐT”. Nếu có @ thì check email, còn lại để backend quyết định.
    const looksLikeEmail = username.includes('@');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (looksLikeEmail && !emailRegex.test(username)) {
      setError('Invalid email format');
      return;
    }

    try {
      await login(username, password); // backend của bạn đang kiểm tra email format
      navigate('/');
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Login failed';
      setError(msg);
      if (msg.includes('User not found')) alert('Account does not exist. Please check your email or register.');
      else if (msg.includes('Invalid password')) alert('Incorrect password. Please try again.');
      else alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="login-page">
      {/* LEFT PANEL */}
      <aside className="panel-left">
        <div className="left-illustration" />
        <div className="left-download">
          <div className="left-text">
            <div className="left-title">Download Mama app</div>
            <div className="left-sub">Follow your learning effectively with MAMA App</div>

            <div className="store-badges">
              <a href="https://play.google.com/store/apps/details?id=com.antoree.mama" target="_blank" rel="noreferrer">
                <img src="https://mama.antoree.com/assets/google-play-73fd19aa.png" alt="Get it on Google Play" />
              </a>
              <a href="https://apps.apple.com/vn/app/antoree-mama/id1645901503" target="_blank" rel="noreferrer">
                <img src="https://mama.antoree.com/assets/app-store-881e5ef5.png" alt="Download on the App Store" />
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT PANEL */}
      <main className="panel-right">
        <div className="right-card">
          {/* Header: logo + language */}
          <div className="brand">
            <div className="brand-logo">  {/* khung cố định, crop bên trong */}
              <img
                src="https://mama.antoree.com/assets/logo-antoree-b-19a12d87.png"
                alt="antoree"
                decoding="async"
              />
            </div>

            <div className="brand-lang">
              <button className="lang-btn" type="button">
                <span role="img" aria-label="english-icon">🇬🇧</span>&nbsp; English
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                  <path fillRule="nonzero" d="M13.069 5.157L8.384 9.768a.546.546 0 01-.768 0L2.93 5.158a.552.552 0 00-.771 0 .53.53 0 000 .759l4.684 4.61c.641.631 1.672.63 2.312 0l4.684-4.61a.53.53 0 000-.76.552.552 0 00-.771 0z"/>
                </svg>
              </button>
            </div>
          </div>

          <h1 className="login-title">Login</h1>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && <p className="form-error">{error}</p>}

            {/* Email / phone */}
            <label className="field">
              <span className="field-label">Email or phone number</span>
              <div className="input-group">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                    <g fillRule="evenodd">
                      <path d="M13.689 11.132c1.155 1.222 1.953 2.879 2.183 4.748a1.007 1.007 0 01-1 1.12H3.007a1.005 1.005 0 01-1-1.12c.23-1.87 1.028-3.526 2.183-4.748.247.228.505.442.782.633-1.038 1.069-1.765 2.55-1.972 4.237L14.872 16c-.204-1.686-.93-3.166-1.966-4.235a7.01 7.01 0 00.783-.633zM8.939 1c1.9 0 3 2 4.38 2.633a2.483 2.483 0 01-1.88.867c-.298 0-.579-.06-.844-.157A3.726 3.726 0 017.69 5.75c-1.395 0-3.75.25-3.245-1.903C5.94 3 6.952 1 8.94 1z"></path>
                      <path d="M8.94 2c2.205 0 4 1.794 4 4s-1.795 4-4 4c-2.207 0-4-1.794-4-4s1.793-4 4-4m0 9A5 5 0 108.937.999 5 5 0 008.94 11"></path>
                    </g>
                  </svg>
                </span>
                <input
                  type="text"
                  name="userName"
                  placeholder="Email or phone number"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </label>

            {/* Password */}
            <label className="field">
              <span className="field-label">Password</span>
              <div className="input-group">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M4 5v-.8C4 1.88 5.79 0 8 0s4 1.88 4 4.2V5h1.143c.473 0 .857.448.857 1v9c0 .552-.384 1-.857 1H2.857C2.384 16 2 15.552 2 15V6c0-.552.384-1 .857-1H4zM3 15h10V6H3v9zm5.998-3.706L9.5 12.5h-3l.502-1.206A1.644 1.644 0 016.5 10.1c0-.883.672-1.6 1.5-1.6s1.5.717 1.5 1.6c0 .475-.194.901-.502 1.194zM11 4.36C11 2.504 9.657 1 8 1S5 2.504 5 4.36V5h6v-.64z"></path>
                  </svg>
                </span>
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="pw-toggle"
                  aria-label="Show/Hide password"
                  onClick={() => setShowPw((v) => !v)}
                >
                  {showPw ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" class="euiIcon euiIcon--medium euiIcon--inherit euiButtonIcon__icon" focusable="false" role="img" aria-hidden="true"><path d="M5.318 13.47l.776-.776A6.04 6.04 0 008 13c1.999 0 3.74-.956 5.225-2.587A12.097 12.097 0 0014.926 8a12.097 12.097 0 00-1.701-2.413l-.011-.012.707-.708c1.359 1.476 2.045 2.976 2.058 3.006.014.03.021.064.021.098v.06a.24.24 0 01-.02.097C15.952 8.188 13.291 14 8 14a7.03 7.03 0 01-2.682-.53zM2.04 11.092C.707 9.629.034 8.158.02 8.128A.24.24 0 010 8.03v-.059c0-.034.007-.068.02-.098C.048 7.813 2.709 2 8 2c.962 0 1.837.192 2.625.507l-.78.78A6.039 6.039 0 008 3c-2 0-3.74.956-5.225 2.587a12.098 12.098 0 00-1.701 2.414 12.11 12.11 0 001.674 2.383l-.708.708zM8.362 4.77L7.255 5.877a2.262 2.262 0 00-1.378 1.378L4.77 8.362A3.252 3.252 0 018.362 4.77zm2.86 2.797a3.254 3.254 0 01-3.654 3.654l1.06-1.06a2.262 2.262 0 001.533-1.533l1.06-1.06zm-9.368 7.287a.5.5 0 01-.708-.708l13-13a.5.5 0 01.708.708l-13 13z"></path></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" class="euiIcon euiIcon--medium euiIcon--inherit euiButtonIcon__icon" focusable="false" role="img" aria-hidden="true"><path d="M15.98 7.873c.013.03.02.064.02.098v.06a.24.24 0 01-.02.097C15.952 8.188 13.291 14 8 14S.047 8.188.02 8.128A.24.24 0 010 8.03v-.059c0-.034.007-.068.02-.098C.048 7.813 2.709 2 8 2s7.953 5.813 7.98 5.873zm-1.37-.424a12.097 12.097 0 00-1.385-1.862C11.739 3.956 9.999 3 8 3c-2 0-3.74.956-5.225 2.587a12.098 12.098 0 00-1.701 2.414 12.095 12.095 0 001.7 2.413C4.26 12.043 6.002 13 8 13s3.74-.956 5.225-2.587A12.097 12.097 0 0014.926 8c-.08-.15-.189-.343-.315-.551zM8 4.75A3.253 3.253 0 0111.25 8 3.254 3.254 0 018 11.25 3.253 3.253 0 014.75 8 3.252 3.252 0 018 4.75zm0 1C6.76 5.75 5.75 6.76 5.75 8S6.76 10.25 8 10.25 10.25 9.24 10.25 8 9.24 5.75 8 5.75zm0 1.5a.75.75 0 100 1.5.75.75 0 000-1.5z"></path></svg>
                  )}
                </button>
              </div>
            </label>

            <button type="submit" className="btn-login">Login</button>
            <button
              type="button"
              className="btn-google"
              onClick={() => { window.location.href = `${API_URL}/auth/google`; }}
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt=""
                aria-hidden="true"
              />
              <span>Đăng nhập bằng Google</span>
            </button>
            <button type="button" className="btn-link" onClick={() => alert('Forgot password flow here')}>
              Forgot password
            </button>
          </form>


          <div className="help-links">
            <Link to="/help" className="link">Help Center</Link>
            <span className="divider" />
            <button type="button" className="link">Policy</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
