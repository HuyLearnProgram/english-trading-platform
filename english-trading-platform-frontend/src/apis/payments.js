// src/apis/payments.js
import axiosInstance from "@utils/axios";

export const apiStartVnpayCheckout = (enrollmentId) =>
  axiosInstance({
    url: '/payments/checkout',
    method: 'post',
    data: { enrollmentId, provider: 'vnpay' },
  });

export const apiVerifyVnpayReturn = (params) =>
  axiosInstance({
    url: '/payments/vnpay/return',
    method: 'get',
    params,
  });
