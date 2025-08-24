import axiosInstance from "../utils/axios";

// Lấy danh sách category cùng top 3 blog nổi bật
export const fetchTopBlogsByCategory = () => {
  return axiosInstance({
    url: '/categories/top-posts',
    method: 'get',
  });
};

// Tìm kiếm blog theo tiêu đề (BE đọc query param `search`)
export const searchBlogsByTitle = (query) => {
  return axiosInstance({
    url: '/blogs',
    method: 'get',
    params: { search: query },
  });
};