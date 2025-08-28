import React, { useEffect, useState } from 'react';
import { fetchTopBlogsByCategory } from '@apis/blog';
import Breadcrumb from '@components/common/Breadcrumb';
import SidebarCard from '@components/blog/SidebarCard';
import '@styles/BlogPage.css';
import { trackBanners } from '@utils/constants';
import CategoryBlock from '@components/blog/CategoryBlock';
import { useNavigate } from 'react-router-dom';

const BlogPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // chỉ cần giữ searchTerm vì submit sẽ điều hướng
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetchTopBlogsByCategory();
        setCategories(res.data || []);
      } catch (e) {
        console.error('Lỗi khi lấy dữ liệu:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Giống BlogDetailPage: điều hướng sang trang danh mục kèm q
  const onSubmitSearch = (e) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;

    // Gợi ý: dùng "all" để xem toàn bộ danh mục theo từ khoá
    navigate(`/blog/search?search=${encodeURIComponent(q)}`);
  };


  return (
    <div className="blog-wrapper">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Trang chủ', to: '/home' },
        { label: 'Blog' }
      ]}/>

      {/* Header */}
      <header className="blog-header">
        <h1>Blog Học Tập by Antoree Education</h1>
        <p>
          Chia sẻ mẹo học tập hiệu quả và chiến lược, kiến thức và tài liệu
          cho bất kỳ ai đang theo đuổi việc học tập, từ tiếng Anh
        </p>
      </header>

      {/* 2 columns */}
      <div className="blog-content">
        {/* LEFT */}
        <div className="blog-main">
          {loading ? (
            <div className="loading">Đang tải dữ liệu...</div>
          ) : (
            categories.map((cat) => (
              <CategoryBlock key={cat.id} category={cat} />
            ))
          )}
        </div>

        {/* RIGHT */}
        <aside className="blog-sidebar">
          <SidebarCard
            title="Tìm kiếm bài viết học tập"
            searchTerm={searchTerm}
            onChangeSearchTerm={setSearchTerm}
            onSubmitSearch={onSubmitSearch}
            banners={trackBanners}
          />
        </aside>
      </div>
    </div>
  );
};

export default BlogPage;
