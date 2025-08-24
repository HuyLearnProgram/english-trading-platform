// src/utils/axios.js
import axios from "axios";


const API_BASE =
  process.env.REACT_APP_API_BASE || "http://localhost:3000";

const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 15000, // 15s
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/** Helper: lấy/ghi token */
export const getAccessToken = () =>
  localStorage.getItem("access_token") || localStorage.getItem("token");

export const setAccessToken = (token) => {
  if (token) localStorage.setItem("access_token", token);
  else localStorage.removeItem("access_token");
};

/** REQUEST interceptor: tự gắn Authorization nếu có token */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * RESPONSE interceptor:
 * - Trả thẳng `response` (để bạn .data ở nơi gọi)
 * - Chuẩn hoá lỗi, đính kèm message dễ đọc hơn
 * - (Tuỳ chọn) Refresh token: để trống mẫu dưới đây nếu backend có hỗ trợ
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Không có response -> lỗi mạng / CORS
    if (!error.response) {
      return Promise.reject({
        message: "Network error or CORS blocked",
        _original: error,
      });
    }

    const { status, data } = error.response;

    // === (Tuỳ chọn) Refresh token mẫu ===
    // if (status === 401 && !config._retry) {
    //   config._retry = true;
    //   try {
    //     const refreshToken = localStorage.getItem("refresh_token");
    //     if (!refreshToken) throw new Error("Missing refresh token");
    //
    //     // Dùng một client tách biệt để tránh lặp interceptor
    //     const authClient = axios.create({ baseURL: API_BASE });
    //     const { data: refreshRes } = await authClient.post("/auth/refresh", {
    //       refreshToken,
    //     });
    //
    //     const newAccess = refreshRes?.accessToken;
    //     setAccessToken(newAccess);
    //
    //     // Gắn token mới và gọi lại request cũ
    //     config.headers = config.headers || {};
    //     config.headers.Authorization = `Bearer ${newAccess}`;
    //     return axiosInstance(config);
    //   } catch (e) {
    //     // Refresh fail -> xoá token, có thể điều hướng tới /login
    //     setAccessToken(null);
    //   }
    // }

    // Chuẩn hoá object lỗi trả về
    const normalizedError = {
      status,
      message:
        data?.message ||
        data?.error ||
        `Request failed with status code ${status}`,
      data,
    };
    return Promise.reject(normalizedError);
  }
);

export default axiosInstance;
