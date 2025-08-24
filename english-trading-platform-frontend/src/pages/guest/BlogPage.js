import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchTopBlogsByCategory, searchBlogsByTitle } from '../../apis/blog';
import Breadcrumb from '../../components/common/Breadcrumb';
import '../../styles/BlogPage.css';

const placeholderImg =
  'https://via.placeholder.com/768x432.png?text=No+Image';
// Banner “Lộ trình cá nhân hoá”
const trackBanners = [
    {
      href: 'https://prepedu.com/vi/ielts?utm_source=website&utm_medium=bannerblog',
      src: 'https://static-assets.prepcdn.com/content-management-system/prepedu_giam_gia_va_tang_qua_khi_mua_lo_trinh_hoc_ielts_2_khoa_tro_len_0f71826993.gif',
      alt: 'Đăng ký lộ trình IELTS',
    },
    {
      href: 'https://prepedu.com/vi/toeic?ref=blog',
      src: 'https://static-assets.prepcdn.com/content-management-system/hoc_toeic_4_ky_nang_cung_prep_3404f79608.png',
      alt: 'Lộ trình học TOEIC',
    },
    {
      href: 'https://prepedu.com/vi/prep-talk-english?ref=blog',
      src: 'https://static-assets.prepcdn.com/content-management-system/hoc_tieng_anh_giao_tiep_cung_prep_talk_c340b99738.png',
      alt: 'Học tiếng Anh giao tiếp cùng PREP Talk',
    },
  ];

const BlogPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

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

  const onSubmitSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setSearching(true);
    try {
      const res = await searchBlogsByTitle(searchTerm.trim());
      setSearchResults(res.data || []);
    } catch (e) {
      console.error('Lỗi tìm kiếm:', e);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="blog-wrapper">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Trang chủ', to: '/customer/home' },
        { label: 'Blog' }
      ]}/>

      {/* Header title + subtitle */}
      <header className="blog-header">
        <h1>Blog Học Tập by PREP Education</h1>
        <p>
          Chia sẻ mẹo học tập hiệu quả và chiến lược, kiến thức và tài liệu
          chuẩn bị cho các kỳ thi như IELTS, TOEIC
        </p>
      </header>

      {/* Content two columns */}
      <div className="blog-content">
        {/* LEFT: main */}
        <div className="blog-main">
          {loading ? (
            <div className="loading">Đang tải dữ liệu...</div>
          ) : (
            categories.map((cat) => (
              <CategoryBlock key={cat.id} category={cat} />
            ))
          )}
        </div>

        {/* RIGHT: sidebar (chỉ có ô tìm kiếm theo yêu cầu) */}
        <aside className="blog-sidebar">
          <div className="card">
            <h3 className="card-title">Tìm kiếm bài viết học tập</h3>
            <form onSubmit={onSubmitSearch} className="search-form">
            <div className="input-with-icon">
              <input
                className="search-input"
                type="text"
                placeholder="Tìm kiếm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {/* Icon là nút submit nằm bên trong input */}
              <button
                type="submit"
                className="search-icon-btn"
                aria-label="Tìm kiếm"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M21 21l-4.35-4.35m1.85-5.4a7.25 7.25 0 11-14.5 0 7.25 7.25 0 0114.5 0z"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </form>



            {/* kết quả đơn giản ngay dưới ô tìm kiếm */}
            {searching && <div className="search-loading">Đang tìm…</div>}
            {!searching && !!searchResults.length && (
              <ul className="search-results">
                {searchResults.slice(0, 6).map((b) => (
                  <li key={b.id}>
                    <Link to={`/blog/${b.slug || b.id}`}>{b.title}</Link>
                  </li>
                ))}
              </ul>
            )}
            {/* Lộ trình cá nhân hoá */}
            <div className="card track-card">
              <h3 className="card-title">Lộ Trình Cá Nhân Hoá</h3>
              <div className="tracks">
                {trackBanners.map((b) => (
                  <a
                    key={b.alt}
                    href={b.href}
                    target="_blank"
                    rel="noreferrer"
                    className="track-banner"
                  >
                    <img src={b.src} alt={b.alt} loading="lazy" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BlogPage;

/* ================== helper block component ================== */
const CategoryBlock = ({ category }) => {
  const { name, id, topBlogs = [] } = category;
  const [first, second, third] = useMemo(() => topBlogs, [topBlogs]);

  if (!topBlogs.length) return null;

  return (
    <section className="cat-block">
      {/* Title row */}
      <div className="cat-title-row">
        <span className="orange-dot" />
        <h2 className="cat-title">{name}</h2>
      </div>

      {/* Featured area: hero row (big image + headline) */}
      <div className="hero-row">
        <Link
          className="hero-media"
          to={`/blog/${first.slug || first.id}`}
          title={first.title}
        >
          <img
            src={first?.introImage?.src || placeholderImg}
            alt={first.title}
            loading="lazy"
          />
        </Link>
        <div className="hero-info">
          <Link
            to={`/blog/${first.slug || first.id}`}
            className="hero-title link"
          >
            {first.title}
          </Link>
          {/* có thể thêm chips/tags tại đây nếu cần */}
        </div>
      </div>

      {/* 2 cards dưới */}
      <div className="subgrid">
        {[second, third]
          .filter(Boolean)
          .map((b) => (
            <Link key={b.id} to={`/blog/${b.slug || b.id}`} className="subcard">
              <div className="thumb">
                <img src={b?.introImage?.src || placeholderImg} alt={b.title} loading="lazy" />
              </div>
              <div className="meta">
                <h3 className="subcard-title">{b.title}</h3>
              </div>
            </Link>
          ))}
      </div>

      <div className="view-all-wrap">
        <Link to={`/blog/category/${id}`} className="view-all">
          Xem tất cả
          <svg viewBox="0 0 448 512" width="16" height="16" aria-hidden="true">
            <path
              fill="currentColor"
              d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"
            />
          </svg>
        </Link>
      </div>

      <hr className="cat-divider" />
    </section>
  );
};
