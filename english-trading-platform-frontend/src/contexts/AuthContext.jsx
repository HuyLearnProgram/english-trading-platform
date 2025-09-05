import React, { createContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axiosInstance, { applyAccessToken } from '@utils/axios';

export const AuthContext = createContext();


function parseJwt(token) {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
}

const HAS_SESSION = 'hasSession';
const ACCESS_TOKEN = 'accessToken';     
const USER_SNAPSHOT = 'userSnapshot';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // {id,email,role,avatarUrl}
  const [role, setRole] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // 
  
  const markSession = (on) => on ? localStorage.setItem(HAS_SESSION, '1') : localStorage.removeItem(HAS_SESSION);
  const hasSession = () => localStorage.getItem(HAS_SESSION) === '1';

  const setTokenAndUser = useCallback((accessToken) => {
    if (!accessToken) {
      applyAccessToken(null);
      setUser(null); setRole(null);
      localStorage.removeItem(USER_SNAPSHOT);
      return;
    }
    applyAccessToken(accessToken);
    const p = parseJwt(accessToken);
    if (p) {
      const u = { id: p.sub, email: p.email, role: p.role };
      setUser(u); setRole(u.role);
      localStorage.setItem(ACCESS_TOKEN, accessToken);
      localStorage.setItem(USER_SNAPSHOT, JSON.stringify(u));
    }
  }, []);

  // Hàm lấy hồ sơ hiện tại
  const fetchMe = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/auth/me');
      setUser({ id: data.id, email: data.email, role: data.role, avatarUrl: data.avatarUrl });
      setRole(data.role);
    } catch {}
  }, []);

  // ---- Interceptor: auto refresh 1 lần, KHÔNG cho chính /auth/refresh
  const refreshPromiseRef = useRef(null);


  useEffect(() => {
    const interceptor = axiosInstance.interceptors.response.use(
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
          const { data } = await axiosInstance.post('/auth/refresh');
          setTokenAndUser(data.access_token);
          if (data.profile) {
            setUser(data.profile);
            setRole(data.profile.role);
          }
          original.headers = { ...(original.headers || {}), Authorization: `Bearer ${data.access_token}` };
          return axiosInstance.request(original);
        } catch (e) {
          markSession(false);
          setTokenAndUser(null);
          return Promise.reject(e);
        }
      }
    );

    return () => axiosInstance.interceptors.response.eject(interceptor);
  }, [setTokenAndUser]);

  // Khởi động app: thử refresh 1 lần (nếu chưa có cookie sẽ nhận 401 và dừng)
  useEffect(() => {
    (async () => {
      try {

        // 1) Dựng lại tức thì từ localStorage (không chờ mạng)
        const cached = localStorage.getItem(ACCESS_TOKEN);
        if (cached) {
          applyAccessToken(cached);
          // Tùy chọn: dựng nhanh avatar/role từ snapshot
          const snap = localStorage.getItem(USER_SNAPSHOT);
          if (snap) {
            try { const u = JSON.parse(snap); setUser(u); setRole(u.role); } catch {}
          }
        }

        // 2) Sau đó thử refresh nếu có phiên RT cookie
        if (hasSession()) {
          const { data } = await axiosInstance.post('/auth/refresh');
          setTokenAndUser(data.access_token);
          if (data.profile) {
            setUser(data.profile);
            setRole(data.profile.role);
            localStorage.setItem(USER_SNAPSHOT, JSON.stringify(data.profile));
          } else {
            await fetchMe();
          }
        }
      } finally {
        setInitializing(false);
      }
    })();
  }, [setTokenAndUser, fetchMe]);

  const login = useCallback(async (emailOrPhone, password) => {
    const { data } = await axiosInstance.post('/auth/login', { email: emailOrPhone, password });
    setTokenAndUser(data.access_token);
    setRole(data.role);
    markSession(true); // đã có cookie rt từ BE
    // lưu snapshot rõ ràng hơn (nếu cần)
    localStorage.setItem(USER_SNAPSHOT, JSON.stringify({ id: data.id, email: data.email, role: data.role, avatarUrl: data.avatarUrl }));
  }, [setTokenAndUser]);

  const register = useCallback(
    async (email, password, r) => {
      await axiosInstance.post('/auth/register', { email, password, role: r });
      await login(email, password);
    },[login]
  );

  const logout = useCallback(async () => {
    try { await axiosInstance.post('/auth/logout'); } catch {}
    markSession(false);
    setTokenAndUser(null);
  }, [setTokenAndUser]);

  const acceptExternalToken = useCallback(async (token) => {
    setTokenAndUser(token);
    markSession(true);
    await fetchMe();
  }, [setTokenAndUser, fetchMe]);

  // 3) Đồng bộ đa-tab
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === ACCESS_TOKEN) {
        // e.newValue: null => logout; khác null => login
        setTokenAndUser(e.newValue || null);
        if (!e.newValue) { setUser(null); setRole(null); }
      }
      if (e.key === USER_SNAPSHOT && e.newValue) {
        try { const u = JSON.parse(e.newValue); setUser(u); setRole(u.role); } catch {}
      }
      if (e.key === HAS_SESSION && e.newValue !== '1') {
        // phiên RT bị xóa ở tab khác
        setTokenAndUser(null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [setTokenAndUser]);

  const value = useMemo(
    () => ({ user, role, initializing, login, register, logout, acceptExternalToken  }),
    [user, role, initializing, login, register, logout, acceptExternalToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
