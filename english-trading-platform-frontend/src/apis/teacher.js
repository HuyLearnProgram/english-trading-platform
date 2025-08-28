import axiosInstance from "../utils/axios";


export const apiGetTeachers = (params) =>
    axiosInstance({ url: "/teachers", method: "get", params });

export const apiGetTeacherPublic = (id) =>
    axiosInstance({ url: `/teachers/${id}/public`, method: 'get' });

export const apiGetTeacherMetrics = (id) =>
  axiosInstance({ url: `/teachers/${id}/metrics`, method: "get" });

export const apiGetTeacherReviews = (teacherId, params) =>
  axiosInstance({ url: `/reviews/teacher/${teacherId}`, method: 'get', params });