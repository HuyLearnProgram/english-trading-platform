import React, { createContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // http://localhost:3000
  withCredentials: true,
});

// Parse JWT
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const applyAccessToken = useCallback((accessToken) => {
    if (!accessToken) {
      delete api.defaults.headers.common.Authorization;
      setUser(null);
      setRole(null);
      return;
    }
    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    const payload = parseJwt(accessToken);
    if (payload) {
      setUser({ id: payload.sub, email: payload.email });
      setRole(payload.role);
    }
  }, []);

  // ---- Interceptor: auto refresh 1 lần, KHÔNG cho chính /auth/refresh
  const refreshPromiseRef = useRef(null);

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

        // Chỉ xử lý 401 cho request không thuộc auth và chưa retry
        if (status !== 401 || isAuthEndpoint || original?._retry) {
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
          original.headers = {
            ...(original.headers || {}),
            Authorization: `Bearer ${data.access_token}`,
          };
          return api.request(original);
        } catch (e) {
          // refresh thất bại -> coi như đăng xuất
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
        const { data } = await api.post('/auth/refresh');
        applyAccessToken(data.access_token);
      } catch {
        // chưa có cookie hoặc cookie hết hạn -> bỏ qua
      } finally {
        setInitializing(false);
      }
    })();
  }, [applyAccessToken]);

  const login = useCallback(async (emailOrPhone, password) => {
    const { data } = await api.post('/auth/login', { email: emailOrPhone, password });
    applyAccessToken(data.access_token);
  }, [applyAccessToken]);

  const register = useCallback(
    async (email, password, r) => {
      await api.post('/auth/register', { email, password, role: r });
      await login(email, password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    applyAccessToken(null);
  }, [applyAccessToken]);

  const value = useMemo(
    () => ({ user, role, initializing, login, register, logout }),
    [user, role, initializing, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
