// src/components/teacher/TeacherMetrics.jsx
import React, { useEffect, useState } from 'react';
import { apiGetTeacherMetrics } from '@/apis/teacher';
import '@/styles/teacher/TeacherMetrics.css';

const pct = (v) => (v == null ? null : Math.round(v * 100));
const fmtPct = (v) => (v == null ? 'Chưa đủ dữ liệu' : `${pct(v)}%`);

// dir = 'up'  : càng cao càng tốt (on_time_rate, repeat, renewal)
// dir = 'down': càng thấp càng tốt (cancel_rate, refund_rate)
const grade = (v, dir = 'up', goodWarn = [0.9, 0.8]) => {
  if (v == null) return 'na';
  const x = Math.max(0, Math.min(1, Number(v)));
  if (dir === 'up') {
    if (x >= goodWarn[0]) return 'good';
    if (x >= goodWarn[1]) return 'warn';
    return 'bad';
  }
  // down
  const [goodMax, warnMax] = goodWarn; // ví dụ: [0.05, 0.15]
  if (x <= goodMax) return 'good';
  if (x <= warnMax) return 'warn';
  return 'bad';
};

/**
 * TeacherMetrics
 * Props:
 * - teacherId: number|string (bắt buộc)
 * - onViewReviews?: () => void  (click "Xem tất cả nhận xét")
 * - className?: string
 */
export default function TeacherMetrics({ teacherId, onViewReviews, className = '' }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const { data } = await apiGetTeacherMetrics(teacherId);
        if (alive) setMetrics(data);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [teacherId]);

  if (loading || !metrics) {
    return (
      <div className={`kpi-card ${className}`}>
        <div className="kpi-head">
          <h5>Tiêu chuẩn giáo viên</h5>
          <span className="kpi-sub">Đang tải chỉ số…</span>
        </div>
      </div>
    );
  }

  const actDays = metrics?.windows?.activityDays || 90;
  const outDays = metrics?.windows?.outcomeDays || 180;

  // ===== lấy ngưỡng từ API (fallback nếu thiếu) =====
  const th = metrics?.thresholds || {};
  const thRepeat = th.repeat_up ?? [0.3, 0.15];
  const thOnTime = th.ontime_up ?? [0.95, 0.90];
  const thCancel = th.cancel_down ?? [0.05, 0.15];
  const thRefund = th.refund_down ?? [0.03, 0.08];
  const thRenew  = th.renewal_up ?? [0.25, 0.15];

  return (
    <>
      <div className={`tp-kpis ${className}`}>
        {/* A. Hoạt động */}
        <div className="kpi-card">
          <div className="kpi-head">
            <h5>Hoạt động {actDays} ngày</h5>
            <span className="kpi-sub">
              Cập nhật: {new Date(metrics.computedAt).toLocaleString()}
            </span>
          </div>
          <div className="kpi-rows">
            <div className="kpi-row">
              <span>Buổi đã dạy</span>
              <strong>{metrics.activity.completed_lessons_90d}</strong>
            </div>
            <div className="kpi-row">
              <span>Học viên đã dạy</span>
              <strong>{metrics.activity.unique_students_90d}</strong>
            </div>
            <div className="kpi-row">
              <span>Tỉ lệ quay lại</span>
              <span className={`badge ${grade(metrics.activity.repeat_student_rate, 'up', thRepeat)}`}>
                {fmtPct(metrics.activity.repeat_student_rate)}
              </span>
            </div>
          </div>
        </div>

        {/* B. Độ tin cậy */}
        <div className="kpi-card">
          <div className="kpi-head">
            <h5>Độ tin cậy</h5>
            <span className="kpi-sub">Trong {actDays} ngày</span>
          </div>
          <div className="kpi-rows">
            <div className="kpi-row">
              <span>Hủy bởi GV</span>
              <span className={`badge ${grade(metrics.reliability.cancel_rate_teacher, 'down', thCancel)}`}>
                {fmtPct(metrics.reliability.cancel_rate_teacher)}
              </span>
            </div>
            <div className="kpi-row">
              <span>Đúng giờ (≤ 5’)</span>
              <span className={`badge ${grade(metrics.reliability.on_time_rate, 'up', thOnTime)}`}>
                {fmtPct(metrics.reliability.on_time_rate)}
              </span>
            </div>
          </div>
        </div>

        {/* D. Kết quả */}
        <div className="kpi-card">
          <div className="kpi-head">
            <h5>Kết quả</h5>
            <span className="kpi-sub">Cửa sổ {outDays} ngày</span>
          </div>
          <div className="kpi-rows">
            <div className="kpi-row">
              <span>Gia hạn / đăng ký thêm</span>
              <span className={`badge ${grade(metrics.outcomes.renewal_rate, 'up', thRenew)}`}>
                {fmtPct(metrics.outcomes.renewal_rate)}
              </span>
            </div>
            <div className="kpi-row">
              <span>Hoàn phí (mẫu đủ ĐK)</span>
              <span className={`badge ${grade(metrics.outcomes.refund_rate_eligible, 'down', thRefund)}`}>
                {fmtPct(metrics.outcomes.refund_rate_eligible)}
              </span>
            </div>
          </div>
        </div>

        {/* E. Cảm nhận học viên */}
        <div className="kpi-card">
          <div className="kpi-head">
            <h5>Cảm nhận học viên</h5>
            <span className="kpi-sub">3 nhận xét gần nhất</span>
          </div>
          <ul className="mini-reviews">
            {(metrics.recentReviews || []).length === 0 && (
              <li className="muted">Chưa có nhận xét.</li>
            )}
            {(metrics.recentReviews || []).map((r) => (
              <li key={r.id}>
                <span className="stars">★ {r.rating}</span>
                <span className="mr-name">{r.studentName || 'Học viên ẩn danh'}</span>
                <span className="mr-time">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
          {onViewReviews && (
            <button className="link-btn" onClick={onViewReviews}>
              Xem tất cả nhận xét →
            </button>
          )}
        </div>
      </div>
      <p className="muted tip">
        * Các chỉ số và ngưỡng đánh giá được cập nhật tự động từ hệ thống.
      </p>
    </>
  );
}
