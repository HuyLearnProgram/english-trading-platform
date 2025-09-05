import React, { useEffect, useMemo, useRef, useState, useContext } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AuthContext } from '@contexts/AuthContext';
import { apiGetStudentCalendarByUser } from '@apis/students';
import '@styles/calendar/StudentCalendar.css';
import { avatarUrlPlaceholder } from '@utils/constants';

/** ====== Utils ngày tháng ====== */
const VN_DOW = ['CN','T2','T3','T4','T5','T6','T7']; // Sunday-first

const toDate = (yyyyMmDd) => {
  const [y,m,d] = yyyyMmDd.split('-').map(Number);
  return new Date(y, m-1, d);
};
const sameDate = (a,b) =>
  a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
const stripComma = (s) => s.replace(',', '');
const monthLabel = (d, locale='vi-VN') =>
  stripComma(new Intl.DateTimeFormat(locale, { month:'long', year:'numeric' }).format(d));

function startOfMonth(d){ return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d){ return new Date(d.getFullYear(), d.getMonth()+1, 0); }

/** CN→T7; chỉ ngày của THÁNG hiện tại; thêm ô trống để canh lưới */
function buildMonthCells(monthDate){
  const first = startOfMonth(monthDate);
  const last  = endOfMonth(monthDate);
  const daysCount = last.getDate();

  const leadBlanks = first.getDay(); // 0=CN..6=T7
  const cells = [];

  for (let i=0; i<leadBlanks; i++) cells.push(null);
  for (let d=1; d<=daysCount; d++){
    cells.push(new Date(first.getFullYear(), first.getMonth(), d));
  }
  const rows = Math.ceil(cells.length / 7);
  const total = rows * 7;
  while (cells.length < total) cells.push(null);

  return cells;
}

/** Gom events theo key YYYY-MM-DD, và sort trong ngày theo giờ */
function groupByDate(events){
  const map = {};
  for(const e of events || []){
    const key = e.date;
    if(!map[key]) map[key] = [];
    map[key].push(e);
  }
  Object.values(map).forEach(list => list.sort((a,b)=>(a.start < b.start ? -1 : 1)));
  return map;
}

