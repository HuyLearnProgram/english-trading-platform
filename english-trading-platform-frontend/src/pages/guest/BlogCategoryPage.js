import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Breadcrumb from '../../components/common/Breadcrumb';
import { fetchBlogsByCategory, fetchCategories } from '../../apis/blog';
import { placeholderImg } from '../../utils/constants';
import '../../styles/BlogCategoryPage.css';

const SORTS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'popular', label: 'Phổ biến' },
];

export default function BlogCategoryPage() {
  const { id } = useParams();
  const categoryId = Number(id);

  const [catName, setCatName] = useState('Danh mục');
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(9);

  const [sort, setSort] = useState('newest');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  // Lấy tên category
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchCategories();
        const found = (res.data || []).find((c) => Number(c.id) === categoryId);
        setCatName(found?.name || 'Danh mục');
      } catch {
        setCatName('Danh mục');
      }
    })();
  }, [categoryId]);

  const fetchPage = useCallback(
    async (nextPage, append = false) => {
      setLoading(true);
      try {
        const res = await fetchBlogsByCategory({
          categoryId,
          page: nextPage,
          limit,
          sort,
          search: q || undefined,
        });

        const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
        const meta = res.data?.meta;

        setItems((prev) => (append ? [...prev, ...list] : list));

        if (meta) {
          const tp = meta.totalPages || Math.max(1, Math.ceil((meta.total || 0) / limit));
          setTotal(meta.total || list.length);
          setTotalPages(tp);
        } else {
          // Fallback khi BE không trả meta
          const tp = Math.max(1, Math.ceil((append ? items.length + list.length : list.length) / limit));
          setTotal(append ? items.length + list.length : list.length);
          setTotalPages(tp);
        }

        setPage(nextPage);
      } finally {
        setLoading(false);
      }
    },
    [categoryId, limit, sort, q] // eslint-disable-line
  );

  // Load khi đổi sort / search
  useEffect(() => {
    fetchPage(1, false);
  }, [fetchPage]);

  const onSubmitSearch = (e) => {
    e.preventDefault();
    fetchPage(1, false);
  };

  // Danh sách trang (hiển thị tất cả hoặc có thể làm window 5 trang nếu muốn)
  const pages = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages]
  );

  return (
    <div className="catpage-wrapper">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', to: '/home' },
          { label: 'Blog', to: '/blog' },
          { label: catName },
        ]}
      />

      {/* Hàng 1: tiêu đề + search */}
      <div className="catpage-headline">
        <h1 className="catpage-title">{catName}</h1>

        <form className="catpage-search" onSubmit={onSubmitSearch}>
          <button className="search-btn-left" aria-label="Tìm">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                d="M21 21l-4.35-4.35m1.85-5.4a7.25 7.25 0 11-14.5 0 7.25 7.25 0 0114.5 0z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nhập nội dung bạn muốn tìm kiếm"
          />
        </form>
      </div>

      <div className="catpage-divider" />

      {/* Hàng 2: tổng bài + sort */}
      <div className="catpage-meta">
        <div className="catpage-sub">Có {total} bài viết</div>

        <div className="catpage-sort">
          <span>Sắp xếp theo</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      <section className="catpage-grid">
        {loading && page === 1 && <div className="loading">Đang tải dữ liệu…</div>}

        {!loading && !items.length && (
          <div className="empty">Chưa có bài viết nào trong danh mục này.</div>
        )}

        {items.map((b) => (
          <Link key={b.id} to={`/blog/${b.slug || b.id}`} className="catcard">
            <div className="catcard-thumb">
              <img
                src={b?.introImage?.src || placeholderImg}
                alt={b.title}
                loading="lazy"
              />
            </div>
            <h3 className="catcard-title">{b.title}</h3>
            <span className="catcard-pill">{catName}</span>
          </Link>
        ))}
      </section>

      {/* Phân trang số */}
      {totalPages > 1 && (
        <div className="pager-num">
          <button
            className="page-nav"
            disabled={page <= 1}
            onClick={() => fetchPage(page - 1, false)}
            aria-label="Trang trước"
          >
            ‹
          </button>

          {pages.map((n) => (
            <button
              key={n}
              className={`page-btn ${n === page ? 'active' : ''}`}
              onClick={() => fetchPage(n, false)}
            >
              {n}
            </button>
          ))}

          <button
            className="page-nav"
            disabled={page >= totalPages}
            onClick={() => fetchPage(page + 1, false)}
            aria-label="Trang sau"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
