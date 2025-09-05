// src/apis/students.js
import axiosInstance from '@utils/axios';

export const apiCheckStudentSlots = (idOrUserId, slots) =>
  axiosInstance({
    url: `/students/${idOrUserId}/check-slots`,
    method: 'post',
    data: { slots },
  });
export const apiGetStudentCalendar = (studentId) =>
  axiosInstance({
    url: `/students/${studentId}/calendar`,
    method: 'get',
  });

/* (tuỳ chọn nếu cần) lấy lịch của 1 enrollment cụ thể */
export const apiGetStudentCalendarEntry = (studentId, enrollmentId) =>
  axiosInstance({
    url: `/students/${studentId}/calendar/enrollments/${enrollmentId}`,
    method: 'get',
  });

export const apiGetStudentCalendarByUser = (userId) =>
  axiosInstance({
    url: `/students/user/${userId}/calendar`,
    method: 'get',
  });

/** (tuỳ chọn) lấy 1 entry theo userId */
export const apiGetStudentCalendarEntryByUser = (userId, enrollmentId) =>
  axiosInstance({
    url: `/students/user/${userId}/calendar/enrollments/${enrollmentId}`,
    method: 'get',
  });

/* (tuỳ chọn nếu cần) regenerate lịch */
export const apiRegenerateStudentCalendar = (studentId, enrollmentId, payload) =>
  axiosInstance({
    url: `/students/${studentId}/calendar/enrollments/${enrollmentId}/generate`,
    method: 'post',
    data: payload, // { paidAt?: string, offsetDays?: number }
  });