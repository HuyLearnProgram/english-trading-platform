// src/components/teacher/TeacherCard.jsx
import React from "react";

function StarBar({ rating = 0 }) {
  // rating: 0..5  -> % fill
  const pct = Math.max(0, Math.min(100, (Number(rating) || 0) * 20));
  return (
    <div className="ant-stars">
      <div className="ant-stars-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function TeacherCard({ t }) {
  // Lấy thống kê thực từ API mới; fallback về cột cũ nếu cần
  const avg = Number(t.ratingAverage ?? t.rating ?? 0);
  const cnt = Number(t.reviewsCountComputed ?? t.reviewsCount ?? 0);

  const detailsUrl = `/teacher/${t.id}`;

  const flag = (() => {
    const s = (t.country || "").toLowerCase();
    if (s.includes("phil")) return "🇵🇭";
    if (s.includes("south africa")) return "🇿🇦";
    if (s.includes("viet")) return "🇻🇳";
    return "🌍";
  })();

  return (
    <div className="ant-result-item">
      <div className="ant-avatar-col">
        <a className="ant-avatar-link" href={detailsUrl} target="_blank" rel="noreferrer">
          <img
            src={t.avatarUrl || `https://i.pravatar.cc/400?u=${t.id}`}
            alt={t.fullName}
          />
        </a>

        <div className="ant-media-wrapper">
          {t.audioUrl && (
            <button className="ant-media-circle" title="Listen profile intro">🎧</button>
          )}
          {t.demoVideoUrl && (
            <button className="ant-media-circle" title="Watch intro video">🎞️</button>
          )}
        </div>

        <div className="ant-status available">Available</div>
      </div>

      <div className="ant-details-col">
        <div className="ant-name-row">
          <a className="ant-teacher-name" href={detailsUrl} target="_blank" rel="noreferrer">
            {t.fullName}
          </a>
          <a className="btn btn-sm green-btn ant-detail-btn" href={detailsUrl} target="_blank" rel="noreferrer">
            Xem chi tiết
          </a>
        </div>

        <div className="ant-rate-row">
          <StarBar rating={avg} />
          <span className="ant-score">{avg.toFixed(2)}</span>
          <span className="ant-reviewers">
            <svg viewBox="0 0 16 16" width="12" height="12">
              <g transform="translate(0,0)" stroke="#455a6d" fill="none">
                <line x1="10" y1="3" x2="13" y2="6" />
                <polygon points="12,1 15,4 5,14 1,15 2,11" />
              </g>
            </svg>
            &nbsp;{cnt} Nhận xét
          </span>
        </div>

        <div className="ant-nation">
          <span>{t.country || "—"}</span>
          <span className="ant-flag" style={{ marginLeft: 6 }}>{flag}</span>
        </div>

        {t.headline && <div className="ant-quote">{t.headline}</div>}

        {/* Nếu API có lastReview thì vẫn hiển thị, còn không thì bỏ qua */}
        {t.lastReview && (
          <div className="ant-review media">
            <div className="media-left media-top">
              <img className="media-object" src="https://static.antoree.com/avatar.png" alt="avatar" />
            </div>
            <div className="media-body">
              <div>
                <span className="ant-reviewer-name">{t.lastReview.author || "Học viên"}</span>
                &nbsp;Rating&nbsp;<span className="number">{Number(t.lastReview.rating || 0).toFixed(2)}</span>
              </div>
              <p>{t.lastReview.comment}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
