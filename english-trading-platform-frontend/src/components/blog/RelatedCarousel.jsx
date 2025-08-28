import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "@styles/blog/RelatedCarousel.css";

const chunk2 = (arr) => {
  const out = [];
  for (let i = 0; i < arr.length; i += 2) out.push(arr.slice(i, i + 2));
  return out;
};

export default function RelatedCarousel({ items = [], placeholderImg }) {
  const slides = useMemo(() => chunk2(items), [items]);
  const [idx, setIdx] = useState(0);

  if (!slides.length) return null;

  const next = () => setIdx((i) => Math.min(i + 1, slides.length - 1));
  const prev = () => setIdx((i) => Math.max(i - 1, 0));

  return (
    <section className="relcar">
      <h3 className="related-title">Bài viết liên quan</h3>

      <div className="relcar-viewport">
        <div
          className="relcar-track"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {slides.map((pair, sIdx) => (
            <div className="relcar-slide" key={sIdx}>
              <div className="relcar-grid">
                {pair.map((r) => (
                  <Link
                    key={r.id}
                    to={`/customer/blog/${r.slug || r.id}`}
                    className="related-card"
                  >
                    <div className="thumb">
                      <img
                        src={r?.introImage?.src || placeholderImg}
                        alt={r.title}
                        loading="lazy"
                      />
                    </div>
                    <h4 className="related-item-title">{r.title}</h4>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          className="relcar-arrow relcar-prev"
          onClick={prev}
          disabled={idx === 0}
          aria-label="Xem trước"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              d="M15 18l-6-6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          className="relcar-arrow relcar-next"
          onClick={next}
          disabled={idx === slides.length - 1}
          aria-label="Xem tiếp"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              d="M9 6l6 6-6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className="relcar-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`relcar-dot ${i === idx ? "is-active" : ""}`}
            onClick={() => setIdx(i)}
            aria-label={`Tới slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
