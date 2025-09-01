// src/components/order/LessonsPerWeekSelector.jsx
import React from 'react';

export default function LessonsPerWeekSelector({ maxWeek, value, onChange, submitting }) {
  return (
    <div className="box">
      <h4>Chọn số buổi mỗi tuần</h4>
      <div className="choice-5">
        {Array.from({ length: Math.max(1, Math.min(5, maxWeek || 1)) }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            className={`plan-item ${value === n ? 'active' : ''}`}
            onClick={() => onChange(n)}
            disabled={submitting}
          >
            <div className="p-title text-center">{n} buổi</div>
          </button>
        ))}
      </div>
    </div>
  );
}