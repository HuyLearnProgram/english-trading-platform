import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Breadcrumb from '@components/common/Breadcrumb';
import TOCBox from '@components/blog/TOCBox';
import AuthorCard from '@components/blog/AuthorCard';
import Figure from "@components/blog/Figure";
import RelatedCarousel from "@components/blog/RelatedCarousel";
import ConsultationForm from '@components/blog/ConsultationForm';
import {
  fetchBlogBySlug,
  fetchRelatedBlogs,
  searchBlogsByTitle,
} from '@apis/blog';
import { placeholderImg, trackBanners } from '@utils/constants';

import '@styles/BlogPage.css';   // container + 2 cột (giữ nguyên)
import '@styles/BlogDetail.css'; // style detail nhẹ



export default function BlogDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [related, setRelated] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data } = await fetchBlogBySlug(slug);
        if (!mounted) return;
        setBlog(data);

        if (data?.categoryId) {
          const resRel = await fetchRelatedBlogs({ categoryId: data.categoryId, limit: 6 });
          const items = (resRel.data?.items || resRel.data || []).filter(x => x.id !== data.id);
          setRelated(items);
        }
      } catch (e) {
        navigate('/blog', { replace: true });
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug, navigate]);

  const onSubmitSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setSearching(true);
    try {
      const res = await searchBlogsByTitle(searchTerm.trim());
      setSearchResults(res.data?.items || res.data || []);
    } finally {
      setSearching(false);
    }
  };

  // Breadcrumbs
  const crumbs = useMemo(() => {
    if (!blog) {
      return [
        { label: 'Trang chủ', to: '/home' },
        { label: 'Blog', to: '/blog' },
      ];
    }
    const arr = [
      { label: 'Trang chủ', to: '/home' },
      { label: 'Blog', to: '/blog' },
    ];
    if (blog.category) {
      arr.push({
        label: blog.category.name,
        to: `/blog/category/${blog.category.id}`,
      });
    }
    arr.push({ label: blog.title });
    return arr;
  }, [blog]);

  // TOC: dùng blog.toc nếu có, nếu không tạo từ sections
  const tocData = useMemo(() => {
    if (Array.isArray(blog?.toc) && blog.toc.length) return blog.toc;
    if (Array.isArray(blog?.sections) && blog.sections.length) {
      return blog.sections.map(s => ({ id: s.id, label: s.title }));
    }
    return [];
  }, [blog]);

  if (loading) {
    return (
      <div className="blog-wrapper">
        <div className="loading">Đang tải bài viết…</div>
      </div>
    );
  }
  if (!blog) return null;

  return (
    <div className="blog-wrapper">
      {/* Breadcrumb */}
      <Breadcrumb items={crumbs} />

      {/* Title giống BlogPage */}
      <header className="detail-header">
        <h1 className="detail-title">{blog.title}</h1>
      </header>

      {/* 2 cột giống BlogPage */}
      <div className="blog-content">
        {/* LEFT: nội dung */}
        <div className="blog-main">
          {/* Category pill */}
          {blog.category && (
            <div className="detail-cat-pill">
              <Link
                to={`/blog/category/${blog.category.slug ?? blog.category.id}`}
                className="pill"
              >
                {blog.category.name}
              </Link>
            </div>
          )}

          {/* Intro */}
          {blog.introText && (
            <div className="article-intro">
              <p className="preline">{blog.introText}</p>
            </div>
          )}

          {/* Ảnh hero */}
          <Figure
            src={blog?.introImage?.src || placeholderImg}
            caption={blog?.introImage?.caption}
          />

          {/* TOC */}
          {tocData.length > 0 && <TOCBox toc={tocData} />}

          {/* Sections */}
          {Array.isArray(blog.sections) && blog.sections.length > 0 && (
            <div className="article-sections">
              {blog.sections.map((s) => (
                <section key={s.id} className="section">
                  {/* đặt id lên heading để anchor chuẩn xác */}
                  <h2 id={s.id} className="anchor-offset">{s.title}</h2>

                  {/* body: backend trả 'body' */}
                  {s.body && <p className="mt-2 preline">{s.body}</p>}

                  {/* images: backend trả 'images[]' (vẫn hỗ trợ 'image') */}
                  {Array.isArray(s.images) && s.images.map((img, i) => (
                    <Figure key={i} src={img.src} caption={img.caption} />
                  ))}
                  {s.image?.src && <Figure src={s.image.src} caption={s.image.caption} />}

                  {/* links[] */}
                  {s.links && s.links.length > 0 && (
                    <h3>Tham khảo thêm:</h3>)}
                  {Array.isArray(s.links) && s.links.length > 0 && (
                    <ul className="article-links">
                      {s.links.map((l, i) => (
                        <li key={i}>
                          <a href={l.url} target="_blank" rel="noreferrer">{l.title}</a>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          )}

          {/* Author (Teacher) */}
          {blog.author && (
            <AuthorCard
              author={blog.author}
              // có thể tuỳ biến URL nếu route của bạn khác:
              getTeacherUrl={(t) => `/teachers/${t.id}`}
            />
          )}

          {/* Related */}
          {related.length > 0 && (
            <RelatedCarousel items={related} placeholderImg={placeholderImg} />
          )}
        </div>

        {/* RIGHT: sidebar giống BlogPage */}
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
                <button type="submit" className="search-icon-btn" aria-label="Tìm kiếm">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M21 21l-4.35-4.35m1.85-5.4a7.25 7.25 0 11-14.5 0 7.25 7.25 0 0114.5 0z"
                      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </form>

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
                  <a key={b.alt} href={b.href} target="_blank" rel="noreferrer" className="track-banner">
                    <img src={b.src} alt={b.alt} loading="lazy" />
                  </a>
                ))}
              </div>
            </div>

            <ConsultationForm
              teacherName={blog?.author?.fullName}
              teacherId={blog?.author?.id}   // optional
              blogSlug={blog?.slug}          // optional, tiện truy vết
              source="blog"                  // optional, default đã là 'blog'
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

