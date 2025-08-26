// src/apis/consultation.js
import axiosInstance from "../utils/axios";

// Tạo yêu cầu tư vấn
export const createConsultation = (payload) => {
  return axiosInstance({
    url: "/consultations",
    method: "post",
    data: payload,
  });
};

// Admin list + filter + paginate
export const listConsultations = (params) =>
    axiosInstance({ url: '/consultations', method: 'get', params });
  
  // Admin get detail
  export const getConsultation = (id) =>
    axiosInstance({ url: `/consultations/${id}`, method: 'get' });
  
  // Admin update (status, note, handledBy, teacherId/name,…)
  export const updateConsultation = (id, data) =>
    axiosInstance({ url: `/consultations/${id}`, method: 'patch', data });
  
  // Admin delete
  export const deleteConsultation = (id) =>
    axiosInstance({ url: `/consultations/${id}`, method: 'delete' });
