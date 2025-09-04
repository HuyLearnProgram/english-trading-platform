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

export const apiStartZaloPayCheckout = (enrollmentId) =>
  axiosInstance({ 
    url: '/payments/checkout', 
    method: 'post', 
    data: { enrollmentId, provider: 'zalopay' } 
  });

export const apiStartPaypalCheckout = (enrollmentId) =>
  axiosInstance({
    url: '/payments/checkout',
    method: 'post',
    data: { enrollmentId, provider: 'paypal' },
  });

export const apiStartMomoCheckout = (enrollmentId) =>
  axiosInstance({
    url: '/payments/checkout', 
    method: 'post',
    data: { enrollmentId, provider: 'momo' },
  });

export const apiSendEnrollmentInvoice = (enrollmentId) =>
  axiosInstance({
    url: `/payments/${enrollmentId}/send-invoice`,
    method: 'post',
  });