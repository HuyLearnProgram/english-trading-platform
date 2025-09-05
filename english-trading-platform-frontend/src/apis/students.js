// src/apis/students.js
import axiosInstance from '@utils/axios';

export const apiCheckStudentSlots = (idOrUserId, slots) =>
  axiosInstance({
    url: `/students/${idOrUserId}/check-slots`,
    method: 'post',
    data: { slots },
  });
