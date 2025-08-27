import React from 'react';
import '@styles/common/StarRow.css';

export default function StarRow({ value = 0 }) {
  const v = Math.round(value);
  return (
    <div className="stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className={`star ${i < v ? 'on' : ''}`}>
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );
}
