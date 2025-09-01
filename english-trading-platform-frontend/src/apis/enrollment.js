import axiosInstance from "@utils/axios";

/** Học sinh mua gói (snapshot + status 'pending') */
export const apiPurchaseEnrollment = (payload) =>
  axiosInstance({
    url: "/enrollments/purchase",
    method: "post",
    data: payload,
  });
