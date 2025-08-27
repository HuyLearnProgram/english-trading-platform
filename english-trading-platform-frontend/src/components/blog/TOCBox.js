import React, { useRef } from "react";
import "@styles/blog/TOCBox.css"; // Ensure you have the correct CSS for styling

const TOCItem = ({ item, level = 0 }) => (
  <li className={`tocb-item level-${level}`}>
    <a href={`#${item.id}`}>{item.label}</a>
    {Array.isArray(item.children) && item.children.length > 0 && (
      <ol className="tocb-children">
        {item.children.map((c) => (
          <TOCItem key={c.id} item={c} level={level + 1} />
        ))}
      </ol>
    )}
  </li>
);

const TOCBox = ({ toc = [], title = "Mục lục bài viết", maxHeight = 420 }) => {
  const ref = useRef(null);
  if (!Array.isArray(toc) || toc.length === 0) return null;
  const scrollBy = (delta) => ref.current?.scrollBy({ top: delta, behavior: "smooth" });

  return (
    <section className="tocb" aria-labelledby="tocb-title">
      <div className="tocb-head">
        <div className="tocb-title" id="tocb-title">
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {title}
        </div>
        <div className="tocb-actions">
          <button type="button" aria-label="Cuộn lên" onClick={() => scrollBy(-220)}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M18 15L12 9 6 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
          <button type="button" aria-label="Cuộn xuống" onClick={() => scrollBy(220)}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>

      <div className="tocb-body" ref={ref} style={{ maxHeight }}>
        <ol className="tocb-list">
          {toc.map((t) => (
            <TOCItem key={t.id} item={t} />
          ))}
        </ol>
      </div>
    </section>
  );
};

export default TOCBox;
