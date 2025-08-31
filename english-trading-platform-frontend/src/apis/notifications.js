// src/api/notifications.js
import axiosInstance from '../utils/axios';

// Lấy danh sách thông báo của 1 user (mới nhất lên đầu sẽ do FE sắp)
export const fetchNotifications = ({ userId }) =>
  axiosInstance({
    url: '/notifications',
    method: 'get',
    params: { userId },
  });

// Đánh dấu đã đọc
export const markNotificationRead = (id) =>
  axiosInstance({
    url: `/notifications/${id}/read`,
    method: 'patch',
  });
export const fetchUnreadCount = ({ userId }) =>
  axiosInstance({ url: '/notifications/unread-count', method: 'get', params: { userId } });