// src/components/order/TimeEstimateBox.jsx
import React from 'react';

export default function TimeEstimateBox({ lessonsPerWeek, totalLessons, weeks, formatWeeks }) {
  return (
    <div className="box">
      <h4>Thời gian hoàn thành (ước tính)</h4>
      <div className="row"><span>Số buổi/tuần</span><span><strong>{lessonsPerWeek}</strong> buổi</span></div>
      <div className="row"><span>Tổng số buổi</span><span><strong>{totalLessons}</strong> buổi</span></div>
      <div className="row total"><span>Hoàn thành trong</span><strong>{formatWeeks(weeks)}</strong></div>
    </div>
  );
}
