import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Breadcrumb from '@components/common/Breadcrumb';
import TOCBox from '@components/blog/TOCBox';
import AuthorCard from '@components/blog/AuthorCard';
import Figure from "@components/blog/Figure";
import RelatedCarousel from "@components/blog/RelatedCarousel";
import SidebarCard from '@components/blog/SidebarCard';
import {
  fetchBlogBySlug,
  fetchRelatedBlogs,
} from '@apis/blog';
import { placeholderImg, trackBanners } from '@utils/constants';

import '@styles/BlogPage.css';        // layout container + 2 cột
import '@styles/BlogDetailPage.css';  // style riêng cho detail

export default function BlogDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [related, setRelated] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
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
      } catch {
        navigate('/blog', { replace: true });
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug, navigate]);

  const onSubmitSearch = () => {
    if (!searchTerm.trim()) return;
    navigate(`/blog/search?search=${encodeURIComponent(searchTerm.trim())}`);
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
        to: `/blog/category/${blog.category.slug}`,
      });
    }
    arr.push({ label: blog.title });
    return arr;
  }, [blog]);

  // TOC
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

      {/* Title */}
      <header className="detail-header">
        <h1 className="detail-title">{blog.title}</h1>
      </header>

      {/* 2 cột */}
      <div className="blog-content">
        {/* LEFT: nội dung */}
        <div className="blog-main">
          {/* Category pill */}
          {blog.category && (
            <div className="detail-cat-pill">
              <Link to={`/blog/category/${blog.category.slug}`} className="pill">
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
                  <h2 id={s.id} className="anchor-offset">{s.title}</h2>
                  {s.body && <p className="mt-2 preline">{s.body}</p>}

                  {Array.isArray(s.images) && s.images.map((img, i) => (
                    <Figure key={i} src={img.src} caption={img.caption} />
                  ))}
                  {s.image?.src && <Figure src={s.image.src} caption={s.image.caption} />}

                  {s.links && s.links.length > 0 && <h3>Tham khảo thêm:</h3>}
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

          {/* Author */}
          {blog.author && (
            <AuthorCard
              author={blog.author}
              getTeacherUrl={(t) => `/teacher/${t.id}`}
            />
          )}

          {/* Related */}
          {related.length > 0 && (
            <RelatedCarousel items={related} placeholderImg={placeholderImg} />
          )}
        </div>

        {/* RIGHT: SidebarCard */}
        <aside className="blog-sidebar">
          <SidebarCard
            title="Tìm kiếm bài viết học tập"
            searchTerm={searchTerm}
            onChangeSearchTerm={setSearchTerm}
            onSubmitSearch={onSubmitSearch}
            banners={trackBanners}
            showConsultation
            consultationProps={{
              teacherName: blog?.author?.fullName,
              teacherId: blog?.author?.id,
              blogSlug: blog?.slug,
              source: 'blog',
            }}
          />
        </aside>
      </div>
    </div>
  );
}
