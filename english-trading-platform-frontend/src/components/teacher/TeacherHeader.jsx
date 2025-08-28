import React, { useEffect, useRef, useState } from 'react';
import StarRow from '../common/StarRow';
import '@styles/teacher/TeacherHeader.css';

export default function TeacherHeader({ teacher, ratingAverage = 0, ratingTotal = 0, countryFlag = '🌍' }) {
  const t = teacher || {};
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const toggleAudio = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play().then(() => setPlaying(true)).catch(() => {}); // tránh lỗi autoplay
    }
  };

  // Khi audio kết thúc/hay lỗi -> reset trạng thái
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnded = () => setPlaying(false);
    const onPause = () => setPlaying(false);
    el.addEventListener('ended', onEnded);
    el.addEventListener('pause', onPause);
    return () => {
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('pause', onPause);
    };
  }, []);

  // Khi đổi giáo viên -> dừng audio nếu đang phát
  useEffect(() => {
    const el = audioRef.current;
    if (el) { el.pause(); el.currentTime = 0; }
    setPlaying(false);
  }, [t?.id]);

  return (
    <div className="tp-header">
      <div className="avatar">
        <img src={t.avatarUrl || 'https://static.antoree.com/avatar.png'} alt={t.fullName}/>
        {t.audioUrl && (
          <button
            className={`voice-btn ${playing ? 'is-playing' : ''}`}
            onClick={toggleAudio}
            aria-label={playing ? 'Dừng nghe' : 'Nghe giọng đọc'}
            title={playing ? 'Dừng' : 'Nghe thử'}
          >
            {/* đổi icon theo trạng thái */}
            {playing ? (
              <svg viewBox="0 0 24 24" width="18" height="18">
                <rect x="6" y="5" width="4" height="14" fill="#fff"/>
                <rect x="14" y="5" width="4" height="14" fill="#fff"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M8 5v14l11-7z" fill="#fff"/>
              </svg>
            )}
          </button>
        )}
        {t.audioUrl && <audio ref={audioRef} src={t.audioUrl} preload="none" />}
      </div>

      <div className="info">
        <h3 className="name">
          {t.fullName}
          <span className="country"><span className="flag">{countryFlag}</span> {t.country || ''}</span>
          <span className="status">Sẵn sàng</span>
        </h3>

        <div className="rating-line">
          <StarRow value={Number(ratingAverage || 0)} />
          <span className="score">({Number(ratingAverage || 0).toFixed(2)})</span>
          <span className="muted"> · {ratingTotal || 0} nhận xét</span>
        </div>
      </div>
    </div>
  );
}
