import axiosInstance from "../utils/axios";


export const apiGetTeachers = (params) =>
    axiosInstance({ url: "/teachers", method: "get", params });
