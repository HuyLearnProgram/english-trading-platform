import React from 'react';
import StarRow from '../common/StarRow';
import '@styles/teacher/TeacherHeader.css';

export default function TeacherHeader({ teacher, ratingAverage = 0, ratingTotal = 0, countryFlag = '🌍' }) {
  const t = teacher || {};
  return (
    <div className="tp-header">
      <div className="avatar">
        <img src={t.avatarUrl || 'https://static.antoree.com/avatar.png'} alt={t.fullName}/>
        {t.audioUrl && (
          <button className="voice-btn" onClick={()=>document.getElementById('audio-player')?.play()} aria-label="Nghe giọng đọc">
            <svg viewBox="0 0 24 24"><path d="M3 10v4h4l5 5V5L7 10H3zM14 12c0-1.77 1.02-3.29 2.5-4.03v8.06A4.495 4.495 0 0 1 14 12zm2.5-9v2.06C13.91 6.07 12 8.88 12 12s1.91 5.93 4.5 6.94V21C10.97 19.9 8 16.3 8 12s2.97-7.9 8.5-9z"/></svg>
          </button>
        )}
        {t.audioUrl && <audio id="audio-player" src={t.audioUrl} />}
      </div>

      <div className="info">
        <h3 className="name">
          {t.fullName}
          <span className="country"><span className="flag">{countryFlag}</span> {t.country || ''}</span>
          <span className="status">Sẵn sàng</span>
        </h3>

        <div className="rating-line">
          <StarRow value={Number(ratingAverage || 0)} />
          <span  className="score">({Number(ratingAverage || 0).toFixed(2)})</span>
          <span className="muted"> · {ratingTotal || 0} nhận xét</span>
        </div>
      </div>
    </div>
  );
}