/** ====== Popover chi tiết (cố định & tự reposition) ====== */
function EventPopover({ anchorEl, onClose, event }) {
  const ref = useRef(null);
  const [style, setStyle] = useState({});

  // Đóng khi click ngoài / Esc
  useEffect(() => {
    const onDoc = (e) => { if(ref.current && !ref.current.contains(e.target)) onClose?.(); };
    const onEsc = (e) => e.key==='Escape' && onClose?.();
    document.addEventListener('mousedown', onDoc, { passive:true });
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [onClose]);

  // Reposition theo anchor element khi scroll/resize
  useEffect(() => {
    const POP_W = 360, POP_H = 260;
    const sync = () => {
      if (!anchorEl) return;
      const r = anchorEl.getBoundingClientRect();
      const top  = Math.min(r.bottom + 8, window.innerHeight - POP_H);
      const left = Math.min(r.left,   window.innerWidth  - POP_W);
      setStyle({
        position: 'fixed',
        top: Math.max(8, top),
        left: Math.max(8, left),
        width: POP_W,
        zIndex: 50
      });
    };
    sync();
    window.addEventListener('resize', sync);
    document.addEventListener('scroll', sync, true);
    return () => {
      window.removeEventListener('resize', sync);
      document.removeEventListener('scroll', sync, true);
    };
  }, [anchorEl]);

  return (
    <div ref={ref} className="cal-popover" role="dialog" style={style}>
      <div className="cal-popover-header">
        <div className="cal-popover-title">Bài học #{event?.lessonNo}</div>
        {/* avatar + tên ở góc phải header */}
        <div className="cal-popover-teacher">
          <img
            className="avatar"
            src={event?.teacherAvatarUrl}
            alt={event?.teacherName || 'Teacher'}
          />
          <span className="name">{event?.teacherName || `Gia sư #${event?.teacherId}`}</span>
        </div>
        <button className="cal-icon-btn" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <div className="cal-popover-body">
        <div className="cal-popover-row cal-popover-date">
          {new Intl.DateTimeFormat('vi-VN', {
            weekday:'long', day:'2-digit', month:'2-digit', year:'numeric'
          }).format(toDate(event.date))}
        </div>

        <div className="cal-badges">
          <span className="cal-badge muted">Cá nhân 1 kèm 1</span>
          <span className="cal-badge muted">Bài học thử</span>
        </div>

        <ul className="cal-detail-list">
          <li>⏱ {event.start}–{event.end} ({event.lessonLength ?? 45} phút)</li>
          <li>👤 Bài học với <b>{event.teacherName || `Gia sư #${event.teacherId}`}</b></li>
          <li>🌐 Múi giờ: {event.timezone}</li>
        </ul>
      </div>

      <div className="cal-popover-footer">
        <button className="cal-btn primary" onClick={onClose}>Đóng</button>
        <button className="cal-btn ghost" onClick={onClose}>+ đặt thêm một lịch học khác</button>
      </div>
    </div>
  );
}

/** ====== Trang chính ====== */
const StudentCalendarPage = () => {
  const { user } = useContext(AuthContext);
  const { userId: routeUserId } = useParams();
  const [search] = useSearchParams();
  const sidFromQuery = search.get('sid');
  const userId = Number(routeUserId || sidFromQuery || user?.id);

  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [calendar, setCalendar] = useState(null); // {timezone, entries:[{...}]}
  const [cursorMonth, setCursorMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [popover, setPopover] = useState(null); // {anchorEl, event}

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await apiGetStudentCalendarByUser(userId);
        if(!alive) return;
        setCalendar(data);

        // => Lấy ngày bắt đầu SỚM NHẤT trong mọi entries để set tháng ban đầu
        const firstDate = (data?.entries ?? [])
          .map(e => e.startDate)
          .filter(Boolean)
          .sort()?.[0];
        if(firstDate){
          const d = toDate(firstDate);
          setCursorMonth(new Date(d.getFullYear(), d.getMonth(), 1));
        }
        setError('');
      } catch (e) {
        setError(e?.message || 'Không tải được lịch học');
      } finally {
        if(alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [userId]);

  const studentTz = calendar?.timezone || 'Asia/Ho_Chi_Minh';

  /** GỘP tất cả events từ mọi enrollment, gắn meta (teacherId, lessonLength, timezone, enrollmentId) */
  const allEvents = useMemo(() => {
    const out = [];
    for (const entry of (calendar?.entries ?? [])) {
      const tz = entry?.timezone || studentTz;
      const len = entry?.lessonLength ?? 45;
      const teacherId = entry?.teacherId;
      const enrollmentId = entry?.enrollmentId;
      const teacherName = entry?.teacherName || '';
      const teacherAvatarUrl = entry?.teacherAvatarUrl || avatarUrlPlaceholder;
      for (const ev of (entry?.events ?? [])) {
        out.push({ ...ev, timezone: tz, lessonLength: len, teacherId, teacherName, teacherAvatarUrl, enrollmentId });
      }
    }
    return out;
  }, [calendar, studentTz]);

  const eventsByDate = useMemo(() => groupByDate(allEvents), [allEvents]);

  /** CN→T7; chỉ ngày trong tháng */
  const cells = useMemo(() => buildMonthCells(cursorMonth), [cursorMonth]);

  // Past/Future/TODAY styling
  const today = new Date();
  const todayY = today.getFullYear(), todayM = today.getMonth(), todayD = today.getDate();
  const isPastDay = (d) =>
    d && (d.getFullYear() < todayY ||
    (d.getFullYear() === todayY && (d.getMonth() < todayM ||
    (d.getMonth() === todayM && d.getDate() < todayD))));

  const gotoPrev = () => setCursorMonth(new Date(cursorMonth.getFullYear(), cursorMonth.getMonth()-1, 1));
  const gotoNext = () => setCursorMonth(new Date(cursorMonth.getFullYear(), cursorMonth.getMonth()+1, 1));
  const gotoToday = () => {
    const t = new Date();
    setCursorMonth(new Date(t.getFullYear(), t.getMonth(), 1));
  };

  // Tổng kết (footer)
  const summary = useMemo(() => {
    const entries = calendar?.entries ?? [];
    const totalLessons = entries.reduce((s, e) => s + (e.lessons || 0), 0);
    const startMin = entries.map(e=>e.startDate).filter(Boolean).sort()?.[0];
    const endMax   = entries.map(e=>e.endDate).filter(Boolean).sort()?.slice(-1)[0];
    return { totalLessons, startMin, endMax };
  }, [calendar]);

  return (
    <div className="cal-page">
      <div className="cal-toolbar">
        <div className="cal-title">{monthLabel(cursorMonth, 'vi-VN')}</div>
        <div className="cal-actions">
          <button className="cal-icon-btn" aria-label="Previous month" onClick={gotoPrev}>❮</button>
          <button className="cal-icon-btn" aria-label="Next month" onClick={gotoNext}>❯</button>
          <button className="cal-btn ghost" onClick={gotoToday}>Hôm nay</button>
        </div>
      </div>

      {loading && <div className="cal-loading">Đang tải lịch…</div>}
      {error && !loading && (
        <div className="cal-error">
          {error} — hãy đảm bảo đúng <code>userId</code> (route: <code>/calendar/:userId</code> hoặc <code>?sid=</code>), và student có lịch.
        </div>
      )}

      {!loading && !error && (
        <div className="cal-grid-wrapper" id="calendar-schedule">
          <div className="cal-dow-row">
            {VN_DOW.map((d) => (
              <div key={d} className="cal-dow-cell">{d}</div>
            ))}
          </div>

          <div className="cal-grid">
            {cells.map((d, idx) => {
              if (!d) return <div key={idx} className="cal-day blank" aria-hidden="true" />;
              const y  = d.getFullYear(), m = d.getMonth()+1, dd = d.getDate();
              const key = `${y}-${String(m).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
              const dayEvents = eventsByDate[key] || [];
              const isToday = sameDate(d, today);
              const past = isPastDay(d);

              return (
                <div
                  key={idx}
                  className={`cal-day ${isToday ? 'today' : past ? 'past' : 'future'}`}
                >
                  <div className="cal-day-head">
                    <small>{dd}</small>
                    {dayEvents.length > 0 && (
                      <span className="cal-badge count" aria-label={`${dayEvents.length} events`}>{dayEvents.length}</span>
                    )}
                  </div>

                  <div className="cal-day-body">
                    {/* Hiển thị tối đa 2 event để cell không giãn cao; đã sort theo giờ trong groupByDate */}
                    {dayEvents.slice(0, 2).map((ev, i) => (
                      <button
                        key={i}
                        className="cal-event-chip"
                        onClick={(e) => setPopover({ anchorEl: e.currentTarget, event: ev })}
                        title={`${ev.start}–${ev.end} • ${ev.teacherName || `Gia sư #${ev.teacherId}`}`}
                      >
                        <span className="time">{ev.start}</span>
                        <span className="teacher">
                            <img
                            className="avatar"
                            src={ev.teacherAvatarUrl}
                            alt={ev.teacherName || 'Teacher'}
                            />
                            <span className="name">{ev.teacherName || `Gia sư #${ev.teacherId}`}</span>
                        </span>
                      </button>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="cal-more">+{dayEvents.length - 2} bài học nữa</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {popover && (
            <EventPopover
              anchorEl={popover.anchorEl}
              event={popover.event}
              onClose={() => setPopover(null)}
            />
          )}
        </div>
      )}

      {!loading && !error && (
        <div className="cal-footer">
          <span>Timezone: <b>{studentTz}</b></span>
          {!!summary.totalLessons && <span> · Tổng buổi (tất cả khóa): <b>{summary.totalLessons}</b></span>}
          {summary.startMin && summary.endMax && (
            <span> · Từ <b>{summary.startMin}</b> đến <b>{summary.endMax}</b></span>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentCalendarPage;
