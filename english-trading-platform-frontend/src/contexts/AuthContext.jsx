import React, { createContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true,
});

function parseJwt(token) {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
}

const HAS_SESSION = 'hasSession';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // {id,email,role,avatarUrl}
  const [role, setRole] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const applyAccessToken = useCallback((accessToken) => {
    if (!accessToken) {
      delete api.defaults.headers.common.Authorization;
      setUser(null); setRole(null);
      return;
    }
    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    const p = parseJwt(accessToken);
    if (p) { setUser({ id: p.sub, email: p.email }); setRole(p.role); }
  }, []);

  // Hàm lấy hồ sơ hiện tại
  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser({ id: data.id, email: data.email, role: data.role, avatarUrl: data.avatarUrl });
      setRole(data.role);
    } catch {}
  }, []);

  // ---- Interceptor: auto refresh 1 lần, KHÔNG cho chính /auth/refresh
  const refreshPromiseRef = useRef(null);
  const hasSession = () => localStorage.getItem(HAS_SESSION) === '1';
  const markSession = (on) => on ? localStorage.setItem(HAS_SESSION, '1') : localStorage.removeItem(HAS_SESSION);

  const acceptExternalToken = useCallback(async (token) => {
    // Google callback đưa access token qua URL
    applyAccessToken(token);
    // Quan trọng: phiên Google cũng đã được BE set cookie rt -> đánh dấu có phiên
    markSession(true);
    await fetchMe(); // lấy avatarUrl/role sau Google callback
  }, [applyAccessToken, fetchMe]);

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (res) => res,
      async (error) => {
        const original = error.config;
        const status = error?.response?.status;

        // Nếu không có response -> lỗi mạng, bỏ qua
        if (!status) return Promise.reject(error);

        const url = String(original?.url ?? '');
        const isAuthEndpoint =
          url.includes('/auth/refresh') ||
          url.includes('/auth/login') ||
          url.includes('/auth/logout');

        // Chỉ thử refresh nếu 401, không phải endpoint auth, chưa retry và đã có phiên
        if (status !== 401 || isAuthEndpoint || original?._retry || !hasSession()) {
          return Promise.reject(error);
        }

        original._retry = true;
        try {
          if (!refreshPromiseRef.current) {
            refreshPromiseRef.current = api.post('/auth/refresh');
          }

          const { data } = await refreshPromiseRef.current.finally(() => {
            refreshPromiseRef.current = null;
          });

          applyAccessToken(data.access_token);
          if (data.profile) {
            setUser(data.profile);
            setRole(data.profile.role);
          }
          original.headers = {
            ...(original.headers || {}),
            Authorization: `Bearer ${data.access_token}`,
          };
          return api.request(original);
        } catch (e) {
          // Refresh thất bại -> xoá phiên cục bộ
          markSession(false);
          applyAccessToken(null);
          return Promise.reject(e);
        }
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, [applyAccessToken]);

  // Khởi động app: thử refresh 1 lần (nếu chưa có cookie sẽ nhận 401 và dừng)
  useEffect(() => {
    (async () => {
      try {
        if (hasSession()) {
          const { data } = await api.post('/auth/refresh');
          applyAccessToken(data.access_token);
          if (data.profile) {
            setUser(data.profile);
            setRole(data.profile.role);
          }else {
            await fetchMe(); // fallback
          }
        }
      } finally {
        setInitializing(false);
      }
    })();
  }, [applyAccessToken, fetchMe]);

  const login = useCallback(async (emailOrPhone, password) => {
    const { data } = await api.post('/auth/login', { email: emailOrPhone, password });
    applyAccessToken(data.access_token);
    if (data.id) setUser({ id: data.id, email: data.email, role: data.role, avatarUrl: data.avatarUrl });
    setRole(data.role);
    markSession(true); // đã có cookie rt từ BE
  }, [applyAccessToken]);

  const register = useCallback(
    async (email, password, r) => {
      await api.post('/auth/register', { email, password, role: r });
      await login(email, password);
    },[login]
  );

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    markSession(false);
    applyAccessToken(null);
  }, [applyAccessToken]);

  const value = useMemo(
    () => ({ user, role, initializing, login, register, logout, acceptExternalToken  }),
    [user, role, initializing, login, register, logout, acceptExternalToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
