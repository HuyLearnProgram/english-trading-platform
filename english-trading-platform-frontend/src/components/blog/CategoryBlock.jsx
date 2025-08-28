import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { placeholderImg } from '@utils/constants';
import '@styles/blog/CategoryBlock.css';

export default function CategoryBlock({ category }) {
  const { name, slug, topBlogs = [] } = category || {};
  const [first, second, third] = useMemo(() => topBlogs, [topBlogs]);

  // Không có bài thì ẩn block
  if (!topBlogs.length || !first) return null;

  return (
    <section className="cat-block">
      {/* Title row */}
      <div className="cat-title-row">
        <span className="orange-dot" />
        <h2 className="cat-title">{name}</h2>
      </div>

      {/* Featured: big image + headline */}
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
        </div>
      </div>

      {/* 2 bài tiếp theo */}
      <div className="subgrid">
        {[second, third]
          .filter(Boolean)
          .map((b) => (
            <Link key={b.id} to={`/blog/${b.slug || b.id}`} className="subcard">
              <div className="thumb">
                <img
                  src={b?.introImage?.src || placeholderImg}
                  alt={b.title}
                  loading="lazy"
                />
              </div>
              <div className="meta">
                <h3 className="subcard-title">{b.title}</h3>
              </div>
            </Link>
          ))}
      </div>

      {/* View all */}
      <div className="view-all-wrap">
        <Link to={`/blog/category/${slug}`} className="view-all">
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
}
