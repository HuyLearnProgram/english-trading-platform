import React from "react";


function StarBar({ rating = 0 }) {
  const pct = Math.max(0, Math.min(100, (Number(rating) || 0) * 20));
  return (
    <div className="ant-stars">
      <div className="ant-stars-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function TeacherCard({ t }) {
    const rating = Number(t.rating || 0).toFixed(2);
    return (
      <div className="ant-result-item">
        <div className="ant-avatar-col">
          <a className="ant-avatar-link" href={`/teacher/${t.id}`} target="_blank" rel="noreferrer">
            <img src={t.avatarUrl || `https://i.pravatar.cc/400?u=${t.id}`} alt={t.fullName} />
          </a>
  
          <div className="ant-media-wrapper">
            <button className="ant-media-circle" title="Listen profile intro">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <g transform="translate(0,0)" strokeWidth="2" fill="none" stroke="#fff">
                  <path d="M23,15v-3 c0-6.1-4.9-11-11-11S1,5.9,1,12v3" />
                  <path d="M7,15H1v6 c0,1.1,.9,2,2,2h4V15z" />
                  <path d="M23,15h-6v8h4 c1.1,0,2-.9,2-2V15z" />
                </g>
              </svg>
            </button>
            <button className="ant-media-circle" title="Watch intro video">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <g transform="translate(0,0)" strokeWidth="2" fill="none" stroke="#fff">
                  <line x1="1" y1="1" x2="1" y2="23" />
                  <line x1="23" y1="1" x2="23" y2="23" />
                  <rect x="5" y="1" width="14" height="22" />
                  <line x1="1" y1="12" x2="23" y2="12" />
                </g>
              </svg>
            </button>
          </div>
  
          <div className="ant-status available">Available</div>
        </div>
  
        <div className="ant-details-col">
          <div className="ant-name-row">
            <a className="ant-teacher-name" href={`/teacher/${t.id}`} target="_blank" rel="noreferrer">
              {t.fullName}
            </a>
            <a className="btn btn-sm green-btn ant-detail-btn" href={`/teacher/${t.id}`} target="_blank" rel="noreferrer">
              Xem chi tiết
            </a>
          </div>
  
          <div className="ant-rate-row">
            <StarBar rating={t.rating || 0} />
            <span className="ant-score">
              {rating} 
            </span>
            <span className="ant-reviewers">
              <svg viewBox="0 0 16 16" width="12" height="12">
                <g transform="translate(0,0)" stroke="#455a6d" fill="none">
                  <line x1="10" y1="3" x2="13" y2="6" />
                  <polygon points="12,1 15,4 5,14 1,15 2,11" />
                </g>
              </svg>
              &nbsp;{t.reviewsCount || 0} Nhận xét
            </span>
          </div>
  
          <div className="ant-nation">
            <span>{t.country || "Vietnam"}</span>
            <span className="ant-flag">{t.country === "Philippines" ? "🇵🇭" : t.country === "South Africa" ? "🇿🇦" : "🇻🇳"}</span>
          </div>
  
          <div className="ant-quote" />
          {t.lastReview && (
            <div className="ant-review media">
              <div className="media-left media-top">
                <img className="media-object" src="https://static.antoree.com/avatar.png" alt="avatar"/>
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