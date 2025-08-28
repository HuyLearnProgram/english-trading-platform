import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import Breadcrumb from '@components/common/Breadcrumb';
import { fetchBlogsByCategory, fetchCategories } from '@apis/blog';
import { placeholderImg, SORTS } from '@utils/constants';
import '@styles/BlogCategoryPage.css';

export default function BlogCategoryPage() {
  const { slug } = useParams();                 // có thể undefined (khi /blog/search)
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [catName, setCatName] = useState('Danh mục');
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(9);

  // query params
  const [sort, setSort] = useState('newest');
  const [q, setQ] = useState('');

  const lastReqId = useRef(0);

  // đồng bộ từ URL -> state
  useEffect(() => {
    const urlQ = searchParams.get('search') ?? searchParams.get('q') ?? '';
    setQ(urlQ);
    setSort(searchParams.get('sort') || 'newest');
    const p = parseInt(searchParams.get('page') || '1', 10);
    setPage(Number.isNaN(p) ? 1 : p);
  }, [searchParams]);

  // Tiêu đề trang
  useEffect(() => {
    (async () => {
      // Nếu không có slug => đang ở /blog/search
      if (!slug) {
        setCatName(q ? `Kết quả cho “${q}”` : 'Tất cả bài viết');
        return;
      }
      // Có slug => tìm theo category
      try {
        const res = await fetchCategories();
        const found = (res.data || []).find((c) => c.slug === String(slug));
        setCatName(found?.name || 'Danh mục');
      } catch {
        setCatName('Danh mục');
      }
    })();
  }, [slug, q]);

  const [loading, setLoading] = useState(false);

  const fetchPage = useCallback(
    async (nextPage, append = false) => {
      const reqId = ++lastReqId.current;
      setLoading(true);
      try {
        const res = await fetchBlogsByCategory({
          // nếu có slug thì truyền; nếu không có (trang search) thì KHÔNG truyền
          categorySlug: slug ? String(slug) : undefined,
          page: nextPage,
          limit,
          sort,
          search: q || undefined,
        });

        // Nếu đã có request mới hơn, bỏ qua kết quả cũ
        if (reqId !== lastReqId.current) return;

        const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
        const meta = res.data?.meta;

        setItems((prev) => (append ? [...prev, ...list] : list));

        if (meta) {
          const tp = meta.totalPages || Math.max(1, Math.ceil((meta.total || 0) / limit));
          setTotal(meta.total || list.length);
          setTotalPages(tp);
        } else {
          const tp = Math.max(1, Math.ceil((append ? items.length + list.length : list.length) / limit));
          setTotal(append ? items.length + list.length : list.length);
          setTotalPages(tp);
        }

        setPage(nextPage);
      } finally {
        if (reqId === lastReqId.current) setLoading(false);
      }
    },
    [slug, limit, sort, q] // eslint-disable-line
  );

  useEffect(() => {
    fetchPage(page || 1, false);
  }, [fetchPage, page]);

  // helper build URL (tự động chọn path)
  const buildPath = (nextPage) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('search', q.trim());  // CHUẨN HOÁ: dùng 'search'
    params.set('sort', sort);
    params.set('page', String(nextPage));
    return slug
      ? `/blog/category/${encodeURIComponent(String(slug))}?${params.toString()}`
      : `/blog/search?${params.toString()}`;
  };

  const onSubmitSearch = (e) => {
    e.preventDefault();
    navigate(buildPath(1));
  };

  const onChangeSort = (nextSort) => {
    setSort(nextSort);
    const params = new URLSearchParams();
    if (q.trim()) params.set('search', q.trim());
    params.set('sort', nextSort);
    params.set('page', '1');
    navigate(slug
      ? `/blog/category/${encodeURIComponent(String(slug))}?${params.toString()}`
      : `/blog/search?${params.toString()}`
    );
  };

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

      <div className="catpage-headline">
        <h1 className="catpage-title">{catName}</h1>

        <form className="catpage-search" onSubmit={onSubmitSearch}>
          <button className="search-btn-left" aria-label="Tìm">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M21 21l-4.35-4.35m1.85-5.4a7.25 7.25 0 11-14.5 0 7.25 7.25 0 0114.5 0z"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

      <div className="catpage-meta">
        <div className="catpage-sub">Có {total} bài viết</div>

        <div className="catpage-sort">
          <span>Sắp xếp theo</span>
          <select value={sort} onChange={(e) => onChangeSort(e.target.value)}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="catpage-grid">
        {loading && page === 1 && <div className="loading">Đang tải dữ liệu…</div>}

        {!loading && !items.length && (
          <div className="empty">Không tìm thấy bài viết phù hợp.</div>
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
            <span className="catcard-pill">
              {b?.category?.name || catName}
            </span>
          </Link>
        ))}
      </section>

      {totalPages > 1 && (
        <div className="pager-num">
          <button
            className="page-nav"
            disabled={page <= 1}
            onClick={() => navigate(buildPath(page - 1))}
            aria-label="Trang trước"
          >
            ‹
          </button>

          {pages.map((n) => (
            <button
              key={n}
              className={`page-btn ${n === page ? 'active' : ''}`}
              onClick={() => navigate(buildPath(n))}
            >
              {n}
            </button>
          ))}

          <button
            className="page-nav"
            disabled={page >= totalPages}
            onClick={() => navigate(buildPath(page + 1))}
            aria-label="Trang sau"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
