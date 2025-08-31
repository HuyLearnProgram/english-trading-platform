// src/apis/refundRequests.js
import axiosInstance from '@/utils/axios';

export const apiListRefunds = (params) =>
  axiosInstance({ url: '/refund-requests', method: 'get', params });

export const apiCreateRefund = (payload) =>
  axiosInstance({ url: '/refund-requests', method: 'post', data: payload });

export const apiUpdateRefund = (id, payload) =>
  axiosInstance({ url: `/refund-requests/${id}`, method: 'patch', data: payload });

export const apiDeleteRefund = (id) =>
  axiosInstance({ url: `/refund-requests/${id}`, method: 'delete' });
