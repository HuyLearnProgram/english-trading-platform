// src/apis/users.js
import axiosInstance from "../utils/axios";

export const apiListUsers = (params) =>
  axiosInstance({ url: '/users', method: "get", params });

export const apiLockUser = (id, payload) =>
  axiosInstance({ url: `/users/${id}/lock`, method: "patch", data: payload }); // { reason }

export const apiUnlockUser = (id) =>
  axiosInstance({ url: `/users/${id}/unlock`, method: "patch" });

// Lấy chi tiết user theo id (để có role, avatarUrl…)
export const fetchUserById = (id) =>
  axiosInstance({ url: `/users/id/${id}`, method: 'get' });

// Đăng xuất (xoá cookie refresh phía BE)
export const logoutUser = () =>
  axiosInstance({ url: '/auth/logout', method: 'post' });
