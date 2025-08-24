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

// chi tiết theo slug (đã eager category + author)
export const fetchBlogBySlug = (slug) =>
  axiosInstance({ url: `/blogs/by-slug/${encodeURIComponent(slug)}`, method: 'get' });

// bài viết liên quan (cùng category, sắp xếp theo popular)
export const fetchRelatedBlogs = ({ categoryId, excludeId, limit = 6 }) =>
  axiosInstance({
    url: '/blogs',
    method: 'get',
    params: { categoryId, limit, sort: 'popular' } // lọc ở FE để bỏ current
  });

// (tùy dùng ở sidebar)
// export const searchBlogsByTitle = (q) =>
//   axiosInstance({ url: '/blogs', method: 'get', params: { search: q, limit: 8 } });