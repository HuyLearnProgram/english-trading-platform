// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);     // { token, id }
  const [role, setRole] = useState(null);     // 'admin' | 'businessowner' | 'customer'
  const [initializing, setInitializing] = useState(true);
  const apiUrl = process.env.REACT_APP_API_URL;

  // Khôi phục phiên đăng nhập khi load app
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const savedRole = localStorage.getItem('role');

    if (token && userId) {
      setUser({ token, id: Number(userId) });
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    if (savedRole) setRole(savedRole);

    setInitializing(false);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { data } = await axios.post(`${apiUrl}/auth/login`, { email, password });
      const { access_token, id, role: r } = data;

      setUser({ token: access_token, id });
      setRole(r);

      localStorage.setItem('token', access_token);
      localStorage.setItem('userId', String(id));
      localStorage.setItem('role', r);

      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    },
    [apiUrl]
  );

  const register = useCallback(
    async (email, password, r) => {
      await axios.post(`${apiUrl}/auth/register`, { email, password, role: r });
      await login(email, password);
    },
    [apiUrl, login]
  );

  const logout = useCallback(() => {
    setUser(null);
    setRole(null);
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
  }, []);

  const value = useMemo(
    () => ({ user, role, initializing, login, register, logout }),
    [user, role, initializing, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
