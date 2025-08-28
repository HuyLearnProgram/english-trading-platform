import axiosInstance from "../utils/axios";

export const fetchTopBlogsByCategory = () =>
  axiosInstance({ url: '/categories/top-posts', method: 'get' });

export const fetchBlogBySlug = (slug) =>
  axiosInstance({ url: `/blogs/by-slug/${encodeURIComponent(slug)}`, method: 'get' });

export const fetchRelatedBlogs = ({ categoryId, excludeId, limit = 6 }) =>
  axiosInstance({
    url: '/blogs',
    method: 'get',
    params: { categoryId, limit, sort: 'popular' } // FE tự lọc excludeId nếu cần
  });

// DÙNG CHUNG CHO CẢ CATEGORY & SEARCH
export const fetchBlogsByCategory = ({ categorySlug, page = 1, limit = 9, sort = 'newest', search }) => {
  const params = { page, limit, sort };
  if (categorySlug) params.categorySlug = categorySlug;
  if (search) params.search = search;
  return axiosInstance({ url: '/blogs', method: 'get', params });
};

export const fetchCategories = () =>
  axiosInstance({ url: '/categories', method: 'get' });

// (nếu cần) lấy category theo slug
export const fetchCategoryBySlug = (slug) =>
  axiosInstance({ url: `/categories/slug/${encodeURIComponent(slug)}`, method: 'get' });
